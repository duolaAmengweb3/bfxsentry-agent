import crypto from 'node:crypto'
import https from 'node:https'
import { SocksProxyAgent } from 'socks-proxy-agent'
import type { TradeIntent, ExecutionResult } from '../strategy/types.js'
import type { AgentConfig } from '../core/config.js'
import { generateCid, markCidSubmitted, isCidSubmitted } from './order-id.js'
import { getLogger } from '../core/logger.js'

const log = () => getLogger()

const BFX_API_URL = 'api.bitfinex.com'

interface BfxCredentials {
  apiKey: string
  apiSecret: string
}

function getCredentials(): BfxCredentials | null {
  const apiKey = process.env.BFX_API_KEY
  const apiSecret = process.env.BFX_API_SECRET
  if (!apiKey || !apiSecret) return null
  return { apiKey, apiSecret }
}

function createSignature(path: string, nonce: string, body: string, secret: string): string {
  const payload = `/api/${path}${nonce}${body}`
  return crypto.createHmac('sha384', secret).update(payload).digest('hex')
}

function getAgent(): SocksProxyAgent | undefined {
  const proxy = process.env.SOCKS_PROXY || process.env.ALL_PROXY || 'socks5h://127.0.0.1:7897'
  try {
    return new SocksProxyAgent(proxy)
  } catch {
    return undefined
  }
}

async function authRequest(path: string, body: Record<string, unknown>, creds: BfxCredentials): Promise<unknown> {
  const nonce = Date.now().toString()
  const bodyStr = JSON.stringify(body)
  const sig = createSignature(path, nonce, bodyStr, creds.apiSecret)

  return new Promise((resolve, reject) => {
    const agent = getAgent()
    const options: https.RequestOptions = {
      hostname: BFX_API_URL,
      port: 443,
      path: `/api/${path}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'bfx-nonce': nonce,
        'bfx-apikey': creds.apiKey,
        'bfx-signature': sig,
      },
      agent,
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch { reject(new Error(data)) }
      })
    })
    req.on('error', reject)
    req.setTimeout(30_000, () => { req.destroy(); reject(new Error('Timeout')) })
    req.write(bodyStr)
    req.end()
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Returns true if the error is transient and worth retrying
function isRetryable(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    return msg.includes('timeout') || msg.includes('econnreset') ||
           msg.includes('econnrefused') || msg.includes('socket') ||
           msg.includes('network')
  }
  return false
}

function resolveOrderType(cfgType: 'limit' | 'market'): { bfxType: string; needsPrice: boolean } {
  if (cfgType === 'market') {
    return { bfxType: 'EXCHANGE MARKET', needsPrice: false }
  }
  return { bfxType: 'EXCHANGE LIMIT', needsPrice: true }
}

export async function liveExecute(intent: TradeIntent, cfg: AgentConfig): Promise<ExecutionResult> {
  const creds = getCredentials()
  if (!creds) {
    return {
      success: false,
      error: 'BFX_API_KEY / BFX_API_SECRET not set',
      timestamp: Date.now(),
    }
  }

  // Use CID from intent (assigned in engine) or generate a new one
  const cid = (intent.meta?.cid as string) || generateCid(intent.strategy)

  // Idempotency: reject if this exact CID was already submitted successfully
  if (isCidSubmitted(cid)) {
    log().warn({ cid }, 'CID already submitted, skipping duplicate')
    return { success: false, error: `Duplicate CID: ${cid}`, timestamp: Date.now() }
  }

  // Calculate amount: use meta.hedgeBtc for PM hedge, otherwise derive from sizePct
  let absAmount: number
  if (intent.meta?.hedgeBtc) {
    absAmount = intent.meta.hedgeBtc as number
  } else {
    const capitalUsd = parseFloat(process.env.BFX_CAPITAL_USD || '5000')
    absAmount = (intent.sizePct / 100) * capitalUsd / intent.entryPrice
  }
  const amount = intent.direction === 'long' ? absAmount : -absAmount

  // Use order type from risk config
  const { bfxType, needsPrice } = resolveOrderType(cfg.risk.order_type)
  const limitPrice = intent.direction === 'long'
    ? intent.entryPrice * (1 + (cfg.risk.limit_offset_pct / 100))
    : intent.entryPrice * (1 - (cfg.risk.limit_offset_pct / 100))

  const orderBody: Record<string, unknown> = {
    type: bfxType,
    symbol: intent.instrument,
    amount: amount.toString(),
    cid: parseInt(cid.replace(/\D/g, '').slice(-10)),
    meta: { aff_code: 'bfxsentry' },
  }
  if (needsPrice) {
    orderBody.price = limitPrice.toString()
  }

  // Retry loop with same CID for idempotent retries
  const maxAttempts = cfg.risk.retry?.max_attempts ?? 3
  const backoffMs = cfg.risk.retry?.backoff_ms ?? [1000, 3000, 5000]
  let lastErr: string = ''
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await authRequest('v2/auth/w/order/submit', orderBody, creds)

      const data = result as unknown[]
      if (Array.isArray(data) && data[6] === 'SUCCESS') {
        const order = (data[4] as unknown[])?.[0] as unknown[]
        markCidSubmitted(cid)
        log().info({
          cid,
          orderId: order?.[0],
          price: order?.[16],
          amount: order?.[6],
          attempt,
        }, 'Order submitted successfully')

        return {
          success: true,
          orderId: cid,
          exchangeOrderId: String(order?.[0] || ''),
          fillPrice: Number(order?.[16]) || limitPrice,
          fillSize: Math.abs(amount),
          fee: 0,
          timestamp: Date.now(),
        }
      }

      // API returned non-SUCCESS — this is a definitive rejection, don't retry
      const errMsg = Array.isArray(data) ? String(data[6] || data[2] || 'Unknown') : 'Unknown error'
      log().error({ result: data, attempt }, 'Order submission rejected by exchange')
      markCidSubmitted(cid) // Mark as submitted to prevent re-send
      return { success: false, orderId: cid, error: errMsg, timestamp: Date.now() }

    } catch (err) {
      lastErr = (err as Error).message
      log().warn({ err: lastErr, attempt, maxAttempts, cid }, 'Order attempt failed')

      if (!isRetryable(err) || attempt === maxAttempts) {
        break
      }

      const backoff = backoffMs[attempt - 1] ?? 5000
      log().info({ backoff, cid }, `Retrying with same CID in ${backoff}ms`)
      await sleep(backoff)
    }
  }

  // All retries exhausted
  const onMaxRetry = cfg.risk.retry?.on_max_retry ?? 'alert_and_skip'
  log().error({ cid, lastErr, onMaxRetry }, `Order failed after ${maxAttempts} attempts — ${onMaxRetry}`)
  return { success: false, orderId: cid, error: `Max retries: ${lastErr}`, timestamp: Date.now() }
}

// Close a position on the exchange by sending a counter market order
export async function liveClosePosition(
  instrument: string,
  direction: 'long' | 'short',
  size: number,
): Promise<{ success: boolean; error?: string }> {
  const creds = getCredentials()
  if (!creds) {
    return { success: false, error: 'BFX_API_KEY / BFX_API_SECRET not set' }
  }

  const cid = generateCid('shutdown-close')
  // Counter direction: if long, sell (negative amount); if short, buy (positive amount)
  const amount = direction === 'long' ? -size : size

  log().info({ instrument, direction, size, cid }, 'Sending exchange close order (market)')

  try {
    const result = await authRequest('v2/auth/w/order/submit', {
      type: 'EXCHANGE MARKET',
      symbol: instrument,
      amount: amount.toString(),
      cid: parseInt(cid.replace(/\D/g, '').slice(-10)),
      meta: { aff_code: 'bfxsentry' },
    }, creds)

    const data = result as unknown[]
    if (Array.isArray(data) && data[6] === 'SUCCESS') {
      log().info({ cid }, 'Close order submitted successfully')
      return { success: true }
    }

    const errMsg = Array.isArray(data) ? String(data[6] || data[2] || 'Unknown') : 'Unknown error'
    log().error({ result: data }, 'Close order rejected')
    return { success: false, error: errMsg }
  } catch (err) {
    log().error({ err }, 'Close order failed')
    return { success: false, error: (err as Error).message }
  }
}

import https from 'node:https'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { getLogger } from '../core/logger.js'

const log = () => getLogger()

export interface BasisSnapshot {
  timestamp: number
  bfxPrice: number
  binancePrice: number | null
  bfxVsBinance: number | null   // basis in bps
}

function getAgent(): SocksProxyAgent {
  const proxy = process.env.SOCKS_PROXY || process.env.ALL_PROXY || 'socks5h://127.0.0.1:7897'
  return new SocksProxyAgent(proxy)
}

async function fetchJsonProxy(url: string): Promise<unknown> {
  const agent = getAgent()
  return new Promise((resolve, reject) => {
    const req = https.get(url, { agent }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.setTimeout(10_000, () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

export async function fetchBinancePrice(): Promise<number | null> {
  try {
    const data = await fetchJsonProxy('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT') as Record<string, string>
    return parseFloat(data.price)
  } catch {
    return null
  }
}

export async function calculateBasis(bfxPrice: number): Promise<BasisSnapshot> {
  const binancePrice = await fetchBinancePrice()

  const bfxVsBinance = binancePrice
    ? ((bfxPrice - binancePrice) / binancePrice) * 10000 // in bps
    : null

  if (bfxVsBinance !== null && Math.abs(bfxVsBinance) > 15) {
    log().warn({ bfxPrice, binancePrice, basisBps: bfxVsBinance.toFixed(1) }, 'Basis divergence detected')
  }

  return {
    timestamp: Date.now(),
    bfxPrice,
    binancePrice,
    bfxVsBinance,
  }
}

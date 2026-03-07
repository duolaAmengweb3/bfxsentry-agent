import https from 'node:https'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { getLogger } from '../core/logger.js'
import type { AgentConfig } from '../core/config.js'

const log = () => getLogger()

export interface PmMarket {
  slug: string
  question: string
  window: '5m' | '15m' | '1h'
  endDate: string
  outcomes: string[]
  outcomePrices: number[]
  tokens: { token_id: string; outcome: string }[]
  active: boolean
  volume: number
}

export interface PmOrderbook {
  tokenId: string
  bids: { price: number; size: number }[]
  asks: { price: number; size: number }[]
  bestBid: number
  bestAsk: number
  spread: number
}

function getAgent(): SocksProxyAgent {
  const proxy = process.env.SOCKS_PROXY || process.env.ALL_PROXY || 'socks5h://127.0.0.1:7897'
  return new SocksProxyAgent(proxy)
}

async function fetchJsonProxy(url: string): Promise<unknown> {
  const agent = getAgent()
  return new Promise((resolve, reject) => {
    https.get(url, { agent }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

export async function fetchPmMarkets(cfg: AgentConfig): Promise<PmMarket[]> {
  const gammaUrl = cfg.collector.polymarket.gamma_url
  const windows: ('5m' | '15m' | '1h')[] = ['5m', '15m', '1h']
  const markets: PmMarket[] = []

  for (const window of windows) {
    try {
      // Search for active BTC Up/Down markets
      const now = Math.floor(Date.now() / 1000)
      const slug = `btc-updown-${window}-${now}`

      const url = `${gammaUrl}/markets?slug_contains=btc-updown-${window}&active=true&closed=false&limit=5`
      const data = await fetchJsonProxy(url) as Record<string, unknown>[]

      if (!Array.isArray(data)) continue

      for (const m of data) {
        const outcomes = JSON.parse((m.outcomes as string) || '[]') as string[]
        const prices = JSON.parse((m.outcomePrices as string) || '[]') as number[]
        const tokens = JSON.parse((m.clobTokenIds as string) || '[]') as string[]

        markets.push({
          slug: m.slug as string || '',
          question: m.question as string || '',
          window,
          endDate: m.endDate as string || '',
          outcomes,
          outcomePrices: prices.map(Number),
          tokens: tokens.map((tid, i) => ({ token_id: tid, outcome: outcomes[i] || '' })),
          active: m.active as boolean ?? true,
          volume: Number(m.volume || 0),
        })
      }
    } catch (e) {
      log().debug({ window, err: e }, 'PM market fetch failed for window')
    }
  }

  return markets
}

export async function fetchPmOrderbook(cfg: AgentConfig, tokenId: string): Promise<PmOrderbook | null> {
  try {
    const url = `${cfg.collector.polymarket.clob_url}/book?token_id=${tokenId}`
    const data = await fetchJsonProxy(url) as Record<string, unknown>

    const bids = ((data.bids as unknown[]) || []).map((b: unknown) => {
      const bid = b as Record<string, string>
      return { price: parseFloat(bid.price), size: parseFloat(bid.size) }
    })
    const asks = ((data.asks as unknown[]) || []).map((a: unknown) => {
      const ask = a as Record<string, string>
      return { price: parseFloat(ask.price), size: parseFloat(ask.size) }
    })

    const bestBid = bids[0]?.price || 0
    const bestAsk = asks[0]?.price || 1

    return {
      tokenId,
      bids,
      asks,
      bestBid,
      bestAsk,
      spread: bestAsk - bestBid,
    }
  } catch {
    return null
  }
}

import https from 'node:https'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { getLogger } from '../core/logger.js'
import type {
  TickerData, OrderbookLevel, OrderbookData, TradeEntry,
  LiquidationEntry, LiquidationAgg, FundingStatPoint,
  DerivStatus, WhaleEntry, TradeFlow, WallInfo, MarketSnapshot,
} from './types.js'
import type { AgentConfig } from '../core/config.js'

const log = () => getLogger()

function bfxUrl(cfg: AgentConfig) {
  return cfg.collector.bitfinex.base_url
}

// SOCKS5 proxy (auto-detect from env or fallback to local 7897)
function createProxyAgent(): SocksProxyAgent | undefined {
  const proxy = process.env.SOCKS_PROXY || process.env.ALL_PROXY
  if (proxy) return new SocksProxyAgent(proxy)
  return new SocksProxyAgent('socks5h://127.0.0.1:7897')
}

let useProxy = true // default: try proxy first (China network)

function httpsGet(url: string, agent?: SocksProxyAgent): Promise<string> {
  return new Promise((resolve, reject) => {
    const opts: https.RequestOptions = { agent }
    const req = https.get(url, opts, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpsGet(res.headers.location, agent).then(resolve, reject)
        return
      }
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        reject(new Error(`${url} → ${res.statusCode}`))
        return
      }
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.setTimeout(30_000, () => { req.destroy(); reject(new Error('Request timeout')) })
  })
}

const proxyAgent = createProxyAgent()

export async function fetchJson(url: string): Promise<unknown> {
  try {
    const raw = await httpsGet(url, useProxy ? proxyAgent : undefined)
    return JSON.parse(raw)
  } catch (err) {
    // If proxy failed, try direct
    if (useProxy) {
      log().debug('Proxy request failed, trying direct...')
      try {
        const raw = await httpsGet(url, undefined)
        useProxy = false
        log().info('Switched to direct connection')
        return JSON.parse(raw)
      } catch {
        throw err // throw original proxy error
      }
    }
    throw err
  }
}

// ── Ticker ──

export async function fetchTicker(cfg: AgentConfig): Promise<TickerData> {
  const sym = cfg.collector.bitfinex.symbol
  const data = await fetchJson(`${bfxUrl(cfg)}/v2/ticker/${sym}`) as number[]
  return {
    bid: data[0], bidSize: data[1], ask: data[2], askSize: data[3],
    dailyChange: data[4], dailyChangePct: data[5], lastPrice: data[6],
    volume: data[7], high: data[8], low: data[9],
  }
}

// ── Orderbook ──

export async function fetchOrderbook(cfg: AgentConfig, len = 25): Promise<OrderbookData> {
  const sym = cfg.collector.bitfinex.symbol
  const raw = await fetchJson(`${bfxUrl(cfg)}/v2/book/${sym}/P0?len=${len}`) as number[][]
  const bids: OrderbookLevel[] = []
  const asks: OrderbookLevel[] = []

  for (const row of raw) {
    const [price, count, amount] = row
    if (amount > 0) bids.push({ price, count, amount })
    else asks.push({ price, count, amount: Math.abs(amount) })
  }

  bids.sort((a, b) => b.price - a.price)
  asks.sort((a, b) => a.price - b.price)

  const mid = bids[0] && asks[0] ? (bids[0].price + asks[0].price) / 2 : 0

  const calcDepth = (levels: OrderbookLevel[], pct: number, side: 'bid' | 'ask') => {
    const threshold = side === 'bid' ? mid * (1 - pct / 100) : mid * (1 + pct / 100)
    return levels
      .filter(l => side === 'bid' ? l.price >= threshold : l.price <= threshold)
      .reduce((s, l) => s + l.amount, 0)
  }

  // Detect walls
  const allAmounts = [...bids, ...asks].map(l => l.amount)
  const avgSize = allAmounts.length > 0 ? allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length : 0
  const wallThreshold = avgSize * 5

  const walls: WallInfo[] = []
  for (const b of bids) {
    if (b.amount >= wallThreshold) {
      walls.push({ side: 'bid', price: b.price, amount: b.amount, multiplier: b.amount / avgSize })
    }
  }
  for (const a of asks) {
    if (a.amount >= wallThreshold) {
      walls.push({ side: 'ask', price: a.price, amount: a.amount, multiplier: a.amount / avgSize })
    }
  }

  return {
    bids, asks,
    bidDepth02: calcDepth(bids, 0.2, 'bid'),
    bidDepth05: calcDepth(bids, 0.5, 'bid'),
    bidDepth10: calcDepth(bids, 1.0, 'bid'),
    askDepth02: calcDepth(asks, 0.2, 'ask'),
    askDepth05: calcDepth(asks, 0.5, 'ask'),
    askDepth10: calcDepth(asks, 1.0, 'ask'),
    walls,
  }
}

// ── Trades ──

export async function fetchTrades(cfg: AgentConfig, limit = 200): Promise<TradeEntry[]> {
  const sym = cfg.collector.bitfinex.symbol
  const raw = await fetchJson(`${bfxUrl(cfg)}/v2/trades/${sym}/hist?limit=${limit}`) as number[][]
  return raw.map(r => ({
    id: r[0],
    timestamp: r[1],
    amount: Math.abs(r[2]),
    price: r[3],
    side: (r[2] > 0 ? 'buy' : 'sell') as 'buy' | 'sell',
  }))
}

export function aggregateTradeFlow(trades: TradeEntry[]): TradeFlow {
  const now = Date.now()
  const window = (sec: number) => trades.filter(t => t.timestamp >= now - sec * 1000)
  const w30 = window(30)
  const w60 = window(60)
  const w5m = window(300)

  const buyVol = (ts: TradeEntry[]) => ts.filter(t => t.side === 'buy').reduce((s, t) => s + t.amount, 0)
  const sellVol = (ts: TradeEntry[]) => ts.filter(t => t.side === 'sell').reduce((s, t) => s + t.amount, 0)

  const bv60 = buyVol(w60)
  const sv60 = sellVol(w60)
  const total60 = bv60 + sv60

  return {
    buyVol30s: buyVol(w30), sellVol30s: sellVol(w30),
    buyVol60s: bv60, sellVol60s: sv60,
    buyVol5m: buyVol(w5m), sellVol5m: sellVol(w5m),
    buyCount60s: w60.filter(t => t.side === 'buy').length,
    sellCount60s: w60.filter(t => t.side === 'sell').length,
    netFlow60s: bv60 - sv60,
    buyRatio60s: total60 > 0 ? bv60 / total60 : 0.5,
  }
}

// ── Liquidations ──

export async function fetchLiquidations(cfg: AgentConfig, limit = 500): Promise<LiquidationEntry[]> {
  const now = Date.now()
  const start = now - 24 * 60 * 60 * 1000
  const url = `${bfxUrl(cfg)}/v2/liquidations/hist?limit=${limit}&start=${start}&end=${now}`
  const raw = await fetchJson(url) as unknown[][]

  // Format: [["pos", id, ts, null, symbol, amount, price, null, flag, flag2, null, settlementPrice]]
  return raw.map((outer) => {
    const item = (outer as unknown[])[0] as unknown[]
    if (!item || !Array.isArray(item)) return null
    const amount = Math.abs(item[5] as number || 0)
    const price = item[6] as number || 0
    if (amount === 0 || price === 0) return null
    return {
      id: item[1] as number,
      timestamp: item[2] as number,
      symbol: (item[4] as string) || '',
      amount,
      price,
      side: ((item[5] as number) > 0 ? 'short' : 'long') as 'long' | 'short',
      usdValue: amount * price,
    }
  }).filter((x): x is LiquidationEntry => x !== null)
}

export function aggregateLiquidations(liqs: LiquidationEntry[]) {
  const now = Date.now()
  const agg = (sec: number): LiquidationAgg => {
    const window = liqs.filter(l => l.timestamp >= now - sec * 1000)
    const longUsd = window.filter(l => l.side === 'long').reduce((s, l) => s + l.usdValue, 0)
    const shortUsd = window.filter(l => l.side === 'short').reduce((s, l) => s + l.usdValue, 0)
    return { longUsd, shortUsd, total: longUsd + shortUsd, count: window.length }
  }
  return {
    w1m: agg(60), w5m: agg(300), w15m: agg(900), w1h: agg(3600), w24h: agg(86400),
  }
}

export function calcLiqIntensityPercentile(liqs: LiquidationEntry[]): number {
  if (liqs.length === 0) return 0
  const now = Date.now()
  const buckets: number[] = []
  const start = Math.min(...liqs.map(l => l.timestamp))
  if (!isFinite(start)) return 0

  for (let t = start; t < now; t += 60_000) {
    const bucket = liqs.filter(l => l.timestamp >= t && l.timestamp < t + 60_000)
    buckets.push(bucket.reduce((s, l) => s + l.usdValue, 0))
  }
  if (buckets.length === 0) return 0

  const currentBucket = liqs.filter(l => l.timestamp >= now - 60_000).reduce((s, l) => s + l.usdValue, 0)
  const sorted = [...buckets].sort((a, b) => a - b)
  const idx = sorted.findIndex(v => v >= currentBucket)
  return idx >= 0 ? idx / sorted.length : 1
}

// ── Funding ──

export async function fetchFundingStats(cfg: AgentConfig, limit = 168): Promise<FundingStatPoint[]> {
  const sym = cfg.collector.bitfinex.funding_symbol
  const raw = await fetchJson(`${bfxUrl(cfg)}/v2/funding/stats/${sym}/hist?limit=${limit}`) as unknown[][]
  return raw.map(item => {
    const total = (item[7] as number) || 0
    const used = (item[8] as number) || 0
    return {
      timestamp: item[0] as number,
      frr: item[3] as number,
      avgPeriod: item[4] as number,
      totalAmount: total,
      usedAmount: used,
      utilization: total > 0 ? used / total : 0,
    }
  })
}

// ── Derivatives Status ──

export async function fetchDerivStatus(cfg: AgentConfig): Promise<DerivStatus | null> {
  const keys = cfg.collector.bitfinex.deriv_symbol
  try {
    const raw = await fetchJson(`${bfxUrl(cfg)}/v2/status/deriv?keys=${keys}`) as unknown[][]
    if (!raw[0]) return null
    const d = raw[0]
    return {
      fundingRate: d[12] as number || 0,
      nextFundingTs: d[13] as number || 0,
      markPrice: d[15] as number || 0,
      spotPrice: d[2] as number || 0,
      openInterest: d[18] as number || 0,
    }
  } catch {
    return null
  }
}

// ── Rankings (Smart Money) ──

export async function fetchRankings(cfg: AgentConfig): Promise<WhaleEntry[]> {
  const url = `${bfxUrl(cfg)}/v2/rankings/plu:3h:tGLOBAL:USD/hist?limit=500`
  try {
    const raw = await fetchJson(url) as unknown[][]

    // Group by timestamp, take latest
    const byTs = new Map<number, unknown[][]>()
    for (const item of raw) {
      const ts = item[0] as number
      if (!byTs.has(ts)) byTs.set(ts, [])
      byTs.get(ts)!.push(item)
    }

    const timestamps = [...byTs.keys()].sort((a, b) => b - a)
    if (timestamps.length < 2) return []

    // Fetch price candles for correlation
    const candleUrl = `${bfxUrl(cfg)}/v2/candles/trade:3h:${cfg.collector.bitfinex.symbol}/hist?limit=50`
    const candles = await fetchJson(candleUrl) as number[][]

    const priceByTs = new Map<number, number>()
    for (const c of candles) priceByTs.set(c[0], c[2]) // [ts, open, close, high, low, vol]

    // Get latest snapshot
    const latestItems = byTs.get(timestamps[0])!
    const prevItems = byTs.get(timestamps[1])!

    const prevPnl = new Map<string, number>()
    for (const item of prevItems) {
      prevPnl.set(item[2] as string, item[6] as number)
    }

    // Price change between these two timestamps
    const p1 = priceByTs.get(timestamps[0]) ?? 0
    const p0 = priceByTs.get(timestamps[1]) ?? p1
    const priceChange = p0 > 0 ? (p1 - p0) / p0 : 0

    const entries: WhaleEntry[] = []
    for (const item of latestItems) {
      const username = item[2] as string
      const pnl = item[6] as number
      const prevVal = prevPnl.get(username) ?? 0
      const pnlChange = pnl - prevVal

      // Correlation proxy: PnL change same direction as price → long
      let correlation = 0
      if (priceChange !== 0 && pnlChange !== 0) {
        const sign = Math.sign(pnlChange) * Math.sign(priceChange)
        // Scale by relative PnL magnitude (larger PnL changes = more confident)
        const magnitude = Math.min(1, Math.abs(pnlChange) / (Math.abs(pnl) * 0.01 + 1))
        correlation = sign * Math.max(0.5, magnitude) // floor at 0.5 for clear directional signal
      }

      // If no price change, infer from PnL sign directly
      if (priceChange === 0 && pnlChange !== 0) {
        correlation = pnlChange > 0 ? 0.5 : -0.5
      }

      const direction = correlation > 0.3 ? 'long' : correlation < -0.3 ? 'short' : 'hedge'
      entries.push({
        username,
        rank: item[3] as number,
        pnl,
        direction,
        correlation,
        confidence: Math.min(1, Math.max(0, (Math.abs(correlation) - 0.4) / 0.5)),
      })
    }

    return entries.sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
  } catch (e) {
    log().warn({ err: e }, 'Rankings fetch failed')
    return []
  }
}

// ── Full Snapshot ──

export async function collectSnapshot(cfg: AgentConfig): Promise<MarketSnapshot> {
  const [ticker, orderbook, trades, liqs, funding, deriv, whales] = await Promise.all([
    fetchTicker(cfg),
    fetchOrderbook(cfg, 25),
    fetchTrades(cfg, 200),
    fetchLiquidations(cfg),
    fetchFundingStats(cfg),
    fetchDerivStatus(cfg),
    fetchRankings(cfg),
  ])

  const tradeFlow = aggregateTradeFlow(trades)
  const liqAgg = aggregateLiquidations(liqs)
  const liqIntensityPct = calcLiqIntensityPercentile(liqs)

  // Whale score
  const longWhales = whales.filter(w => w.direction === 'long')
  const shortWhales = whales.filter(w => w.direction === 'short')
  const longPnl = longWhales.reduce((s, w) => s + Math.abs(w.pnl), 0)
  const shortPnl = shortWhales.reduce((s, w) => s + Math.abs(w.pnl), 0)
  const totalPnl = longPnl + shortPnl
  const longRatio = totalPnl > 0 ? longPnl / totalPnl : 0.5

  const d1 = longRatio * 25
  const d2 = longWhales.length > shortWhales.length ? 18 : 10
  const fr = deriv?.fundingRate ?? 0
  const annualized = Math.abs(fr * 3 * 365 * 100)
  const d3 = annualized > 100 ? 5 : annualized > 30 ? 18 : 12
  const d4 = 15 // default, no exit signal check in fast scan
  const whaleScore = d1 + d2 + d3 + d4
  const whaleDirection = whaleScore >= 70 ? '强烈看多' : whaleScore >= 60 ? '偏多' : whaleScore <= 30 ? '强烈看空' : whaleScore <= 40 ? '偏空' : '中性'

  return {
    timestamp: Date.now(),
    ticker, orderbook, trades, tradeFlow,
    liquidations: liqs, liqAgg, liqIntensityPct,
    funding,
    fundingCurrent: funding[0] ?? null,
    deriv, whales, whaleScore, whaleDirection,
  }
}

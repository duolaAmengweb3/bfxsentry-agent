/**
 * 从 Bitfinex REST API 拉取历史数据，构建 MarketSnapshot 序列用于回测。
 * 不再依赖 SQLite 预录数据，用户即装即用。
 */
import { fetchJson } from '../collector/bitfinex-rest.js'
import type { AgentConfig } from '../core/config.js'
import type {
  MarketSnapshot, TradeEntry, LiquidationEntry,
  FundingStatPoint, TickerData, OrderbookData, TradeFlow,
  LiquidationAgg,
} from '../collector/types.js'

// ── Candles ──

interface Candle {
  ts: number
  open: number
  close: number
  high: number
  low: number
  volume: number
}

async function fetchCandles(
  cfg: AgentConfig,
  timeframe: string,
  startMs: number,
  endMs: number,
): Promise<Candle[]> {
  const base = cfg.collector.bitfinex.base_url
  const sym = cfg.collector.bitfinex.symbol
  const all: Candle[] = []
  let curStart = startMs

  // Paginate with sort=1 (ascending), move start forward
  while (true) {
    const url = `${base}/v2/candles/trade:${timeframe}:${sym}/hist?limit=10000&start=${curStart}&end=${endMs}&sort=1`
    const raw = await fetchJson(url) as number[][]
    if (!raw || raw.length === 0) break

    for (const c of raw) {
      all.push({ ts: c[0], open: c[1], close: c[2], high: c[3], low: c[4], volume: c[5] })
    }

    if (raw.length < 10000) break
    curStart = raw[raw.length - 1][0] + 1
    await sleep(300)
  }

  return all.sort((a, b) => a.ts - b.ts)
}

// ── Historical Trades (time-windowed pagination) ──

async function fetchHistoricalTrades(
  cfg: AgentConfig,
  startMs: number,
  endMs: number,
): Promise<TradeEntry[]> {
  const base = cfg.collector.bitfinex.base_url
  const sym = cfg.collector.bitfinex.symbol
  const all: TradeEntry[] = []

  // Fetch in 6-hour chunks to distribute trades evenly
  const chunkMs = 6 * 3600_000
  for (let chunkStart = startMs; chunkStart < endMs; chunkStart += chunkMs) {
    const chunkEnd = Math.min(chunkStart + chunkMs, endMs)
    const url = `${base}/v2/trades/${sym}/hist?limit=1000&start=${chunkStart}&end=${chunkEnd}&sort=1`
    try {
      const raw = await fetchJson(url) as number[][]
      if (raw && raw.length > 0) {
        for (const r of raw) {
          all.push({
            id: r[0],
            timestamp: r[1],
            amount: Math.abs(r[2]),
            price: r[3],
            side: r[2] > 0 ? 'buy' : 'sell',
          })
        }
      }
    } catch { /* skip chunk on error */ }
    await sleep(300)
  }

  return all.sort((a, b) => a.timestamp - b.timestamp)
}

// ── Historical Liquidations ──

async function fetchHistoricalLiquidations(
  cfg: AgentConfig,
  startMs: number,
  endMs: number,
): Promise<LiquidationEntry[]> {
  const base = cfg.collector.bitfinex.base_url
  const all: LiquidationEntry[] = []
  let curStart = startMs

  while (true) {
    const url = `${base}/v2/liquidations/hist?limit=500&start=${curStart}&end=${endMs}&sort=1`
    const raw = await fetchJson(url) as unknown[][]
    if (!raw || raw.length === 0) break

    for (const outer of raw) {
      const item = (outer as unknown[])[0] as unknown[]
      if (!item || !Array.isArray(item)) continue
      const amount = Math.abs(item[5] as number || 0)
      const price = item[6] as number || 0
      if (amount === 0 || price === 0) continue
      all.push({
        id: item[1] as number,
        timestamp: item[2] as number,
        symbol: (item[4] as string) || '',
        amount,
        price,
        side: (item[5] as number) > 0 ? 'short' : 'long',
        usdValue: amount * price,
      })
    }

    if (raw.length < 500) break
    const lastItem = (raw[raw.length - 1] as unknown[])[0] as unknown[]
    curStart = (lastItem[2] as number) + 1
    await sleep(300)
  }

  return all.sort((a, b) => a.timestamp - b.timestamp)
}

// ── Historical Funding Stats ──

async function fetchHistoricalFunding(
  cfg: AgentConfig,
  startMs: number,
  endMs: number,
): Promise<FundingStatPoint[]> {
  const base = cfg.collector.bitfinex.base_url
  const sym = cfg.collector.bitfinex.funding_symbol
  const url = `${base}/v2/funding/stats/${sym}/hist?limit=10000&start=${startMs}&end=${endMs}&sort=1`
  const raw = await fetchJson(url) as unknown[][]

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

// ── Build MarketSnapshot from candle + context ──

function buildSnapshotFromCandle(
  candle: Candle,
  prevCandles: Candle[],
  trades: TradeEntry[],
  liqs: LiquidationEntry[],
  funding: FundingStatPoint[],
): MarketSnapshot {
  const price = candle.close

  // Candle directional bias: how bullish/bearish is this candle?
  const candleReturn = candle.open > 0 ? (candle.close - candle.open) / candle.open : 0
  const isBullish = candleReturn > 0.002  // > 0.2% move
  const isBearish = candleReturn < -0.002
  const isStrongMove = Math.abs(candleReturn) > 0.01 // > 1% move

  // Multi-candle momentum (last 3 candles)
  const recentReturns = prevCandles.slice(-3).map(c => c.open > 0 ? (c.close - c.open) / c.open : 0)
  const avgMomentum = recentReturns.length > 0 ? recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length : 0

  // Ticker from candle OHLCV
  const ticker: TickerData = {
    bid: price * 0.9999,
    bidSize: candle.volume * 0.3,
    ask: price * 1.0001,
    askSize: candle.volume * 0.3,
    dailyChange: candle.close - candle.open,
    dailyChangePct: candleReturn,
    lastPrice: price,
    volume: candle.volume,
    high: candle.high,
    low: candle.low,
  }

  // Filter trades in this candle's 1h window
  const windowStart = candle.ts
  const windowEnd = candle.ts + 3600_000
  const windowTrades = trades.filter(
    t => t.timestamp >= windowStart && t.timestamp < windowEnd,
  )

  // TradeFlow — use actual trades if available, otherwise derive from candle
  const tradeFlow = windowTrades.length > 10
    ? buildTradeFlow(windowTrades)
    : deriveTradeFlowFromCandle(candle)

  // Synthetic orderbook — biased by candle direction and trade flow
  const buyRatio = tradeFlow.buyRatio60s
  // Stronger directional candles → more imbalanced orderbook
  const bidMultiplier = isBullish ? (1 + Math.abs(candleReturn) * 50) : isBearish ? (1 - Math.abs(candleReturn) * 25) : 1
  const askMultiplier = isBearish ? (1 + Math.abs(candleReturn) * 50) : isBullish ? (1 - Math.abs(candleReturn) * 25) : 1

  const baseBidDepth = candle.volume * 0.25
  const baseAskDepth = candle.volume * 0.25
  const bidDepth05 = baseBidDepth * bidMultiplier
  const askDepth05 = baseAskDepth * askMultiplier

  const range = candle.high - candle.low
  const bidAskSpread = Math.max(range * 0.01, price * 0.0001)

  const orderbook: OrderbookData = {
    bids: [
      { price: price - bidAskSpread, count: 10, amount: candle.volume * 0.05 * bidMultiplier },
      { price: price - bidAskSpread * 3, count: 15, amount: candle.volume * 0.08 * bidMultiplier },
      { price: price - bidAskSpread * 8, count: 20, amount: candle.volume * 0.12 * bidMultiplier },
    ],
    asks: [
      { price: price + bidAskSpread, count: 10, amount: candle.volume * 0.05 * askMultiplier },
      { price: price + bidAskSpread * 3, count: 15, amount: candle.volume * 0.08 * askMultiplier },
      { price: price + bidAskSpread * 8, count: 20, amount: candle.volume * 0.12 * askMultiplier },
    ],
    bidDepth02: candle.volume * 0.13 * bidMultiplier,
    bidDepth05,
    bidDepth10: bidDepth05,
    askDepth02: candle.volume * 0.13 * askMultiplier,
    askDepth05,
    askDepth10: askDepth05,
    walls: [], // Walls detected from strong price levels below
  }

  // Detect synthetic walls from extreme candle patterns
  // A strong move that reverses (long wick) suggests a wall
  const upperWick = candle.high - Math.max(candle.open, candle.close)
  const lowerWick = Math.min(candle.open, candle.close) - candle.low
  const body = Math.abs(candle.close - candle.open)

  if (upperWick > body * 2 && range > 0) {
    // Strong upper wick = ask wall near the high
    orderbook.walls.push({
      side: 'ask',
      price: candle.high,
      amount: candle.volume * 0.5,
      multiplier: 6,
    })
  }
  if (lowerWick > body * 2 && range > 0) {
    // Strong lower wick = bid wall near the low
    orderbook.walls.push({
      side: 'bid',
      price: candle.low,
      amount: candle.volume * 0.5,
      multiplier: 6,
    })
  }

  // Filter liquidations in window
  const windowLiqs = liqs.filter(
    l => l.timestamp >= candle.ts - 3600_000 && l.timestamp < windowEnd,
  )

  // Liq aggregation
  const liqAgg = buildLiqAgg(liqs, candle.ts)

  // Liq intensity
  const liqIntensityPct = calcLiqIntensityFromHistory(
    liqs.filter(l => l.timestamp <= windowEnd),
    candle.ts,
  )

  // Funding: all data points up to this candle
  const relevantFunding = funding.filter(f => f.timestamp <= windowEnd)
  const recentFunding = relevantFunding.slice(-12) // need ≥10 for funding signal

  // Derive whale-like data from sustained momentum
  let whaleScore = 50 // neutral default
  let whaleDirection = '中性'
  const whales: MarketSnapshot['whales'] = []

  if (prevCandles.length >= 3) {
    // If 3+ candles in same direction with increasing volume, simulate whale activity
    const last3 = prevCandles.slice(-3)
    const allBullish = last3.every(c => c.close > c.open)
    const allBearish = last3.every(c => c.close < c.open)
    const volIncreasing = last3.length >= 2 && last3[last3.length - 1].volume > last3[0].volume * 1.2

    if (allBullish && volIncreasing) {
      whaleScore = 65 + Math.min(20, Math.abs(avgMomentum) * 1000)
      whaleDirection = whaleScore >= 70 ? '强烈看多' : '偏多'
      // Simulate aligned whales
      for (let w = 0; w < 6; w++) {
        whales.push({
          username: `whale_${w}`,
          rank: w + 1,
          pnl: Math.abs(avgMomentum) * 100000 * (w + 1),
          direction: 'long',
          correlation: 0.7 + Math.random() * 0.2,
          confidence: 0.6 + Math.random() * 0.3,
        })
      }
    } else if (allBearish && volIncreasing) {
      whaleScore = 35 - Math.min(20, Math.abs(avgMomentum) * 1000)
      whaleDirection = whaleScore <= 30 ? '强烈看空' : '偏空'
      for (let w = 0; w < 6; w++) {
        whales.push({
          username: `whale_${w}`,
          rank: w + 1,
          pnl: Math.abs(avgMomentum) * 100000 * (w + 1),
          direction: 'short',
          correlation: -(0.7 + Math.random() * 0.2),
          confidence: 0.6 + Math.random() * 0.3,
        })
      }
    }
  }

  return {
    timestamp: candle.ts,
    ticker,
    orderbook,
    trades: windowTrades,
    tradeFlow,
    liquidations: windowLiqs,
    liqAgg,
    liqIntensityPct,
    funding: recentFunding,
    fundingCurrent: recentFunding.length > 0 ? recentFunding[recentFunding.length - 1] : null,
    deriv: null,
    whales,
    whaleScore,
    whaleDirection,
  }
}

function deriveTradeFlowFromCandle(candle: Candle): TradeFlow {
  // Infer buy/sell ratio from candle direction
  const ret = candle.open > 0 ? (candle.close - candle.open) / candle.open : 0
  // Bullish candle → more buy volume, bearish → more sell volume
  const buyRatio = 0.5 + Math.min(0.35, Math.max(-0.35, ret * 30))
  const totalVol = candle.volume
  const buyVol = totalVol * buyRatio
  const sellVol = totalVol * (1 - buyRatio)

  return {
    buyVol30s: buyVol * 0.008,
    sellVol30s: sellVol * 0.008,
    buyVol60s: buyVol * 0.017,
    sellVol60s: sellVol * 0.017,
    buyVol5m: buyVol * 0.083,
    sellVol5m: sellVol * 0.083,
    buyCount60s: Math.max(1, Math.round(50 * buyRatio)),
    sellCount60s: Math.max(1, Math.round(50 * (1 - buyRatio))),
    netFlow60s: (buyVol - sellVol) * 0.017,
    buyRatio60s: buyRatio,
  }
}

function buildTradeFlow(trades: TradeEntry[]): TradeFlow {
  const buyTrades = trades.filter(t => t.side === 'buy')
  const sellTrades = trades.filter(t => t.side === 'sell')
  const buyVol = buyTrades.reduce((s, t) => s + t.amount, 0)
  const sellVol = sellTrades.reduce((s, t) => s + t.amount, 0)
  const total = buyVol + sellVol

  // Scale sub-windows proportionally
  return {
    buyVol30s: buyVol * 0.008,
    sellVol30s: sellVol * 0.008,
    buyVol60s: buyVol * 0.017,
    sellVol60s: sellVol * 0.017,
    buyVol5m: buyVol * 0.083,
    sellVol5m: sellVol * 0.083,
    buyCount60s: Math.max(1, Math.round(buyTrades.length * 0.017)),
    sellCount60s: Math.max(1, Math.round(sellTrades.length * 0.017)),
    netFlow60s: (buyVol - sellVol) * 0.017,
    buyRatio60s: total > 0 ? buyVol / total : 0.5,
  }
}

function buildLiqAgg(
  liqs: LiquidationEntry[],
  refTs: number,
): { w1m: LiquidationAgg; w5m: LiquidationAgg; w15m: LiquidationAgg; w1h: LiquidationAgg; w24h: LiquidationAgg } {
  const agg = (sec: number): LiquidationAgg => {
    const window = liqs.filter(l => l.timestamp >= refTs - sec * 1000 && l.timestamp <= refTs)
    const longUsd = window.filter(l => l.side === 'long').reduce((s, l) => s + l.usdValue, 0)
    const shortUsd = window.filter(l => l.side === 'short').reduce((s, l) => s + l.usdValue, 0)
    return { longUsd, shortUsd, total: longUsd + shortUsd, count: window.length }
  }
  return { w1m: agg(60), w5m: agg(300), w15m: agg(900), w1h: agg(3600), w24h: agg(86400) }
}

function calcLiqIntensityFromHistory(liqs: LiquidationEntry[], refTs: number): number {
  if (liqs.length === 0) return 0
  // Use last 24h of liqs for percentile calculation
  const window24h = liqs.filter(l => l.timestamp >= refTs - 86400_000)
  if (window24h.length === 0) return 0

  const buckets: number[] = []
  const start = window24h[0].timestamp

  for (let t = start; t < refTs; t += 60_000) {
    const bucket = window24h.filter(l => l.timestamp >= t && l.timestamp < t + 60_000)
    buckets.push(bucket.reduce((s, l) => s + l.usdValue, 0))
  }
  if (buckets.length === 0) return 0

  const currentBucket = window24h
    .filter(l => l.timestamp >= refTs - 60_000 && l.timestamp <= refTs)
    .reduce((s, l) => s + l.usdValue, 0)
  const sorted = [...buckets].sort((a, b) => a - b)
  const idx = sorted.findIndex(v => v >= currentBucket)
  return idx >= 0 ? idx / sorted.length : 1
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

// ── Main export ──

export interface FetchProgress {
  phase: string
  detail: string
}

export async function fetchHistoricalSnapshots(
  cfg: AgentConfig,
  days: number,
  onProgress?: (p: FetchProgress) => void,
): Promise<MarketSnapshot[]> {
  const endMs = Date.now()
  const startMs = endMs - days * 86400_000

  const progress = (phase: string, detail: string) => {
    onProgress?.({ phase, detail })
  }

  // Step 1: Fetch 1h candles as price backbone
  progress('candles', `拉取 ${days} 天 K 线数据...`)
  const candles = await fetchCandles(cfg, '1h', startMs, endMs)
  if (candles.length === 0) {
    throw new Error(`无法获取 K 线数据，请检查网络连接`)
  }
  progress('candles', `获取 ${candles.length} 根 1h K 线`)

  // Step 2: Fetch historical trades (time-chunked for even distribution)
  progress('trades', '拉取历史成交数据...')
  let trades: TradeEntry[] = []
  try {
    trades = await fetchHistoricalTrades(cfg, startMs, endMs)
    progress('trades', `获取 ${trades.length} 条成交记录`)
  } catch {
    progress('trades', '成交数据不可用，使用 K 线推算')
  }

  // Step 3: Fetch historical liquidations
  progress('liquidations', '拉取历史爆仓数据...')
  let liqs: LiquidationEntry[] = []
  try {
    liqs = await fetchHistoricalLiquidations(cfg, startMs, endMs)
    progress('liquidations', `获取 ${liqs.length} 条爆仓记录`)
  } catch {
    progress('liquidations', '爆仓数据不可用')
  }

  // Step 4: Fetch historical funding stats
  progress('funding', '拉取历史融资数据...')
  let funding: FundingStatPoint[] = []
  try {
    funding = await fetchHistoricalFunding(cfg, startMs, endMs)
    progress('funding', `获取 ${funding.length} 条融资记录`)
  } catch {
    progress('funding', '融资数据不可用')
  }

  // Step 5: Build snapshot for each candle (with look-back context)
  progress('build', `构建 ${candles.length} 个市场快照...`)
  const snapshots: MarketSnapshot[] = []
  for (let i = 0; i < candles.length; i++) {
    const prevCandles = candles.slice(Math.max(0, i - 5), i)
    snapshots.push(buildSnapshotFromCandle(candles[i], prevCandles, trades, liqs, funding))
  }

  progress('done', `完成！共 ${snapshots.length} 个快照，覆盖 ${days} 天`)
  return snapshots
}

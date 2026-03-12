import { NextResponse } from 'next/server'
import {
  fetchTicker,
  fetchOrderbook,
  fetchTrades,
  fetchDerivStatus,
  fetchLiquidations,
  percentile,
} from '@/lib/api/market-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ─── Simple in-memory cache for external API calls ──────────────
const pmCache = new Map<string, { data: unknown; ts: number }>()
function getCached<T>(key: string, ttlMs: number): T | null {
  const e = pmCache.get(key)
  if (e && Date.now() - e.ts < ttlMs) return e.data as T
  return null
}
function setCache(key: string, data: unknown) { pmCache.set(key, { data, ts: Date.now() }) }

// ─── Polymarket API helpers ──────────────────────────────────────

interface PolymarketBook {
  tokenId: string
  side: 'Up' | 'Down'
  bestBid: number
  bestAsk: number
  spread: number
  midPrice: number
  liquidity: number
}

interface PolymarketMarket {
  slug: string
  window: '5m' | '15m' | '1h'
  windowLabel: string
  question: string
  endDate: string
  up: PolymarketBook | null
  down: PolymarketBook | null
  upPrice: number
  downPrice: number
  sumPrice: number
  arbGap: number // 1 - sumPrice, positive = arb opportunity
  timeRemainingMs: number
}

/** Calculate the current window's start timestamp for a given interval */
function getCurrentWindowTs(intervalMinutes: number): number {
  const now = Math.floor(Date.now() / 1000)
  const interval = intervalMinutes * 60
  return Math.floor(now / interval) * interval
}

/** Try to fetch a Polymarket BTC up/down market by slug */
async function fetchPolymarketMarket(
  intervalMinutes: number,
  windowLabel: string,
  windowKey: '5m' | '15m' | '1h'
): Promise<PolymarketMarket | null> {
  try {
    const ts = getCurrentWindowTs(intervalMinutes)
    const slug = `btc-updown-${windowKey}-${ts}`
    const cacheKey = `pm:${slug}`
    const cached = getCached<PolymarketMarket>(cacheKey, 15_000)
    if (cached) return cached

    const url = `https://gamma-api.polymarket.com/markets?slug=${slug}&closed=false`

    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const markets = await res.json()
    if (!Array.isArray(markets) || markets.length === 0) return null

    const market = markets[0]
    const outcomes: string[] = market.outcomes ? JSON.parse(market.outcomes) : []
    const prices: string[] = market.outcomePrices ? JSON.parse(market.outcomePrices) : []
    const tokens: { token_id: string; outcome: string }[] = market.tokens || []

    const upIdx = outcomes.findIndex((o: string) => o.toLowerCase() === 'up')
    const downIdx = outcomes.findIndex((o: string) => o.toLowerCase() === 'down')

    const upPrice = upIdx >= 0 && prices[upIdx] ? parseFloat(prices[upIdx]) : 0.5
    const downPrice = downIdx >= 0 && prices[downIdx] ? parseFloat(prices[downIdx]) : 0.5

    // Try to get orderbook data for each token
    let upBook: PolymarketBook | null = null
    let downBook: PolymarketBook | null = null

    for (const token of tokens) {
      try {
        const bookRes = await fetch(
          `https://clob.polymarket.com/book?token_id=${token.token_id}`,
          { signal: AbortSignal.timeout(3000) }
        )
        if (bookRes.ok) {
          const book = await bookRes.json()
          const bids = book.bids || []
          const asks = book.asks || []
          const bestBid = bids.length > 0 ? parseFloat(bids[0].price) : 0
          const bestAsk = asks.length > 0 ? parseFloat(asks[0].price) : 1
          const totalBidSize = bids.reduce((s: number, b: { size: string }) => s + parseFloat(b.size || '0'), 0)
          const totalAskSize = asks.reduce((s: number, a: { size: string }) => s + parseFloat(a.size || '0'), 0)

          const entry: PolymarketBook = {
            tokenId: token.token_id,
            side: token.outcome?.toLowerCase() === 'up' ? 'Up' : 'Down',
            bestBid,
            bestAsk,
            spread: bestAsk - bestBid,
            midPrice: (bestBid + bestAsk) / 2,
            liquidity: totalBidSize + totalAskSize,
          }

          if (token.outcome?.toLowerCase() === 'up') upBook = entry
          else downBook = entry
        }
      } catch {
        // orderbook fetch failed, continue with gamma prices
      }
    }

    const endTime = new Date(market.endDate).getTime()
    const sumPrice = upPrice + downPrice

    const result: PolymarketMarket = {
      slug,
      window: windowKey,
      windowLabel,
      question: market.question || `BTC ${windowLabel} Up or Down?`,
      endDate: market.endDate,
      up: upBook,
      down: downBook,
      upPrice,
      downPrice,
      sumPrice,
      arbGap: Math.max(0, 1 - sumPrice),
      timeRemainingMs: Math.max(0, endTime - Date.now()),
    }
    setCache(cacheKey, result)
    return result
  } catch {
    // On error, return stale cache if available
    const ts2 = getCurrentWindowTs(intervalMinutes)
    const stale = getCached<PolymarketMarket>(`pm:btc-updown-${windowKey}-${ts2}`, 120_000)
    return stale
  }
}

// ─── BfxSentry signal aggregation ────────────────────────────────

interface DirectionSignal {
  source: string
  direction: 'up' | 'down' | 'neutral'
  confidence: number // 0-100
  detail: string
}

function aggregateSignals(signals: DirectionSignal[]): {
  upProb: number
  downProb: number
  confidence: number
  bias: string
} {
  if (signals.length === 0) return { upProb: 0.5, downProb: 0.5, confidence: 0, bias: 'No signal' }

  let weightedUp = 0
  let weightedDown = 0
  let totalWeight = 0

  for (const sig of signals) {
    const w = sig.confidence / 100
    if (sig.direction === 'up') {
      weightedUp += w
    } else if (sig.direction === 'down') {
      weightedDown += w
    } else {
      weightedUp += w * 0.5
      weightedDown += w * 0.5
    }
    totalWeight += w
  }

  if (totalWeight === 0) return { upProb: 0.5, downProb: 0.5, confidence: 0, bias: 'No signal' }

  const rawUp = weightedUp / totalWeight
  const rawDown = weightedDown / totalWeight
  // Compress towards 50% — don't overfit
  const upProb = 0.5 + (rawUp - 0.5) * 0.6
  const downProb = 1 - upProb
  const confidence = Math.round(Math.abs(upProb - 0.5) * 200)
  const bias = upProb > 0.55 ? 'Bullish' : upProb < 0.45 ? 'Bearish' : 'Neutral'

  return { upProb: Math.round(upProb * 100) / 100, downProb: Math.round(downProb * 100) / 100, confidence, bias }
}

// ─── Hedge calculator ────────────────────────────────────────────

interface HedgeCalc {
  scenario: string
  pmSide: 'Up' | 'Down'
  pmPrice: number
  pmSize: number // USDC
  bfxSide: 'long' | 'short'
  bfxSizeBtc: number
  maxProfit: number
  maxLoss: number
  breakeven: string
}

function calculateHedge(
  pmUpPrice: number,
  pmDownPrice: number,
  btcPrice: number,
  upProb: number,
  stakeUsdc: number
): HedgeCalc | null {
  // Find mispriced side: if our upProb > pmUpPrice, Up is underpriced
  const upEdge = upProb - pmUpPrice
  const downEdge = (1 - upProb) - pmDownPrice

  if (Math.abs(upEdge) < 0.03 && Math.abs(downEdge) < 0.03) return null // no meaningful edge

  const betOnUp = upEdge > downEdge
  const pmSide: 'Up' | 'Down' = betOnUp ? 'Up' : 'Down'
  const pmPrice = betOnUp ? pmUpPrice : pmDownPrice
  const shares = stakeUsdc / pmPrice

  // If we bet Up on PM → hedge by shorting BTC on Bitfinex
  // If we bet Down on PM → hedge by longing BTC on Bitfinex
  const bfxSide: 'long' | 'short' = betOnUp ? 'short' : 'long'

  // Delta approximation: PM share moves ~0.5 for a meaningful BTC move
  // Hedge ratio: (stakeUsdc * delta) / btcPrice
  const delta = 0.5
  const bfxSizeBtc = Math.round(((stakeUsdc * delta) / btcPrice) * 10000) / 10000

  const maxProfit = Math.round((shares * (1 - pmPrice)) * 100) / 100 // PM wins, ignore hedge cost
  const maxLoss = Math.round(stakeUsdc * 100) / 100 // PM loses completely (hedge partially offsets)

  return {
    scenario: betOnUp
      ? `Signal bullish (${(upProb * 100).toFixed(0)}%) vs PM price (${(pmUpPrice * 100).toFixed(0)}%) → Buy Up + Bfx short hedge`
      : `Signal bearish (${((1 - upProb) * 100).toFixed(0)}%) vs PM price (${(pmDownPrice * 100).toFixed(0)}%) → Buy Down + Bfx long hedge`,
    pmSide,
    pmPrice,
    pmSize: stakeUsdc,
    bfxSide,
    bfxSizeBtc,
    maxProfit,
    maxLoss,
    breakeven: `PM ${pmSide} settles at $1 → net profit ~$${maxProfit}`,
  }
}

// ─── Main handler ────────────────────────────────────────────────

export async function GET() {
  try {
    // Parallel fetch: Polymarket markets + Bitfinex data
    const [pm5m, pm15m, pm1h, ticker, orderbook, trades, derivStatus, liqs] = await Promise.all([
      fetchPolymarketMarket(5, '5min', '5m'),
      fetchPolymarketMarket(15, '15min', '15m'),
      fetchPolymarketMarket(60, '1hr', '1h'),
      fetchTicker(),
      fetchOrderbook('tBTCUSD', 25),
      fetchTrades('tBTCUSD', 100),
      fetchDerivStatus(),
      fetchLiquidations(200),
    ])

    const now = Date.now()
    const btcPrice = ticker.lastPrice

    // ── Build direction signals from Bitfinex data ──

    const signals: DirectionSignal[] = []

    // 1. Orderbook imbalance signal
    const { bids, asks } = orderbook
    const bidDepth = bids.slice(0, 20).reduce((s, b) => s + b.amount, 0)
    const askDepth = asks.slice(0, 20).reduce((s, a) => s + a.amount, 0)
    const obRatio = bidDepth / (askDepth || 1)
    if (obRatio > 1.3) {
      signals.push({ source: 'Order book', direction: 'up', confidence: Math.min(70, Math.round((obRatio - 1) * 50)), detail: `Bid/Ask ratio ${obRatio.toFixed(2)}` })
    } else if (obRatio < 0.7) {
      signals.push({ source: 'Order book', direction: 'down', confidence: Math.min(70, Math.round((1 / obRatio - 1) * 50)), detail: `Bid/Ask ratio ${obRatio.toFixed(2)}` })
    } else {
      signals.push({ source: 'Order book', direction: 'neutral', confidence: 20, detail: `Bid/Ask ratio ${obRatio.toFixed(2)} (balanced)` })
    }

    // 2. Trade flow signal (last 60s)
    const cutoff60s = now - 60000
    const recent = trades.filter((t) => t.timestamp >= cutoff60s)
    const buyVol = recent.filter((t) => t.side === 'buy').reduce((s, t) => s + t.amount, 0)
    const sellVol = recent.filter((t) => t.side === 'sell').reduce((s, t) => s + t.amount, 0)
    const totalVol = buyVol + sellVol
    if (totalVol > 0) {
      const buyRatio = buyVol / totalVol
      if (buyRatio > 0.6) {
        signals.push({ source: 'Trade flow', direction: 'up', confidence: Math.round(buyRatio * 60), detail: `60s buy ${(buyRatio * 100).toFixed(0)}%` })
      } else if (buyRatio < 0.4) {
        signals.push({ source: 'Trade flow', direction: 'down', confidence: Math.round((1 - buyRatio) * 60), detail: `60s sell ${((1 - buyRatio) * 100).toFixed(0)}%` })
      } else {
        signals.push({ source: 'Trade flow', direction: 'neutral', confidence: 15, detail: `60s balanced ${(buyRatio * 100).toFixed(0)}%/${((1 - buyRatio) * 100).toFixed(0)}%` })
      }
    }

    // 3. Liquidation signal (last 5min)
    const cutoff5m = now - 5 * 60000
    const recentLiqs = liqs.filter((l) => l.timestamp >= cutoff5m)
    const longLiqUsd = recentLiqs.filter((l) => l.side === 'long').reduce((s, l) => s + l.usdValue, 0)
    const shortLiqUsd = recentLiqs.filter((l) => l.side === 'short').reduce((s, l) => s + l.usdValue, 0)
    const totalLiqUsd = longLiqUsd + shortLiqUsd
    if (totalLiqUsd > 50000) {
      const longDom = longLiqUsd / totalLiqUsd
      if (longDom > 0.7) {
        signals.push({ source: 'Liquidation', direction: 'down', confidence: Math.round(longDom * 70), detail: `5min long liq $${fmt(longLiqUsd)} dominant` })
      } else if (longDom < 0.3) {
        signals.push({ source: 'Liquidation', direction: 'up', confidence: Math.round((1 - longDom) * 70), detail: `5min short liq $${fmt(shortLiqUsd)} dominant` })
      }
    }

    // 4. Funding rate signal
    const fr = derivStatus.fundingRate
    if (Math.abs(fr) > 0.0001) {
      // High positive funding → longs paying shorts → crowded long → might reverse down
      // But short-term momentum often continues
      if (fr > 0.0003) {
        signals.push({ source: 'Funding rate', direction: 'up', confidence: 25, detail: `Rate ${(fr * 100).toFixed(4)}% (longs crowded but short-term momentum up)` })
      } else if (fr < -0.0003) {
        signals.push({ source: 'Funding rate', direction: 'down', confidence: 25, detail: `Rate ${(fr * 100).toFixed(4)}% (shorts crowded but short-term momentum down)` })
      }
    }

    // ── Aggregate signals ──
    const agg = aggregateSignals(signals)

    // ── Hedge calculations ──
    const stakeUsdc = 100 // default example stake
    const markets = [pm5m, pm15m, pm1h].filter(Boolean) as PolymarketMarket[]

    const hedgeScenarios = markets.map((m) => ({
      window: m.windowLabel,
      hedge: calculateHedge(m.upPrice, m.downPrice, btcPrice, agg.upProb, stakeUsdc),
      arbGap: m.arbGap,
    }))

    // ── Market making opportunity ──
    const mmOpportunities = markets.map((m) => {
      const upSpread = m.up ? m.up.spread : null
      const downSpread = m.down ? m.down.spread : null
      const avgSpread = upSpread != null && downSpread != null ? (upSpread + downSpread) / 2 : null
      return {
        window: m.windowLabel,
        upSpread,
        downSpread,
        avgSpread,
        rebateEstimate: avgSpread != null ? Math.round(avgSpread * 0.5 * stakeUsdc * 100) / 100 : null,
        hedgeCost: `Bitfinex perp maker+taker 0 fee`,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        btcPrice,
        fundingRate: fr,
        markets,
        signals,
        aggregate: agg,
        hedgeScenarios,
        mmOpportunities,
        derivStatus: {
          markPrice: derivStatus.markPrice,
          fundingRate: derivStatus.fundingRate,
          nextFundingTs: derivStatus.nextFundingTs,
        },
        meta: {
          stakeUsdc,
          bfxFee: '0% (maker+taker)',
          pmFee: 'taker fee variable / maker rebate',
          settlementSource: '5m/15m: Chainlink BTC/USD · 1h: Binance BTC/USDT 1H candle',
        },
      },
      timestamp: now,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() },
      { status: 500 }
    )
  }
}

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return n.toFixed(0)
}

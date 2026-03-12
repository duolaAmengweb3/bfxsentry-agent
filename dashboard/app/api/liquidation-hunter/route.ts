import { NextResponse } from 'next/server'
import {
  fetchLiquidations,
  fetchTicker,
  fetchTrades,
  percentile,
  type LiquidationEntry,
} from '@/lib/api/market-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ─── Types ────────────────────────────────────────────────────
interface OperationStep { step: number; title: string; detail?: string }
interface Recommendation {
  action: 'trend_long' | 'trend_short' | 'reversal_long' | 'reversal_short' | 'wait'
  name: string
  confidence: number
  reasoning: string
  conditions: { label: string; met: boolean; value: string }[]
  advice?: string
  operations?: OperationStep[]
}

// ─── Helpers ──────────────────────────────────────────────────
function aggregateByWindow(liqs: LiquidationEntry[], windowMs: number, now: number) {
  const cutoff = now - windowMs
  const window = liqs.filter((l) => l.timestamp >= cutoff)
  return {
    longUsd: window.filter((l) => l.side === 'long').reduce((s, l) => s + l.usdValue, 0),
    shortUsd: window.filter((l) => l.side === 'short').reduce((s, l) => s + l.usdValue, 0),
    count: window.length,
  }
}

function compute1mPercentiles(liqs: LiquidationEntry[]) {
  if (liqs.length === 0) return { currentIntensity: 0, percentileValue: 0 }
  const now = Math.max(...liqs.map((l) => l.timestamp))
  const earliest = Math.min(...liqs.map((l) => l.timestamp))
  const windowMs = 60000
  const windows: number[] = []
  for (let t = earliest; t <= now; t += windowMs) {
    windows.push(liqs.filter((l) => l.timestamp >= t && l.timestamp < t + windowMs).reduce((s, l) => s + l.usdValue, 0))
  }
  const currentWindow = liqs.filter((l) => l.timestamp >= now - windowMs).reduce((s, l) => s + l.usdValue, 0)
  const sorted = [...windows].sort((a, b) => a - b)
  return { currentIntensity: currentWindow, percentileValue: percentile(currentWindow, sorted) }
}

export async function GET() {
  try {
    const [liqs, ticker, trades] = await Promise.all([
      fetchLiquidations(500),
      fetchTicker('tBTCUSD'),
      fetchTrades('tBTCUSD', 100),
    ])

    const now = Date.now()
    const btcPrice = ticker.lastPrice

    // ── Aggregations ─────────────────────────────────────────
    const w1m = aggregateByWindow(liqs, 60000, now)
    const w5m = aggregateByWindow(liqs, 5 * 60000, now)
    const w15m = aggregateByWindow(liqs, 15 * 60000, now)
    const w1h = aggregateByWindow(liqs, 3600000, now)
    const w24h = aggregateByWindow(liqs, 86400000, now)

    const intensity = compute1mPercentiles(liqs)

    // ── Price action ─────────────────────────────────────────
    const recentPrice3m = trades.length > 0
      ? (() => {
          const old = trades.filter((t) => t.timestamp <= now - 3 * 60000)
          return old.length > 0 ? old[0].price : trades[trades.length - 1].price
        })()
      : btcPrice
    const priceChange3m = recentPrice3m > 0 ? (btcPrice - recentPrice3m) / recentPrice3m : 0

    // 5m price extreme tracking
    const recentPrice5m = trades.length > 0
      ? (() => {
          const old = trades.filter((t) => t.timestamp <= now - 5 * 60000)
          return old.length > 0 ? old[0].price : trades[trades.length - 1].price
        })()
      : btcPrice
    const priceChange5m = recentPrice5m > 0 ? (btcPrice - recentPrice5m) / recentPrice5m : 0

    // Price reaction after big liq
    const recent30m = liqs.filter((l) => l.timestamp >= now - 30 * 60000).sort((a, b) => b.usdValue - a.usdValue)
    let priceReaction: { liqSide: string; liqValue: number; reaction: number } | null = null
    if (recent30m.length > 0) {
      const bigLiq = recent30m[0]
      const tradesAfterLiq = trades.filter((t) => t.timestamp >= bigLiq.timestamp)
      const priceAtLiq = tradesAfterLiq.length > 0 ? tradesAfterLiq[tradesAfterLiq.length - 1].price : bigLiq.price
      priceReaction = {
        liqSide: bigLiq.side,
        liqValue: bigLiq.usdValue,
        reaction: btcPrice > 0 ? (btcPrice - priceAtLiq) / priceAtLiq : 0,
      }
    }

    // ── Consecutive liq detection ────────────────────────────
    // Check if liquidations in last 5 min are heavily one-sided
    const liq5mTotal = w5m.longUsd + w5m.shortUsd
    const longDominance5m = liq5mTotal > 0 ? w5m.longUsd / liq5mTotal : 0.5
    const shortDominance5m = liq5mTotal > 0 ? w5m.shortUsd / liq5mTotal : 0.5

    // Check if price is making new extremes or stalling
    const priceStalling = Math.abs(priceChange3m) < 0.001 && intensity.percentileValue >= 0.80
    const priceTrending = Math.abs(priceChange3m) > 0.003

    // ── Recommendation ───────────────────────────────────────
    let recommendation: Recommendation

    const isHighIntensity = intensity.percentileValue >= 0.85
    const isExtremeIntensity = intensity.percentileValue >= 0.95

    // Pattern 1: Trend chase - continuous same-direction liqs + price trending
    if (isHighIntensity && longDominance5m > 0.7 && priceChange3m < -0.003) {
      recommendation = {
        action: 'trend_short',
        name: 'Trend Chase · Short',
        confidence: Math.min(85, 55 + Math.round(intensity.percentileValue * 30)),
        reasoning: `Consecutive long liquidations (5min longs ${(longDominance5m * 100).toFixed(0)}%, $${fmt(w5m.longUsd)}), price falling ${(priceChange3m * 100).toFixed(2)}% in sync. Liquidation cascade is driving price down — trend likely to continue.`,
        conditions: [
          { label: 'Liq Intensity >= P85', met: isHighIntensity, value: `P${(intensity.percentileValue * 100).toFixed(0)}` },
          { label: '5min Long Liq Dominant (>70%)', met: longDominance5m > 0.7, value: `${(longDominance5m * 100).toFixed(0)}%` },
          { label: 'Price Falling (>0.3%)', met: priceChange3m < -0.003, value: `${(priceChange3m * 100).toFixed(2)}%` },
          { label: 'Liq Peak P95', met: isExtremeIntensity, value: `P${(intensity.percentileValue * 100).toFixed(0)}` },
        ],
        advice: 'Go short with the trend — do not try to catch the bottom. Set stop-loss above the recent bounce high. Wait for exhaustion signals (price no longer making new lows) before closing.',
        operations: [
          { step: 1, title: 'Open Bitfinex Trading', detail: 'Log in to Bitfinex → Trading → Select BTC/USD pair → Switch to Margin Trading mode' },
          { step: 2, title: 'Place Short (Sell/Short)', detail: `Select "Margin Sell". Start with a light position: no more than 5-10% of total capital. Current price $${btcPrice.toFixed(0)} — use a market order for quick entry or limit at $${(btcPrice * 1.001).toFixed(0)} (slightly above current)` },
          { step: 3, title: 'Set Stop-Loss', detail: `Place stop-loss 0.3-0.5% above the recent bounce high. Use an OCO order or a separate Stop buy order. Prices can move fast during liq cascades — set stops in advance` },
          { step: 4, title: 'Monitor Exit Timing', detail: 'Keep watching this module: when liq intensity drops from P90+ to below P70, or a "Reversal Play" signal appears, consider taking profit. Don\'t be greedy — sharp rebounds often follow cascade endings' },
          { step: 5, title: 'Risk Management', detail: 'Liq cascades are high-volatility environments — keep leverage at 3x or below. If stopped out, do not immediately reverse; wait for a new signal confirmation' },
        ],
      }
    } else if (isHighIntensity && shortDominance5m > 0.7 && priceChange3m > 0.003) {
      recommendation = {
        action: 'trend_long',
        name: 'Trend Chase · Long',
        confidence: Math.min(85, 55 + Math.round(intensity.percentileValue * 30)),
        reasoning: `Consecutive short liquidations (5min shorts ${(shortDominance5m * 100).toFixed(0)}%, $${fmt(w5m.shortUsd)}), price rising +${(priceChange3m * 100).toFixed(2)}% in sync. Short squeeze is pushing price up.`,
        conditions: [
          { label: 'Liq Intensity >= P85', met: isHighIntensity, value: `P${(intensity.percentileValue * 100).toFixed(0)}` },
          { label: '5min Short Liq Dominant (>70%)', met: shortDominance5m > 0.7, value: `${(shortDominance5m * 100).toFixed(0)}%` },
          { label: 'Price Rising (>0.3%)', met: priceChange3m > 0.003, value: `+${(priceChange3m * 100).toFixed(2)}%` },
          { label: 'Liq Peak P95', met: isExtremeIntensity, value: `P${(intensity.percentileValue * 100).toFixed(0)}` },
        ],
        advice: 'Go long with the trend — do not short against it. Set stop-loss below the recent pullback low. Wait for exhaustion signals (price no longer making new highs) before closing.',
        operations: [
          { step: 1, title: 'Open Bitfinex Trading', detail: 'Log in to Bitfinex → Trading → Select BTC/USD pair → Switch to Margin Trading mode' },
          { step: 2, title: 'Place Long (Buy/Long)', detail: `Select "Margin Buy". Start with a light position: no more than 5-10% of total capital. Current price $${btcPrice.toFixed(0)} — use a market order for quick entry or limit at $${(btcPrice * 0.999).toFixed(0)} (slightly below current)` },
          { step: 3, title: 'Set Stop-Loss', detail: `Place stop-loss 0.3-0.5% below the recent pullback low. Use an OCO order or a separate Stop sell order. Prices can move fast during short squeezes — set stops in advance` },
          { step: 4, title: 'Monitor Exit Timing', detail: 'Keep watching this module: when liq intensity drops from P90+ to below P70, or a "Reversal Play" signal appears, consider taking profit. Quick pullbacks often follow the end of a short squeeze' },
          { step: 5, title: 'Risk Management', detail: 'Liq cascades are high-volatility environments — keep leverage at 3x or below. If stopped out, do not immediately reverse; wait for a new signal confirmation' },
        ],
      }
    }
    // Pattern 2: Reversal play - extreme liquidations but price stops moving
    else if (isExtremeIntensity && priceReaction) {
      const liqSide = priceReaction.liqSide
      const priceReversal = (liqSide === 'long' && priceReaction.reaction > 0.001) ||
                            (liqSide === 'short' && priceReaction.reaction < -0.001)
      const priceNotNewExtreme = (liqSide === 'long' && priceChange5m > -0.001) ||
                                  (liqSide === 'short' && priceChange5m < 0.001)

      if (priceReversal || priceNotNewExtreme) {
        const reverseAction = liqSide === 'long' ? 'reversal_long' : 'reversal_short'
        const reverseName = liqSide === 'long' ? 'Reversal Play · Long' : 'Reversal Play · Short'
        recommendation = {
          action: reverseAction,
          name: reverseName,
          confidence: priceReversal ? 65 : 50,
          reasoning: liqSide === 'long'
            ? `Long liq peak (P${(intensity.percentileValue * 100).toFixed(0)}), but price no longer making new lows (bounced ${(priceReaction.reaction * 100).toFixed(2)}%). Sell pressure may be exhausted — reversal long opportunity.`
            : `Short liq peak (P${(intensity.percentileValue * 100).toFixed(0)}), but price no longer making new highs (pulled back ${(Math.abs(priceReaction.reaction) * 100).toFixed(2)}%). Buy pressure may be exhausted — reversal short opportunity.`,
          conditions: [
            { label: 'Liq Intensity Extreme (>=P95)', met: isExtremeIntensity, value: `P${(intensity.percentileValue * 100).toFixed(0)}` },
            { label: `${liqSide === 'long' ? 'Long' : 'Short'}s Heavily Liquidated`, met: true, value: `$${fmt(priceReaction.liqValue)}` },
            { label: 'Price Showing Reversal Bounce', met: priceReversal, value: `${(priceReaction.reaction * 100).toFixed(2)}%` },
            { label: 'Price Not Making New Extremes', met: priceNotNewExtreme, value: `5m: ${(priceChange5m * 100).toFixed(2)}%` },
          ],
          advice: liqSide === 'long'
            ? 'Light long attempt — confirm with Orderbook module that bid support exists. Strict stop-loss below this round\'s low.'
            : 'Light short attempt — confirm with Orderbook module that ask pressure exists. Strict stop-loss above this round\'s high.',
          operations: liqSide === 'long' ? [
            { step: 1, title: 'Check Orderbook Module First', detail: 'Switch to "Orderbook Sniper" module, confirm Bid/Ask ratio >= 1.2 (bid support present). If no support signal, hold off on entry' },
            { step: 2, title: 'Enter Margin Trading', detail: `Bitfinex → Trading → BTC/USD → Margin Buy. Current price $${btcPrice.toFixed(0)}` },
            { step: 3, title: 'Light Position Entry', detail: 'Reversal signals have high uncertainty — keep position size at 3-5% of total capital. Do not go heavy. Consider splitting into two entries: 50% first, add remaining 50% after confirming bounce continues' },
            { step: 4, title: 'Strict Stop-Loss', detail: 'Set stop-loss 0.2% below this round\'s low. If stopped out, it means this is trend continuation, not a reversal — do not hold against the trend' },
            { step: 5, title: 'Quick Take-Profit', detail: 'Reversal plays are short-term trades. Consider partial take-profit at 0.5-1% bounce. Do not expect a major reversal' },
          ] : [
            { step: 1, title: 'Check Orderbook Module First', detail: 'Switch to "Orderbook Sniper" module, confirm Bid/Ask ratio <= 0.8 (ask pressure present). If no pressure signal, hold off on entry' },
            { step: 2, title: 'Enter Margin Trading', detail: `Bitfinex → Trading → BTC/USD → Margin Sell. Current price $${btcPrice.toFixed(0)}` },
            { step: 3, title: 'Light Position Entry', detail: 'Reversal signals have high uncertainty — keep position size at 3-5% of total capital. Do not go heavy. Consider splitting into two entries: 50% first, add remaining 50% after confirming pullback continues' },
            { step: 4, title: 'Strict Stop-Loss', detail: 'Set stop-loss 0.2% above this round\'s high. If stopped out, it means this is trend continuation, not a reversal — do not hold against the trend' },
            { step: 5, title: 'Quick Take-Profit', detail: 'Reversal plays are short-term trades. Consider partial take-profit at 0.5-1% pullback. Do not expect a major reversal' },
          ],
        }
      } else {
        recommendation = makeWaitRecommendation(intensity.percentileValue, w5m, priceChange3m)
      }
    }
    // Default: Wait
    else {
      recommendation = makeWaitRecommendation(intensity.percentileValue, w5m, priceChange3m)
    }

    // ── Timeline (15min buckets for chart) ────────────────────
    const bucketMs = 15 * 60000
    const bucketStart = now - 24 * 3600000
    const timeline: { ts: number; longUsd: number; shortUsd: number }[] = []
    for (let t = bucketStart; t < now; t += bucketMs) {
      const bucket = liqs.filter((l) => l.timestamp >= t && l.timestamp < t + bucketMs)
      timeline.push({
        ts: t,
        longUsd: bucket.filter((l) => l.side === 'long').reduce((s, l) => s + l.usdValue, 0),
        shortUsd: bucket.filter((l) => l.side === 'short').reduce((s, l) => s + l.usdValue, 0),
      })
    }

    const recentLiqs = liqs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 15)
      .map((l) => ({
        timestamp: l.timestamp, symbol: l.symbol, side: l.side,
        amount: l.amount, price: l.price, usdValue: l.usdValue,
      }))

    return NextResponse.json({
      success: true,
      data: {
        recommendation,
        windows: { w1m, w5m, w15m, w1h, w24h },
        intensity: { current: intensity.currentIntensity, percentile: intensity.percentileValue },
        priceReaction,
        btcPrice,
        priceChange3m,
        timeline,
        recentLiqs,
        totalCount24h: liqs.length,
      },
      timestamp: now,
    })
  } catch (error) {
    console.error('Liquidation Hunter Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() },
      { status: 500 }
    )
  }
}

function makeWaitRecommendation(pct: number, w5m: any, priceChange3m: number): Recommendation {
  return {
    action: 'wait',
    name: pct < 0.50 ? 'Liq Calm · Wait' : 'Active but Not Triggered · Wait',
    confidence: 25,
    reasoning: pct < 0.50
      ? 'Liquidation market is calm — no extreme clearing events. No directional signal yet; refer to Orderbook and Funding modules.'
      : `Liq intensity P${(pct * 100).toFixed(0)} — some activity but below signal threshold. Keep monitoring; watch for escalation to P85+.`,
    conditions: (() => {
      const liq5mTotal = w5m.longUsd + w5m.shortUsd
      const dominance = liq5mTotal > 0 ? Math.max(w5m.longUsd, w5m.shortUsd) / liq5mTotal : 0
      const dominanceMet = dominance > 0.70
      const dominanceSide = w5m.longUsd >= w5m.shortUsd ? 'Long' : 'Short'
      return [
        { label: 'Liq Intensity >= P85', met: pct >= 0.85, value: `P${(pct * 100).toFixed(0)}` },
        { label: '5min One-Side Dominant (>70%)', met: dominanceMet, value: liq5mTotal > 0 ? `${dominanceSide} ${(dominance * 100).toFixed(0)}%` : '-' },
        { label: 'Price Trend Aligned (>0.3%)', met: Math.abs(priceChange3m) > 0.003, value: `${(priceChange3m * 100).toFixed(2)}%` },
      ]
    })(),
  }
}

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return n.toFixed(0)
}

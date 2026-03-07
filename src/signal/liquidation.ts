import type { MarketSnapshot } from '../collector/types.js'
import type { Signal } from './types.js'

export function generateLiquidationSignals(snapshot: MarketSnapshot): Signal[] {
  const { liqAgg, liqIntensityPct, trades, ticker } = snapshot
  const now = snapshot.timestamp
  const signals: Signal[] = []

  const { w5m } = liqAgg
  const liq5mTotal = w5m.longUsd + w5m.shortUsd
  const dominance = liq5mTotal > 0 ? Math.max(w5m.longUsd, w5m.shortUsd) / liq5mTotal : 0
  const dominanceSide = w5m.longUsd >= w5m.shortUsd ? 'long' : 'short'

  // Price change in 3 min window
  const recentTrades = trades.filter(t => t.timestamp >= now - 180_000)
  const oldest = recentTrades.length > 0 ? recentTrades[recentTrades.length - 1].price : ticker.lastPrice
  const priceChange3m = oldest > 0 ? (ticker.lastPrice - oldest) / oldest : 0

  const pct = liqIntensityPct

  // LQ1/LQ2: 顺势追击
  if (pct >= 0.85 && dominance > 0.70 && Math.abs(priceChange3m) > 0.003) {
    const isLongLiq = dominanceSide === 'long' // longs getting liquidated → price dropping → short
    const dir = isLongLiq ? 'short' : 'long'
    const conf = Math.min(85, 55 + (pct - 0.85) * 200)

    signals.push({
      id: isLongLiq ? 'LQ-1' : 'LQ-2',
      module: 'liquidation',
      direction: dir,
      confidence: conf,
      level: 'red',
      title: `顺势追击 ${dir === 'long' ? '做多' : '做空'}`,
      summary: `爆仓强度 P${(pct * 100).toFixed(0)}, ${dominanceSide === 'long' ? '多' : '空'}头主导 ${(dominance * 100).toFixed(0)}%, 价格 ${(priceChange3m * 100).toFixed(2)}%`,
      details: {
        intensity: pct,
        dominance,
        dominanceSide,
        priceChange3m,
        liq5m: { longUsd: w5m.longUsd, shortUsd: w5m.shortUsd },
      },
      timestamp: now,
    })
  }

  // LQ3: 反转博弈
  if (pct >= 0.95 && Math.abs(priceChange3m) < 0.001) {
    const dir = dominanceSide === 'long' ? 'long' : 'short' // reversal: opposite of liquidation side
    signals.push({
      id: 'LQ-3',
      module: 'liquidation',
      direction: dir,
      confidence: 55,
      level: 'yellow',
      title: '反转博弈',
      summary: `极端爆仓 P${(pct * 100).toFixed(0)} 但价格停滞, 需盘口确认`,
      details: {
        intensity: pct,
        priceChange3m,
        requiresObConfirm: true,
      },
      timestamp: now,
    })
  }

  // LQ4: 观望
  if (signals.length === 0) {
    signals.push({
      id: 'LQ-4',
      module: 'liquidation',
      direction: 'neutral',
      confidence: 25,
      level: 'green',
      title: '爆仓市场平稳',
      summary: `强度 P${(pct * 100).toFixed(0)}, 24h 爆仓 $${fmtUsd(liqAgg.w24h.total)}`,
      details: {
        intensity: pct,
        w24h: liqAgg.w24h,
        w1h: liqAgg.w1h,
      },
      timestamp: now,
    })
  }

  return signals
}

function fmtUsd(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return n.toFixed(0)
}

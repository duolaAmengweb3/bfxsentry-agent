import type { MarketSnapshot } from '../collector/types.js'
import type { Signal } from './types.js'

export function generateFundingSignals(snapshot: MarketSnapshot): Signal[] {
  const { funding, fundingCurrent, deriv } = snapshot
  const now = snapshot.timestamp
  const signals: Signal[] = []

  if (!fundingCurrent || funding.length < 10) return signals

  const frr = fundingCurrent.frr
  const utilization = fundingCurrent.utilization
  const spareCapacity = 1 - utilization

  // Calculate percentiles
  const allFrr = funding.map(f => f.frr).sort((a, b) => a - b)
  const frrPct = percentile(frr, allFrr)

  // 1h rate change
  const prev1h = funding.find(f => f.timestamp <= now - 3600_000)
  const rateChange1h = prev1h && prev1h.frr !== 0 ? (frr - prev1h.frr) / Math.abs(prev1h.frr) : 0

  // 24h supply delta
  const prev24h = funding.find(f => f.timestamp <= now - 86400_000)
  const supplyDelta24h = prev24h && prev24h.totalAmount > 0
    ? (fundingCurrent.totalAmount - prev24h.totalAmount) / prev24h.totalAmount
    : 0

  const annualizedRate = frr * 365 * 100
  const derivAnnualized = deriv ? deriv.fundingRate * 3 * 365 * 100 : 0

  // S1: 适合放贷
  if (frrPct >= 0.75 && utilization >= 0.80 && spareCapacity < 0.15) {
    const conf = frrPct >= 0.90 ? 85 : 70
    signals.push({
      id: 'FR-S1',
      module: 'funding',
      direction: 'neutral',
      confidence: conf,
      level: 'yellow',
      title: '适合放贷',
      summary: `FRR P${(frrPct * 100).toFixed(0)}, 利用率 ${(utilization * 100).toFixed(1)}%, 年化 ${annualizedRate.toFixed(1)}%`,
      details: {
        frr, frrPct, utilization, spareCapacity,
        annualizedRate, suggestedPeriod: frrPct >= 0.90 ? 30 : 7,
      },
      timestamp: now,
    })
  }

  // S2: 不适合借杠杆
  if (frrPct >= 0.90 && utilization >= 0.90) {
    signals.push({
      id: 'FR-S2',
      module: 'funding',
      direction: 'neutral',
      confidence: 80,
      level: 'red',
      title: '不适合借杠杆',
      summary: `FRR P${(frrPct * 100).toFixed(0)}, 利用率 ${(utilization * 100).toFixed(1)}%, 费率飙升 ${(rateChange1h * 100).toFixed(1)}%/h`,
      details: { frr, frrPct, utilization, rateChange1h, derivAnnualized },
      timestamp: now,
    })
  }

  // S3: 利率即将回落
  const utilChange1h = prev1h ? utilization - prev1h.utilization : 0
  if (supplyDelta24h > 0.02 && utilChange1h < 0) {
    signals.push({
      id: 'FR-S3',
      module: 'funding',
      direction: 'neutral',
      confidence: 60,
      level: 'yellow',
      title: '利率即将回落',
      summary: `供给恢复 ${(supplyDelta24h * 100).toFixed(1)}%, 利用率下降中`,
      details: { supplyDelta24h, utilChange1h, frr },
      timestamp: now,
    })
  }

  // S4: 正常 (no special condition)
  if (signals.length === 0) {
    signals.push({
      id: 'FR-S4',
      module: 'funding',
      direction: 'neutral',
      confidence: 30,
      level: 'green',
      title: '融资市场正常',
      summary: `FRR P${(frrPct * 100).toFixed(0)}, 利用率 ${(utilization * 100).toFixed(1)}%`,
      details: { frr, frrPct, utilization, annualizedRate },
      timestamp: now,
    })
  }

  return signals
}

function percentile(value: number, sorted: number[]): number {
  if (sorted.length === 0) return 0
  const idx = sorted.findIndex(v => v >= value)
  return idx >= 0 ? idx / sorted.length : 1
}

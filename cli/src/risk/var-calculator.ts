// Simplified VaR calculator based on historical BTC returns
// Uses position sizing to estimate portfolio VaR

import { getTotalPositionUsd, getPositions } from './position-manager.js'

// Rolling window of hourly BTC returns
const returnsHistory: number[] = []
const MAX_RETURNS = 168 // 7 days of hourly data

export function addReturn(returnPct: number) {
  returnsHistory.push(returnPct)
  if (returnsHistory.length > MAX_RETURNS) returnsHistory.shift()
}

export function calculateVaR(confidence: number = 0.95): number {
  if (returnsHistory.length < 24) return 0 // need at least 24h

  const sorted = [...returnsHistory].sort((a, b) => a - b)
  const idx = Math.floor((1 - confidence) * sorted.length)
  const tailReturn = sorted[idx] || sorted[0]

  const totalUsd = getTotalPositionUsd()
  // VaR = position * worst-case return at confidence level
  return Math.abs(tailReturn * totalUsd)
}

export function wouldExceedVaR(additionalUsd: number, maxVarPct: number, totalCapital: number): boolean {
  if (returnsHistory.length < 24) return false // not enough data to judge

  const sorted = [...returnsHistory].sort((a, b) => a - b)
  const tailReturn = sorted[Math.floor(0.05 * sorted.length)] || sorted[0]

  const currentUsd = getTotalPositionUsd()
  const projectedVar = Math.abs(tailReturn * (currentUsd + additionalUsd))
  const maxVar = totalCapital * (maxVarPct / 100)

  return projectedVar > maxVar
}

export function getVarStats(): { var95: number; returnsCount: number; worstReturn: number; avgReturn: number } {
  const var95 = calculateVaR(0.95)
  const worst = returnsHistory.length > 0 ? Math.min(...returnsHistory) : 0
  const avg = returnsHistory.length > 0 ? returnsHistory.reduce((a, b) => a + b, 0) / returnsHistory.length : 0

  return { var95, returnsCount: returnsHistory.length, worstReturn: worst, avgReturn: avg }
}

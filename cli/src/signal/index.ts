import type { MarketSnapshot } from '../collector/types.js'
import type { Signal } from './types.js'
import { generateSmartMoneySignals } from './smart-money.js'
import { generateFundingSignals } from './funding-radar.js'
import { generateLiquidationSignals } from './liquidation.js'
import { generateOrderbookSignals } from './orderbook.js'

export type { Signal } from './types.js'

export function generateAllSignals(snapshot: MarketSnapshot): Signal[] {
  return [
    ...generateSmartMoneySignals(snapshot),
    ...generateFundingSignals(snapshot),
    ...generateLiquidationSignals(snapshot),
    ...generateOrderbookSignals(snapshot),
  ]
}

export function signalSummary(signals: Signal[]): {
  direction: 'long' | 'short' | 'neutral'
  confidence: number
  bullish: number
  bearish: number
  neutral: number
} {
  let bullish = 0
  let bearish = 0
  let neutral = 0
  let bullWeight = 0
  let bearWeight = 0

  for (const s of signals) {
    if (s.direction === 'long') {
      bullish++
      bullWeight += s.confidence
    } else if (s.direction === 'short') {
      bearish++
      bearWeight += s.confidence
    } else {
      neutral++
    }
  }

  const totalDirectional = bullish + bearish
  const direction = totalDirectional === 0 ? 'neutral'
    : bullWeight > bearWeight ? 'long'
    : bullWeight < bearWeight ? 'short'
    : 'neutral'

  if (totalDirectional === 0) {
    return { direction, confidence: 0, bullish, bearish, neutral }
  }

  // Count how many distinct modules contributed directional signals
  const dirModules = new Set(
    signals.filter(s => s.direction !== 'neutral').map(s => s.module)
  )
  const moduleCount = dirModules.size // 1-4
  const maxModules = 4 // smart-money, funding, liquidation, orderbook

  const winCount = direction === 'long' ? bullish : bearish
  const winWeight = direction === 'long' ? bullWeight : bearWeight
  const avgWinConf = winWeight / winCount // average confidence of winning signals

  // Agreement: what fraction of directional signals agree (0.5 if only 1 signal)
  const agreement = totalDirectional > 1 ? winCount / totalDirectional : 0.5

  // Module coverage: more modules agreeing = higher confidence
  const coverage = moduleCount / maxModules

  // Combined: avgConf * agreement_factor * coverage_factor
  // Single signal (conf 75): 75 * 0.75 * 0.475 ≈ 27
  // Two modules agree (conf 70): 70 * 1.0 * 0.65 ≈ 46
  // Three modules agree (conf 70): 70 * 1.0 * 0.825 ≈ 58
  const confidence = avgWinConf * (0.5 + 0.5 * agreement) * (0.3 + 0.7 * coverage)

  return { direction, confidence, bullish, bearish, neutral }
}

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

  const total = bullWeight + bearWeight
  const direction = total === 0 ? 'neutral' : bullWeight > bearWeight ? 'long' : bullWeight < bearWeight ? 'short' : 'neutral'
  const confidence = total > 0 ? Math.abs(bullWeight - bearWeight) / total * 100 : 0

  return { direction, confidence, bullish, bearish, neutral }
}

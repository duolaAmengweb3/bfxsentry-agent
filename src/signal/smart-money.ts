import type { MarketSnapshot } from '../collector/types.js'
import type { Signal } from './types.js'

export function generateSmartMoneySignals(snapshot: MarketSnapshot): Signal[] {
  const { whales, whaleScore, whaleDirection, deriv } = snapshot
  const now = snapshot.timestamp

  if (whales.length === 0) return []

  const longWhales = whales.filter(w => w.direction === 'long')
  const shortWhales = whales.filter(w => w.direction === 'short')
  const totalAligned = Math.max(longWhales.length, shortWhales.length)
  const majorityDir = longWhales.length >= shortWhales.length ? 'long' : 'short'

  // Funding dimension
  const fr = deriv?.fundingRate ?? 0
  const annualized = Math.abs(fr * 3 * 365 * 100)
  let fundingWarning = ''
  if (annualized > 100) fundingWarning = '资金费率过热'

  const direction = whaleScore >= 60 ? 'long' : whaleScore <= 40 ? 'short' : 'neutral'

  const signals: Signal[] = [{
    id: 'SM-1',
    module: 'smart-money',
    direction: direction as Signal['direction'],
    confidence: Math.min(95, whaleScore),
    level: whaleScore >= 70 || whaleScore <= 30 ? 'red' : whaleScore >= 60 || whaleScore <= 40 ? 'yellow' : 'green',
    title: `聪明钱 ${whaleDirection}`,
    summary: `综合评分 ${whaleScore.toFixed(0)}/100, ${totalAligned} 鲸鱼${majorityDir === 'long' ? '做多' : '做空'}主导${fundingWarning ? `, ${fundingWarning}` : ''}`,
    details: {
      score: whaleScore,
      longWhales: longWhales.length,
      shortWhales: shortWhales.length,
      hedgeWhales: whales.length - longWhales.length - shortWhales.length,
      topPnl: whales.slice(0, 5).map(w => ({
        username: w.username, pnl: w.pnl, direction: w.direction,
      })),
      fundingAnnualized: annualized,
    },
    timestamp: now,
  }]

  return signals
}

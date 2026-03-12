import type { Signal } from '../signal/types.js'
import type { TradeIntent } from './types.js'
import type { AgentConfig } from '../core/config.js'
import type { MarketSnapshot } from '../collector/types.js'

export function evaluateSmartFollow(
  signals: Signal[],
  snapshot: MarketSnapshot,
  config: AgentConfig,
): TradeIntent | null {
  const cfg = config.smart_follow as Record<string, unknown>
  if (!cfg.enabled) return null

  const entry = cfg.entry_conditions as Record<string, number | boolean>
  const risk = cfg.risk as Record<string, number>

  const smSignals = signals.filter(s => s.module === 'smart-money')
  if (smSignals.length === 0) return null

  const main = smSignals[0]
  if (main.direction === 'neutral') return null

  // Check entry conditions
  const score = snapshot.whaleScore
  if (score < (entry.min_score as number)) return null

  const whales = snapshot.whales
  const aligned = whales.filter(w => w.direction === main.direction).length
  if (aligned < (entry.min_whales_aligned as number)) return null

  // Position confirmation
  if (entry.position_confirm) {
    const posSignals = signals.filter(s =>
      s.module === 'smart-money' && s.direction === main.direction
    )
    if (posSignals.length === 0) return null
  }

  return {
    id: `sf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    strategy: 'smart-follow',
    direction: main.direction,
    instrument: config.collector.bitfinex.symbol,
    sizePct: risk.size_pct,
    leverage: risk.max_leverage,
    entryPrice: snapshot.ticker.lastPrice,
    stopLossPct: risk.stop_loss_pct,
    takeProfitPct: (cfg.exit_conditions as Record<string, number>).trailing_stop_pct || 1.5,
    confidence: main.confidence,
    reason: `聪明钱 ${main.direction === 'long' ? '看多' : '看空'}, 评分 ${score.toFixed(0)}, ${aligned} 鲸鱼同向`,
    signalIds: smSignals.map(s => s.id),
    timestamp: Date.now(),
    meta: { score, aligned, whaleDirection: snapshot.whaleDirection },
  }
}

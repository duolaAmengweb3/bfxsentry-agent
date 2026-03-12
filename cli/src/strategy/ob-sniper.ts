import type { Signal } from '../signal/types.js'
import type { TradeIntent } from './types.js'
import type { AgentConfig } from '../core/config.js'
import type { MarketSnapshot } from '../collector/types.js'

export function evaluateObSniper(
  signals: Signal[],
  snapshot: MarketSnapshot,
  config: AgentConfig,
): TradeIntent | null {
  const cfg = config.ob_sniper as Record<string, unknown>
  if (!cfg.enabled) return null

  const entry = cfg.entry_conditions as Record<string, unknown>
  const risk = cfg.risk as Record<string, number>
  const obSignals = signals.filter(s => s.module === 'orderbook' && s.direction !== 'neutral')
  if (obSignals.length === 0) return null

  // Pick strongest signal
  const best = obSignals.sort((a, b) => b.confidence - a.confidence)[0]

  // Flow confirmation
  if (entry.require_flow_confirm) {
    const flow = snapshot.tradeFlow
    if (best.direction === 'long' && flow.buyRatio60s < (entry.flow_buy_ratio as number)) return null
    if (best.direction === 'short' && flow.buyRatio60s > (entry.flow_sell_ratio as number)) return null
  }

  // Check signal TTL
  if (best.ttlSec) {
    const age = (Date.now() - best.timestamp) / 1000
    if (age > best.ttlSec) return null
  }

  return {
    id: `ob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    strategy: 'ob-sniper',
    direction: best.direction as 'long' | 'short',
    instrument: config.collector.bitfinex.symbol,
    sizePct: risk.size_pct,
    leverage: risk.max_leverage,
    entryPrice: snapshot.ticker.lastPrice,
    stopLossPct: risk.stop_loss_pct,
    takeProfitPct: risk.take_profit_pct,
    confidence: best.confidence,
    reason: best.summary,
    signalIds: [best.id],
    timestamp: Date.now(),
    ttlSec: risk.signal_ttl_sec,
    meta: {
      signalType: best.id.startsWith('OB-3') ? 'wall_break' : 'imbalance',
      imbalance: (best.details as Record<string, number>).imbalance,
    },
  }
}

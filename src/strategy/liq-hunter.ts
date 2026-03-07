import type { Signal } from '../signal/types.js'
import type { TradeIntent } from './types.js'
import type { AgentConfig } from '../core/config.js'
import type { MarketSnapshot } from '../collector/types.js'

export function evaluateLiqHunter(
  signals: Signal[],
  snapshot: MarketSnapshot,
  config: AgentConfig,
): TradeIntent | null {
  const cfg = config.liq_hunter as Record<string, unknown>
  if (!cfg.enabled) return null

  const risk = cfg.risk as Record<string, number>
  const liqSignals = signals.filter(s => s.module === 'liquidation')
  if (liqSignals.length === 0) return null

  // LQ1/LQ2: Trend follow
  const trendSignal = liqSignals.find(s => s.id === 'LQ-1' || s.id === 'LQ-2')
  if (trendSignal) {
    return {
      id: `lh-trend-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      strategy: 'liq-hunter',
      direction: trendSignal.direction as 'long' | 'short',
      instrument: config.collector.bitfinex.symbol,
      sizePct: risk.size_pct,
      leverage: risk.max_leverage,
      entryPrice: snapshot.ticker.lastPrice,
      stopLossPct: risk.trend_stop_pct,
      takeProfitPct: risk.take_profit_pct,
      confidence: trendSignal.confidence,
      reason: trendSignal.summary,
      signalIds: [trendSignal.id],
      timestamp: Date.now(),
      meta: {
        type: 'trend_follow',
        intensity: (trendSignal.details as Record<string, number>).intensity,
      },
    }
  }

  // LQ3: Reversal (requires orderbook confirmation)
  const reversalCfg = cfg.reversal as Record<string, unknown>
  const reversalSignal = liqSignals.find(s => s.id === 'LQ-3')
  if (reversalSignal && reversalCfg) {
    if (reversalCfg.require_ob_confirm) {
      const obSignals = signals.filter(s => s.module === 'orderbook' && s.direction !== 'neutral')
      const confirmed = obSignals.some(s => s.direction === reversalSignal.direction)
      if (!confirmed) return null
    }

    return {
      id: `lh-rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      strategy: 'liq-hunter',
      direction: reversalSignal.direction as 'long' | 'short',
      instrument: config.collector.bitfinex.symbol,
      sizePct: risk.size_pct * 0.5, // half size for reversal
      leverage: risk.max_leverage,
      entryPrice: snapshot.ticker.lastPrice,
      stopLossPct: risk.reversal_stop_pct,
      takeProfitPct: risk.take_profit_pct,
      confidence: reversalSignal.confidence,
      reason: reversalSignal.summary,
      signalIds: [reversalSignal.id],
      timestamp: Date.now(),
      meta: { type: 'reversal' },
    }
  }

  return null
}

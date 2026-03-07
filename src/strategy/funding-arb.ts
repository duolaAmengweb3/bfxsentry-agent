import type { Signal } from '../signal/types.js'
import type { TradeIntent } from './types.js'
import type { AgentConfig } from '../core/config.js'
import type { MarketSnapshot } from '../collector/types.js'

export function evaluateFundingArb(
  signals: Signal[],
  snapshot: MarketSnapshot,
  config: AgentConfig,
): TradeIntent | null {
  const cfg = config.funding_arb as Record<string, unknown>
  if (!cfg.enabled) return null

  const fundSignals = signals.filter(s => s.module === 'funding')
  if (fundSignals.length === 0) return null

  // S1: Lending opportunity
  const lendSignal = fundSignals.find(s => s.id === 'FR-S1')
  if (lendSignal) {
    const lendCfg = cfg.lend as Record<string, number>
    const details = lendSignal.details as Record<string, number>
    const period = details.frrPct >= lendCfg.high_rate_threshold
      ? lendCfg.high_rate_period_days
      : lendCfg.preferred_period_days

    return {
      id: `fa-lend-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      strategy: 'funding-arb',
      direction: 'long', // lending = providing capital
      instrument: 'fUSD',
      sizePct: lendCfg.lend_amount_pct,
      leverage: 1,
      entryPrice: details.frr,
      stopLossPct: 0, // no stop loss on lending
      takeProfitPct: 0,
      confidence: lendSignal.confidence,
      reason: `适合放贷: FRR P${(details.frrPct * 100).toFixed(0)}, 年化 ${details.annualizedRate.toFixed(1)}%, 建议 ${period} 天`,
      signalIds: [lendSignal.id],
      timestamp: Date.now(),
      meta: { type: 'lend', period, frr: details.frr, utilization: details.utilization },
    }
  }

  // S2: Warning - don't borrow
  const warnSignal = fundSignals.find(s => s.id === 'FR-S2')
  if (warnSignal) {
    // This is an advisory signal, not a trade intent
    // But we can emit a "reduce leverage" intent
    return {
      id: `fa-warn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      strategy: 'funding-arb',
      direction: 'short', // reduce exposure
      instrument: config.collector.bitfinex.symbol,
      sizePct: 0,
      leverage: 1,
      entryPrice: snapshot.ticker.lastPrice,
      stopLossPct: 0,
      takeProfitPct: 0,
      confidence: warnSignal.confidence,
      reason: `高费率警告: 不适合借杠杆, 建议减仓`,
      signalIds: [warnSignal.id],
      timestamp: Date.now(),
      meta: { type: 'warning', action: 'reduce_leverage' },
    }
  }

  return null
}

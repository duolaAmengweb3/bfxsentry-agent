import type { Signal } from '../signal/types.js'
import type { TradeIntent } from './types.js'
import type { AgentConfig } from '../core/config.js'
import type { MarketSnapshot } from '../collector/types.js'
import { signalSummary } from '../signal/index.js'

/**
 * PM Signal Bet — Signal-driven Polymarket auto-betting.
 *
 * Aggregates all BfxSentry signals into a directional view.
 * When confidence exceeds the threshold (default 35%, backtested optimal),
 * generates a bet intent for Polymarket BTC Up/Down markets.
 *
 * Backtest results (30 days, 4h horizon):
 *   Conf ≥ 30%: 52.9% accuracy, +3.9% PM EV
 *   Conf ≥ 35%: 55.6% accuracy, +9.1% PM EV
 *   Conf ≥ 40%: 66.7% accuracy, +31.3% PM EV
 */
export function evaluatePmHedge(
  signals: Signal[],
  snapshot: MarketSnapshot,
  config: AgentConfig,
): TradeIntent | null {
  const cfg = config.pm_hedge as Record<string, unknown>
  if (!cfg.enabled) return null

  const signalCfg = cfg.signal_driven as Record<string, number>
  const minConfidence = signalCfg.min_confidence ?? 35

  // Use the improved signalSummary which accounts for module coverage
  const summary = signalSummary(signals)

  if (summary.direction === 'neutral') return null
  if (summary.confidence < minConfidence) return null

  const stakeUsdc = signalCfg.stake_usdc ?? 100
  const btcPrice = snapshot.ticker.lastPrice

  // Map signal direction to PM market outcome
  // long signal → buy "BTC Up" Yes share
  // short signal → buy "BTC Down" Yes share
  const pmOutcome = summary.direction === 'long' ? 'BTC-Up-Yes' : 'BTC-Down-Yes'
  const pmMarketType = summary.direction === 'long' ? '看涨' : '看跌'

  // Build module breakdown for reason string
  const dirSignals = signals.filter(s => s.direction !== 'neutral')
  const moduleBreakdown = dirSignals.map(s =>
    `${s.module}:${s.direction}(${s.confidence.toFixed(0)})`
  ).join(', ')

  return {
    id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    strategy: 'pm-hedge',
    direction: summary.direction,
    instrument: `polymarket:${pmOutcome}`,
    sizePct: 0, // PM uses fixed USDC stake, not percentage
    leverage: 1,
    entryPrice: btcPrice,
    stopLossPct: 0, // PM bets resolve at market close, no stop loss
    takeProfitPct: 0, // Payout is binary: $1 or $0
    confidence: summary.confidence,
    reason: `PM 信号下注 ${pmMarketType}, 置信度 ${summary.confidence.toFixed(1)}%, ${summary.bullish} 多/${summary.bearish} 空信号 [${moduleBreakdown}]`,
    signalIds: dirSignals.map(s => s.id),
    timestamp: Date.now(),
    meta: {
      pmBet: true,
      pmOutcome,
      stakeUsdc,
      signalDirection: summary.direction,
      signalConfidence: summary.confidence,
      bullCount: summary.bullish,
      bearCount: summary.bearish,
      neutralCount: summary.neutral,
    },
  }
}

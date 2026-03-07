import type { Signal } from '../signal/types.js'
import type { TradeIntent } from './types.js'
import type { AgentConfig } from '../core/config.js'
import type { MarketSnapshot } from '../collector/types.js'

export function evaluatePmHedge(
  signals: Signal[],
  snapshot: MarketSnapshot,
  config: AgentConfig,
): TradeIntent | null {
  const cfg = config.pm_hedge as Record<string, unknown>
  if (!cfg.enabled) return null

  const signalDriven = cfg.signal_driven as Record<string, number>
  const hedge = cfg.hedge as Record<string, unknown>

  // Aggregate all directional signals
  let bullWeight = 0
  let bearWeight = 0
  for (const s of signals) {
    if (s.direction === 'long') bullWeight += s.confidence
    else if (s.direction === 'short') bearWeight += s.confidence
  }

  const total = bullWeight + bearWeight
  if (total === 0) return null

  const rawProb = bullWeight / total
  // Compress towards 50%
  const upProb = 0.5 + (rawProb - 0.5) * 0.6
  const confidence = Math.abs(upProb - 0.5) * 200

  if (confidence < signalDriven.min_confidence) return null

  const direction = upProb > 0.55 ? 'long' : upProb < 0.45 ? 'short' : null
  if (!direction) return null

  // Calculate hedge position
  const btcPrice = snapshot.ticker.lastPrice
  const hedgeBtc = (signalDriven.stake_usdc * (hedge.delta as number)) / btcPrice
  const maxBtc = hedge.max_bfx_position_btc as number

  return {
    id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    strategy: 'pm-hedge',
    direction,
    instrument: hedge.bfx_instrument as string,
    sizePct: 0, // PM hedge uses fixed USDC stake
    leverage: 1,
    entryPrice: btcPrice,
    stopLossPct: 5, // wider stop for hedge
    takeProfitPct: 10,
    confidence,
    reason: `PM 信号聚合 ${direction === 'long' ? '偏多' : '偏空'} ${(upProb * 100).toFixed(0)}%, 对冲 ${Math.min(hedgeBtc, maxBtc).toFixed(5)} BTC`,
    signalIds: signals.filter(s => s.direction !== 'neutral').map(s => s.id),
    timestamp: Date.now(),
    meta: {
      upProb,
      confidence,
      stakeUsdc: signalDriven.stake_usdc,
      hedgeBtc: Math.min(hedgeBtc, maxBtc),
      delta: hedge.delta,
    },
  }
}

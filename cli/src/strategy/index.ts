import type { Signal } from '../signal/types.js'
import type { TradeIntent } from './types.js'
import type { AgentConfig } from '../core/config.js'
import type { MarketSnapshot } from '../collector/types.js'
import { evaluateSmartFollow } from './smart-follow.js'
import { evaluateFundingArb } from './funding-arb.js'
import { evaluateLiqHunter } from './liq-hunter.js'
import { evaluateObSniper } from './ob-sniper.js'
import { evaluatePmHedge } from './pm-hedge.js'

export type { TradeIntent, Position, ExecutionResult, DecisionRecord } from './types.js'

export function evaluateAllStrategies(
  signals: Signal[],
  snapshot: MarketSnapshot,
  config: AgentConfig,
): TradeIntent[] {
  const intents: TradeIntent[] = []

  const evaluators = [
    evaluateSmartFollow,
    evaluateFundingArb,
    evaluateLiqHunter,
    evaluateObSniper,
    evaluatePmHedge,
  ]

  for (const evaluate of evaluators) {
    try {
      const intent = evaluate(signals, snapshot, config)
      if (intent) intents.push(intent)
    } catch {
      // Strategy evaluation failure should not crash the engine
    }
  }

  return intents
}

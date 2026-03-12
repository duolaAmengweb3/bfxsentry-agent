import type { TradeIntent } from '../strategy/types.js'
import type { AgentConfig } from '../core/config.js'
import { isCoolingDown } from './cooldown.js'
import { getOpenPositionCount, getDailyTrades, getTotalPositionUsd, getPositions } from './position-manager.js'
import { getLogger } from '../core/logger.js'

const log = () => getLogger()

export interface FilterResult {
  passed: boolean
  reason?: string
}

export function strategyFilter(intent: TradeIntent, config: AgentConfig): FilterResult {
  const risk = config.risk

  // 1. Max concurrent positions
  if (getOpenPositionCount() >= risk.max_concurrent_positions) {
    return { passed: false, reason: `持仓数已达上限 (${risk.max_concurrent_positions})` }
  }

  // 2. Max daily trades
  if (getDailyTrades() >= risk.max_daily_trades) {
    return { passed: false, reason: `日交易次数已达上限 (${risk.max_daily_trades})` }
  }

  // 3. Max total position
  const intentUsd = intent.sizePct > 0
    ? (intent.sizePct / 100) * risk.max_total_position_usd
    : (intent.meta?.stakeUsdc as number) || 0
  if (getTotalPositionUsd() + intentUsd > risk.max_total_position_usd) {
    return { passed: false, reason: `总仓位将超限 ($${risk.max_total_position_usd})` }
  }

  // 4. Cooldown check
  const cd = isCoolingDown(intent.strategy, intent.direction)
  if (cd.cooling) {
    return { passed: false, reason: `冷却中: ${cd.reason} (${cd.remainingSec}s)` }
  }

  // 5. Confidence threshold
  if (intent.confidence < 30) {
    return { passed: false, reason: `置信度过低 (${intent.confidence.toFixed(0)}% < 30%)` }
  }

  // 6. Conflict resolution
  if (risk.conflict_resolution === 'conservative') {
    const positions = getPositions()
    const conflicting = positions.find(p =>
      p.instrument === intent.instrument && p.direction !== intent.direction
    )
    if (conflicting) {
      return { passed: false, reason: `与现有 ${conflicting.direction} 持仓冲突 (保守模式)` }
    }
  }

  log().debug({ strategy: intent.strategy, direction: intent.direction }, 'Strategy filter passed')
  return { passed: true }
}

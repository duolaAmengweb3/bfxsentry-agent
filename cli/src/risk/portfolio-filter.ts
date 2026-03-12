import type { TradeIntent } from '../strategy/types.js'
import type { AgentConfig } from '../core/config.js'
import {
  getSameDirectionPct,
  getDailyPnl,
  getConsecutiveLosses,
  getLossStreakUsd,
} from './position-manager.js'
import { wouldExceedVaR } from './var-calculator.js'
import { getLogger } from '../core/logger.js'

const log = () => getLogger()

export interface PortfolioFilterResult {
  passed: boolean
  reason?: string
}

let circuitBreakerUntil = 0

export function portfolioFilter(intent: TradeIntent, config: AgentConfig): PortfolioFilterResult {
  const portfolio = config.risk.portfolio

  // 1. Circuit breaker
  if (Date.now() < circuitBreakerUntil) {
    const remaining = Math.ceil((circuitBreakerUntil - Date.now()) / 60000)
    return { passed: false, reason: `熔断中, ${remaining}min 后恢复` }
  }

  const cb = portfolio.circuit_breaker
  if (getConsecutiveLosses() >= cb.consecutive_losses) {
    circuitBreakerUntil = Date.now() + cb.cooldown_minutes * 60000
    log().warn({ consecutiveLosses: getConsecutiveLosses() }, 'Circuit breaker triggered')
    return { passed: false, reason: `连续亏损 ${getConsecutiveLosses()} 笔, 熔断 ${cb.cooldown_minutes}min` }
  }

  if (getLossStreakUsd() >= cb.loss_streak_usd) {
    circuitBreakerUntil = Date.now() + cb.cooldown_minutes * 60000
    log().warn({ lossStreakUsd: getLossStreakUsd() }, 'Circuit breaker triggered (USD)')
    return { passed: false, reason: `连亏 $${getLossStreakUsd().toFixed(0)}, 熔断 ${cb.cooldown_minutes}min` }
  }

  // 2. Daily loss limit
  const maxDailyLoss = config.risk.max_daily_loss_usd
  if (Math.abs(getDailyPnl()) > maxDailyLoss && getDailyPnl() < 0) {
    return { passed: false, reason: `日亏损已达 $${Math.abs(getDailyPnl()).toFixed(0)} (限额 $${maxDailyLoss})` }
  }

  // 3. Same direction concentration
  const dirPct = getSameDirectionPct(intent.direction)
  if (dirPct > portfolio.max_same_direction_pct) {
    return { passed: false, reason: `${intent.direction} 方向集中度 ${dirPct.toFixed(0)}% > ${portfolio.max_same_direction_pct}%` }
  }

  // 4. VaR check
  const intentUsd = intent.sizePct > 0
    ? (intent.sizePct / 100) * config.risk.max_total_position_usd
    : (intent.meta?.stakeUsdc as number) || 0
  if (wouldExceedVaR(intentUsd, portfolio.max_portfolio_var_pct, config.risk.max_total_position_usd)) {
    return { passed: false, reason: `VaR 将超限 (>${portfolio.max_portfolio_var_pct}%)` }
  }

  // 5. Trading hours (if enabled)
  if (portfolio.trading_hours?.enabled && portfolio.trading_hours.active_windows) {
    const now = new Date()
    const utcHour = now.getUTCHours()
    const utcMin = now.getUTCMinutes()
    const utcTime = `${String(utcHour).padStart(2, '0')}:${String(utcMin).padStart(2, '0')}`

    const inWindow = portfolio.trading_hours.active_windows.some(w => {
      return utcTime >= w.start && utcTime <= w.end
    })

    if (!inWindow) {
      return { passed: false, reason: `非交易时段 (UTC ${utcTime}), 仅允许平仓` }
    }
  }

  log().debug({ strategy: intent.strategy }, 'Portfolio filter passed')
  return { passed: true }
}

export function resetCircuitBreaker() {
  circuitBreakerUntil = 0
}

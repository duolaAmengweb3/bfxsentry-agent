import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

export interface AgentConfig {
  engine: {
    mode: 'dry-run' | 'live'
    log_level: 'debug' | 'info' | 'warn' | 'error'
  }
  collector: {
    bitfinex: {
      base_url: string
      symbol: string
      deriv_symbol: string
      funding_symbol: string
      ws_url: string
    }
    polymarket: {
      gamma_url: string
      clob_url: string
    }
  }
  smart_follow: StrategyConfig
  funding_arb: StrategyConfig
  liq_hunter: StrategyConfig
  ob_sniper: StrategyConfig
  pm_hedge: StrategyConfig
  risk: RiskConfig
  recorder: { enabled: boolean; retention_days: number }
}

export interface StrategyConfig {
  enabled: boolean
  tick_interval: number
  [key: string]: unknown
}

export interface RiskConfig {
  max_total_position_usd: number
  max_daily_loss_usd: number
  max_daily_trades: number
  max_concurrent_positions: number
  conflict_resolution: 'conservative' | 'aggressive'
  same_direction_cooldown_sec: number
  opposite_signal_cooldown_sec: number
  max_slippage_pct: number
  order_type: 'limit' | 'market'
  limit_offset_pct: number
  retry: {
    max_attempts: number
    backoff_ms: number[]
    on_max_retry: string
  }
  portfolio: {
    max_portfolio_var_pct: number
    var_confidence: number
    max_same_direction_pct: number
    circuit_breaker: {
      consecutive_losses: number
      loss_streak_usd: number
      cooldown_minutes: number
      action: string
    }
    trading_hours: {
      enabled: boolean
      active_windows?: { start: string; end: string }[]
      inactive_action?: string
    }
  }
}

// Works for both src (dev via tsx) and dist (built via tsc):
// dev:  src/core/config.ts  → ../../config/
// dist: dist/src/core/config.js → ../../../config/
function findConfigDir(): string {
  const candidates = [
    resolve(import.meta.dirname, '..', '..', 'config'),         // from src/core/
    resolve(import.meta.dirname, '..', '..', '..', 'config'),   // from dist/src/core/
  ]
  for (const dir of candidates) {
    try {
      readFileSync(resolve(dir, 'default.yaml'))
      return dir
    } catch { /* try next */ }
  }
  return candidates[0] // fallback, will error with clear message
}

const CONFIG_DIR = findConfigDir()
const DEFAULT_CONFIG_PATH = resolve(CONFIG_DIR, 'default.yaml')

export function loadConfig(customPath?: string): AgentConfig {
  const defaultRaw = readFileSync(DEFAULT_CONFIG_PATH, 'utf-8')
  const defaultCfg = parseYaml(defaultRaw) as AgentConfig

  if (!customPath) return defaultCfg

  const customRaw = readFileSync(resolve(customPath), 'utf-8')
  const customCfg = parseYaml(customRaw) as Partial<AgentConfig>

  return deepMerge(defaultCfg as unknown as Record<string, unknown>, customCfg as unknown as Record<string, unknown>) as unknown as AgentConfig
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (
      source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>)
    } else {
      result[key] = source[key]
    }
  }
  return result
}

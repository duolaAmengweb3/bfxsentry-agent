/**
 * 自动调参优化器：基于同一份历史数据，遍历参数组合，找到最优配置。
 * 数据只拉一次，信号只算一次，策略+风控循环跑多次。
 */
import { generateAllSignals, type Signal } from '../signal/index.js'
import { evaluateAllStrategies } from '../strategy/index.js'
import { strategyFilter } from '../risk/strategy-filter.js'
import { portfolioFilter, resetCircuitBreaker } from '../risk/portfolio-filter.js'
import { simulateFill } from './fill-simulator.js'
import {
  openPosition, closePosition, checkStopLossAndTakeProfit,
  updatePositionPrices, getPositions, resetForBacktest,
} from '../risk/position-manager.js'
import { clearCooldowns } from '../risk/cooldown.js'
import { fetchHistoricalSnapshots } from './historical-fetcher.js'
import type { AgentConfig } from '../core/config.js'
import type { MarketSnapshot } from '../collector/types.js'
import type { BacktestResult } from './runner.js'

// ── Parameter Grid Definition ──

interface ParamSet {
  label: string
  apply: (cfg: AgentConfig) => void
}

function generateParamGrid(): ParamSet[] {
  const grid: ParamSet[] = []

  // SL/TP multipliers × entry threshold combos
  const slMultipliers = [0.5, 1, 1.5, 2, 3]
  const tpMultipliers = [0.5, 1, 1.5, 2, 3]
  const minScores = [55, 60, 65]
  const minConfidences = [15, 20, 30]

  for (const slMul of slMultipliers) {
    for (const tpMul of tpMultipliers) {
      for (const minScore of minScores) {
        for (const minConf of minConfidences) {
          grid.push({
            label: `SL×${slMul} TP×${tpMul} Score≥${minScore} Conf≥${minConf}`,
            apply: (cfg) => {
              // Smart follow
              const sf = cfg.smart_follow as Record<string, unknown>
              const sfRisk = sf.risk as Record<string, number>
              const sfEntry = sf.entry_conditions as Record<string, unknown>
              sfRisk.stop_loss_pct = 2.0 * slMul
              const sfExit = sf.exit_conditions as Record<string, number>
              sfExit.trailing_stop_pct = 1.5 * tpMul
              sfEntry.min_score = minScore

              // Liq hunter
              const lh = cfg.liq_hunter as Record<string, unknown>
              const lhRisk = lh.risk as Record<string, number>
              lhRisk.trend_stop_pct = 0.5 * slMul
              lhRisk.reversal_stop_pct = 0.3 * slMul
              lhRisk.take_profit_pct = 1.0 * tpMul

              // OB sniper
              const ob = cfg.ob_sniper as Record<string, unknown>
              const obRisk = ob.risk as Record<string, number>
              obRisk.stop_loss_pct = 0.3 * slMul
              obRisk.take_profit_pct = 0.5 * tpMul

              // PM hedge
              const pm = cfg.pm_hedge as Record<string, unknown>
              const pmSignal = pm.signal_driven as Record<string, number>
              pmSignal.min_confidence = minConf
            },
          })
        }
      }
    }
  }

  return grid
}

// ── Core simulation loop (no data fetching) ──

interface BacktestTrade {
  timestamp: number
  strategy: string
  direction: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  pnl: number
  holdingMs: number
  reason: string
}

function runSimulation(
  snapshots: MarketSnapshot[],
  signalsPerSnapshot: Signal[][],
  config: AgentConfig,
  strategyFilter_: string | undefined,
): BacktestResult {
  resetForBacktest()
  resetCircuitBreaker()
  clearCooldowns()

  const trades: BacktestTrade[] = []
  let equity = 5000
  let peakEquity = equity
  let maxDrawdown = 0
  const returns: number[] = []
  const positionCache = new Map<string, { strategy: string; direction: 'long' | 'short'; entryPrice: number; openedAt: number }>()

  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i]
    const price = snapshot.ticker.lastPrice

    updatePositionPrices(price)

    // Cache positions before SL/TP
    for (const pos of getPositions()) {
      positionCache.set(pos.id, {
        strategy: pos.strategy, direction: pos.direction,
        entryPrice: pos.entryPrice, openedAt: pos.openedAt,
      })
    }

    const closed = checkStopLossAndTakeProfit(price)
    for (const c of closed) {
      const cached = positionCache.get(c.posId)
      trades.push({
        timestamp: snapshot.timestamp,
        strategy: cached?.strategy || 'unknown',
        direction: cached?.direction || 'long',
        entryPrice: cached?.entryPrice || 0,
        exitPrice: price, pnl: c.pnl,
        holdingMs: cached ? snapshot.timestamp - cached.openedAt : 0,
        reason: c.reason,
      })
      equity += c.pnl
      returns.push(c.pnl / equity)
    }

    // Use cached signals, re-evaluate strategies with new config
    const signals = signalsPerSnapshot[i]
    let intents = evaluateAllStrategies(signals, snapshot, config)

    if (strategyFilter_) {
      intents = intents.filter(i => i.strategy === strategyFilter_)
    }

    // Close on reverse signal
    for (const intent of intents) {
      const existingPositions = getPositions()
      const reversePos = existingPositions.filter(
        p => p.strategy === intent.strategy && p.direction !== intent.direction,
      )
      for (const rp of reversePos) {
        const cached = positionCache.get(rp.id)
        const pnl = closePosition(rp.id, price, '反向信号平仓')
        trades.push({
          timestamp: snapshot.timestamp,
          strategy: cached?.strategy || rp.strategy,
          direction: cached?.direction || rp.direction,
          entryPrice: cached?.entryPrice || rp.entryPrice,
          exitPrice: price, pnl,
          holdingMs: cached ? snapshot.timestamp - cached.openedAt : 0,
          reason: '反向信号平仓',
        })
        equity += pnl
        returns.push(pnl / equity)
      }
    }

    // Risk filter + execute
    for (const intent of intents) {
      if (!intent.meta) intent.meta = {}
      intent.meta.timestamp = snapshot.timestamp

      const sf = strategyFilter(intent, config)
      if (!sf.passed) continue
      const pf = portfolioFilter(intent, config)
      if (!pf.passed) continue

      const result = simulateFill(intent, snapshot)
      if (result.success) {
        const pos = openPosition(intent, result)
        if (pos) {
          positionCache.set(pos.id, {
            strategy: pos.strategy, direction: pos.direction,
            entryPrice: pos.entryPrice, openedAt: pos.openedAt,
          })
        }
      }
    }

    if (equity > peakEquity) peakEquity = equity
    const dd = (peakEquity - equity) / peakEquity
    if (dd > maxDrawdown) maxDrawdown = dd
  }

  // Close remaining
  const lastSnapshot = snapshots[snapshots.length - 1]
  for (const pos of getPositions()) {
    const pnl = closePosition(pos.id, lastSnapshot.ticker.lastPrice, '回测结束')
    trades.push({
      timestamp: lastSnapshot.timestamp,
      strategy: pos.strategy, direction: pos.direction,
      entryPrice: pos.entryPrice, exitPrice: lastSnapshot.ticker.lastPrice,
      pnl, holdingMs: lastSnapshot.timestamp - pos.openedAt,
      reason: '回测结束平仓',
    })
    equity += pnl
    returns.push(pnl / equity)
  }

  const wins = trades.filter(t => t.pnl > 0).length
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0)
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0
  const stdReturn = returns.length > 1
    ? Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (returns.length - 1))
    : 0
  const sharpe = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0

  return {
    strategy: strategyFilter_ || 'all',
    period: {
      start: snapshots[0].timestamp,
      end: snapshots[snapshots.length - 1].timestamp,
      days: Math.round((snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp) / 86400_000),
    },
    snapshotsUsed: snapshots.length,
    trades,
    summary: {
      totalTrades: trades.length,
      wins,
      losses: trades.length - wins,
      winRate: trades.length > 0 ? wins / trades.length : 0,
      totalPnl,
      avgPnl: trades.length > 0 ? totalPnl / trades.length : 0,
      maxDrawdown,
      sharpeRatio: sharpe,
    },
  }
}

// ── Scoring function ──

function scoreResult(r: BacktestResult): number {
  const { summary } = r
  if (summary.totalTrades === 0) return -Infinity
  // Composite: PnL (40%) + Sharpe (30%) + WinRate (20%) + Trade Count bonus (10%)
  const pnlScore = summary.totalPnl
  const sharpeScore = summary.sharpeRatio * 10
  const wrScore = summary.winRate * 100
  const tradeBonus = Math.min(summary.totalTrades, 20) * 2 // bonus for more trades (up to 20)

  return pnlScore * 0.4 + sharpeScore * 0.3 + wrScore * 0.2 + tradeBonus * 0.1
}

// ── Main export ──

export interface OptimizeResult {
  best: BacktestResult
  bestParams: string
  default: BacktestResult
  totalCombinations: number
  topResults: { params: string; pnl: number; winRate: number; trades: number; sharpe: number; score: number }[]
}

export async function runOptimizedBacktest(
  baseConfig: AgentConfig,
  strategyFilter_: string | undefined,
  days: number,
  onProgress?: (msg: string) => void,
): Promise<OptimizeResult> {
  const progress = (msg: string) => onProgress?.(msg)

  // Step 1: Fetch data once
  progress('拉取历史数据...')
  const snapshots = await fetchHistoricalSnapshots(baseConfig, days, (p) => {
    progress(`${p.phase}: ${p.detail}`)
  })

  if (snapshots.length === 0) {
    throw new Error('无法获取历史数据')
  }

  // Step 2: Pre-compute signals for all snapshots (they don't depend on strategy params)
  progress('计算信号...')
  const signalsPerSnapshot = snapshots.map(s => generateAllSignals(s))

  // Step 3: Run default config first
  progress('运行默认参数...')
  const defaultResult = runSimulation(snapshots, signalsPerSnapshot, deepCloneConfig(baseConfig), strategyFilter_)

  // Step 4: Generate param grid and run all combos
  const grid = generateParamGrid()
  progress(`优化中... 共 ${grid.length} 种参数组合`)

  let bestScore = -Infinity
  let bestResult = defaultResult
  let bestParams = '默认参数'

  const allResults: { params: string; result: BacktestResult; score: number }[] = []

  for (let i = 0; i < grid.length; i++) {
    const paramSet = grid[i]
    const cfg = deepCloneConfig(baseConfig)
    paramSet.apply(cfg)

    const result = runSimulation(snapshots, signalsPerSnapshot, cfg, strategyFilter_)
    const score = scoreResult(result)

    allResults.push({ params: paramSet.label, result, score })

    if (score > bestScore) {
      bestScore = score
      bestResult = result
      bestParams = paramSet.label
    }

    // Progress every 25 combos
    if ((i + 1) % 25 === 0) {
      progress(`已完成 ${i + 1}/${grid.length}`)
    }
  }

  progress(`优化完成！最佳: ${bestParams}`)

  // Top 5 results
  allResults.sort((a, b) => b.score - a.score)
  const topResults = allResults.slice(0, 5).map(r => ({
    params: r.params,
    pnl: r.result.summary.totalPnl,
    winRate: r.result.summary.winRate,
    trades: r.result.summary.totalTrades,
    sharpe: r.result.summary.sharpeRatio,
    score: r.score,
  }))

  return {
    best: bestResult,
    bestParams,
    default: defaultResult,
    totalCombinations: grid.length,
    topResults,
  }
}

function deepCloneConfig(cfg: AgentConfig): AgentConfig {
  return JSON.parse(JSON.stringify(cfg))
}

import { generateAllSignals } from '../signal/index.js'
import { evaluateAllStrategies } from '../strategy/index.js'
import { strategyFilter } from '../risk/strategy-filter.js'
import { portfolioFilter, resetCircuitBreaker } from '../risk/portfolio-filter.js'
import { simulateFill } from './fill-simulator.js'
import { openPosition, closePosition, checkStopLossAndTakeProfit, updatePositionPrices, getPositions, resetForBacktest } from '../risk/position-manager.js'
import { clearCooldowns } from '../risk/cooldown.js'
import { fetchHistoricalSnapshots } from './historical-fetcher.js'
import type { AgentConfig } from '../core/config.js'
import type { MarketSnapshot } from '../collector/types.js'

export interface BacktestResult {
  strategy: string | 'all'
  period: { start: number; end: number; days: number }
  snapshotsUsed: number
  trades: BacktestTrade[]
  summary: {
    totalTrades: number
    wins: number
    losses: number
    winRate: number
    totalPnl: number
    avgPnl: number
    maxDrawdown: number
    sharpeRatio: number
  }
}

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

export async function runBacktest(
  config: AgentConfig,
  strategyFilter_: string | undefined,
  days: number,
): Promise<BacktestResult> {
  // Reset all stateful modules for clean backtest
  resetForBacktest()
  resetCircuitBreaker()
  clearCooldowns()

  // 从 Bitfinex API 直接拉取历史数据
  const snapshots = await fetchHistoricalSnapshots(config, days, (p) => {
    if (process.stderr.isTTY) {
      process.stderr.write(`\r  ${p.phase}: ${p.detail}`)
    }
  })
  if (process.stderr.isTTY) process.stderr.write('\n')

  if (snapshots.length === 0) {
    return emptyResult(strategyFilter_ || 'all', days)
  }

  const trades: BacktestTrade[] = []
  let equity = 5000
  let peakEquity = equity
  let maxDrawdown = 0
  const returns: number[] = []

  // Keep a map of position data for lookup after close
  const positionCache = new Map<string, { strategy: string; direction: 'long' | 'short'; entryPrice: number; openedAt: number }>()

  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i]
    const price = snapshot.ticker.lastPrice

    // Update positions
    updatePositionPrices(price)

    // Cache current position data before SL/TP check (closePosition removes them)
    for (const pos of getPositions()) {
      positionCache.set(pos.id, {
        strategy: pos.strategy,
        direction: pos.direction,
        entryPrice: pos.entryPrice,
        openedAt: pos.openedAt,
      })
    }

    // Check stop loss / take profit
    const closed = checkStopLossAndTakeProfit(price)
    for (const c of closed) {
      const cached = positionCache.get(c.posId)
      trades.push({
        timestamp: snapshot.timestamp,
        strategy: cached?.strategy || 'unknown',
        direction: cached?.direction || 'long',
        entryPrice: cached?.entryPrice || 0,
        exitPrice: price,
        pnl: c.pnl,
        holdingMs: cached ? snapshot.timestamp - cached.openedAt : 0,
        reason: c.reason,
      })
      equity += c.pnl
      returns.push(c.pnl / equity)
    }

    // Generate signals and evaluate strategies
    const signals = generateAllSignals(snapshot)
    let intents = evaluateAllStrategies(signals, snapshot, config)

    if (strategyFilter_) {
      intents = intents.filter(i => i.strategy === strategyFilter_)
    }

    // Close positions on reverse signal (backtest enhancement)
    for (const intent of intents) {
      const existingPositions = getPositions()
      const reversePos = existingPositions.filter(
        p => p.strategy === intent.strategy && p.direction !== intent.direction
      )
      for (const rp of reversePos) {
        const cached = positionCache.get(rp.id)
        const pnl = closePosition(rp.id, price, '反向信号平仓')
        trades.push({
          timestamp: snapshot.timestamp,
          strategy: cached?.strategy || rp.strategy,
          direction: cached?.direction || rp.direction,
          entryPrice: cached?.entryPrice || rp.entryPrice,
          exitPrice: price,
          pnl,
          holdingMs: cached ? snapshot.timestamp - cached.openedAt : 0,
          reason: '反向信号平仓',
        })
        equity += pnl
        returns.push(pnl / equity)
      }
    }

    // Risk filter + execute
    for (const intent of intents) {
      // Inject timestamp for position tracking
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
            strategy: pos.strategy,
            direction: pos.direction,
            entryPrice: pos.entryPrice,
            openedAt: pos.openedAt,
          })
        }
      }
    }

    // Track drawdown
    if (equity > peakEquity) peakEquity = equity
    const dd = (peakEquity - equity) / peakEquity
    if (dd > maxDrawdown) maxDrawdown = dd
  }

  // Close remaining positions at last price
  const lastSnapshot = snapshots[snapshots.length - 1]
  const remaining = getPositions()
  for (const pos of remaining) {
    const pnl = closePosition(pos.id, lastSnapshot.ticker.lastPrice, '回测结束')
    trades.push({
      timestamp: lastSnapshot.timestamp,
      strategy: pos.strategy,
      direction: pos.direction,
      entryPrice: pos.entryPrice,
      exitPrice: lastSnapshot.ticker.lastPrice,
      pnl,
      holdingMs: lastSnapshot.timestamp - pos.openedAt,
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
      days,
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

function emptyResult(strategy: string, days: number): BacktestResult {
  return {
    strategy,
    period: { start: 0, end: 0, days },
    snapshotsUsed: 0,
    trades: [],
    summary: {
      totalTrades: 0, wins: 0, losses: 0, winRate: 0,
      totalPnl: 0, avgPnl: 0, maxDrawdown: 0, sharpeRatio: 0,
    },
  }
}

import Database from 'better-sqlite3'
import { generateAllSignals } from '../signal/index.js'
import { evaluateAllStrategies } from '../strategy/index.js'
import { strategyFilter } from '../risk/strategy-filter.js'
import { portfolioFilter } from '../risk/portfolio-filter.js'
import { simulateFill } from './fill-simulator.js'
import { openPosition, closePosition, checkStopLossAndTakeProfit, updatePositionPrices, getPositions } from '../risk/position-manager.js'
import { getDbPath } from '../core/paths.js'
import type { AgentConfig } from '../core/config.js'
import type { MarketSnapshot } from '../collector/types.js'
import type { TradeIntent } from '../strategy/types.js'

const DB_PATH = getDbPath()

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
  const db = new Database(DB_PATH, { readonly: true })

  const cutoff = Date.now() - days * 86400_000
  const rows = db.prepare(`
    SELECT data_json, signals_json, timestamp FROM snapshots
    WHERE timestamp >= ? ORDER BY timestamp ASC
  `).all(cutoff) as { data_json: string; signals_json: string; timestamp: number }[]

  db.close()

  if (rows.length === 0) {
    return emptyResult(strategyFilter_ || 'all', days)
  }

  const trades: BacktestTrade[] = []
  let equity = 5000
  let peakEquity = equity
  let maxDrawdown = 0
  const returns: number[] = []

  for (let i = 0; i < rows.length; i++) {
    const snapshot = JSON.parse(rows[i].data_json) as MarketSnapshot
    const price = snapshot.ticker.lastPrice

    // Update positions
    updatePositionPrices(price)

    // Check stop loss / take profit
    const closed = checkStopLossAndTakeProfit(price)
    for (const c of closed) {
      const pos = getPositions().find(p => p.id === c.posId)
      trades.push({
        timestamp: snapshot.timestamp,
        strategy: pos?.strategy || 'unknown',
        direction: pos?.direction || 'long',
        entryPrice: pos?.entryPrice || 0,
        exitPrice: price,
        pnl: c.pnl,
        holdingMs: pos ? snapshot.timestamp - pos.openedAt : 0,
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

    // Risk filter + execute
    for (const intent of intents) {
      const sf = strategyFilter(intent, config)
      if (!sf.passed) continue
      const pf = portfolioFilter(intent, config)
      if (!pf.passed) continue

      const result = simulateFill(intent, snapshot)
      if (result.success) {
        openPosition(intent, result)
      }
    }

    // Track drawdown
    if (equity > peakEquity) peakEquity = equity
    const dd = (peakEquity - equity) / peakEquity
    if (dd > maxDrawdown) maxDrawdown = dd
  }

  // Close remaining positions at last price
  const lastSnapshot = JSON.parse(rows[rows.length - 1].data_json) as MarketSnapshot
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
      start: rows[0].timestamp,
      end: rows[rows.length - 1].timestamp,
      days,
    },
    snapshotsUsed: rows.length,
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

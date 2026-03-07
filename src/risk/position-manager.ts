import Database from 'better-sqlite3'
import type { Position, TradeIntent, ExecutionResult } from '../strategy/types.js'
import { addCooldown } from './cooldown.js'
import { getDbPath } from '../core/paths.js'

const positions: Position[] = []
let dailyTrades = 0
let dailyPnl = 0
let consecutiveLosses = 0
let lossStreakUsd = 0
let lastResetDate = ''

// ── SQLite persistence ──
const DB_PATH = getDbPath()
let posDb: Database.Database | null = null

function getDb(): Database.Database {
  if (!posDb) {
    posDb = new Database(DB_PATH)
    posDb.pragma('journal_mode = WAL')
    posDb.exec(`
      CREATE TABLE IF NOT EXISTS positions (
        id TEXT PRIMARY KEY,
        data_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS risk_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `)
  }
  return posDb
}

export function persistPositions() {
  const db = getDb()
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM positions').run()
    const stmt = db.prepare('INSERT INTO positions (id, data_json) VALUES (?, ?)')
    for (const p of positions) {
      stmt.run(p.id, JSON.stringify(p))
    }
    // Save risk state
    const upsert = db.prepare('INSERT OR REPLACE INTO risk_state (key, value) VALUES (?, ?)')
    upsert.run('dailyTrades', String(dailyTrades))
    upsert.run('dailyPnl', String(dailyPnl))
    upsert.run('consecutiveLosses', String(consecutiveLosses))
    upsert.run('lossStreakUsd', String(lossStreakUsd))
    upsert.run('lastResetDate', lastResetDate)
  })
  tx()
}

export function restorePositions() {
  const db = getDb()
  // Restore positions
  const rows = db.prepare('SELECT data_json FROM positions').all() as { data_json: string }[]
  positions.length = 0
  for (const row of rows) {
    positions.push(JSON.parse(row.data_json) as Position)
  }
  // Restore risk state
  const stateRows = db.prepare('SELECT key, value FROM risk_state').all() as { key: string; value: string }[]
  for (const { key, value } of stateRows) {
    if (key === 'dailyTrades') dailyTrades = parseInt(value) || 0
    if (key === 'dailyPnl') dailyPnl = parseFloat(value) || 0
    if (key === 'consecutiveLosses') consecutiveLosses = parseInt(value) || 0
    if (key === 'lossStreakUsd') lossStreakUsd = parseFloat(value) || 0
    if (key === 'lastResetDate') lastResetDate = value
  }
}

export function closePositionDb() {
  if (posDb) { posDb.close(); posDb = null }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function resetDailyIfNeeded() {
  const today = todayKey()
  if (lastResetDate !== today) {
    dailyTrades = 0
    dailyPnl = 0
    lastResetDate = today
  }
}

export function getPositions(): Position[] {
  return [...positions]
}

export function getOpenPositionCount(): number {
  return positions.length
}

export function getTotalPositionUsd(): number {
  return positions.reduce((s, p) => s + p.sizeUsd, 0)
}

export function getSameDirectionPct(direction: 'long' | 'short'): number {
  const total = getTotalPositionUsd()
  if (total === 0) return 0
  const sameDir = positions.filter(p => p.direction === direction).reduce((s, p) => s + p.sizeUsd, 0)
  return (sameDir / total) * 100
}

export function getDailyTrades(): number {
  resetDailyIfNeeded()
  return dailyTrades
}

export function getDailyPnl(): number {
  resetDailyIfNeeded()
  return dailyPnl
}

export function getConsecutiveLosses(): number {
  return consecutiveLosses
}

export function getLossStreakUsd(): number {
  return lossStreakUsd
}

export function openPosition(intent: TradeIntent, result: ExecutionResult): Position | null {
  if (!result.success || !result.fillPrice || !result.fillSize) return null

  resetDailyIfNeeded()
  dailyTrades++

  const pos: Position = {
    id: intent.id,
    strategy: intent.strategy,
    direction: intent.direction,
    instrument: intent.instrument,
    entryPrice: result.fillPrice,
    currentPrice: result.fillPrice,
    size: result.fillSize,
    sizeUsd: result.fillSize * result.fillPrice,
    leverage: intent.leverage,
    unrealizedPnl: 0,
    unrealizedPnlPct: 0,
    stopLoss: intent.direction === 'long'
      ? result.fillPrice * (1 - intent.stopLossPct / 100)
      : result.fillPrice * (1 + intent.stopLossPct / 100),
    takeProfit: intent.direction === 'long'
      ? result.fillPrice * (1 + intent.takeProfitPct / 100)
      : result.fillPrice * (1 - intent.takeProfitPct / 100),
    openedAt: Date.now(),
    highWatermark: result.fillPrice,
    trailingStopPct: intent.takeProfitPct,
  }

  positions.push(pos)
  persistPositions()
  return pos
}

export function closePosition(posId: string, exitPrice: number, reason: string): number {
  const idx = positions.findIndex(p => p.id === posId)
  if (idx === -1) return 0

  const pos = positions[idx]
  const pnl = pos.direction === 'long'
    ? (exitPrice - pos.entryPrice) * pos.size
    : (pos.entryPrice - exitPrice) * pos.size

  resetDailyIfNeeded()
  dailyPnl += pnl

  if (pnl < 0) {
    consecutiveLosses++
    lossStreakUsd += Math.abs(pnl)
    // Add cooldown on loss
    addCooldown(pos.strategy, pos.direction, 300, `止损: ${reason}`)
  } else {
    consecutiveLosses = 0
    lossStreakUsd = 0
  }

  positions.splice(idx, 1)
  persistPositions()
  return pnl
}

export function updatePositionPrices(currentPrice: number) {
  for (const pos of positions) {
    pos.currentPrice = currentPrice
    pos.unrealizedPnl = pos.direction === 'long'
      ? (currentPrice - pos.entryPrice) * pos.size
      : (pos.entryPrice - currentPrice) * pos.size
    pos.unrealizedPnlPct = (pos.unrealizedPnl / pos.sizeUsd) * 100

    // Update high watermark for trailing stop
    if (pos.direction === 'long' && currentPrice > pos.highWatermark) {
      pos.highWatermark = currentPrice
    } else if (pos.direction === 'short' && currentPrice < pos.highWatermark) {
      pos.highWatermark = currentPrice
    }
  }
}

export function checkStopLossAndTakeProfit(currentPrice: number): { posId: string; reason: string; pnl: number }[] {
  const closed: { posId: string; reason: string; pnl: number }[] = []

  for (const pos of [...positions]) {
    let shouldClose = false
    let reason = ''

    if (pos.direction === 'long') {
      if (currentPrice <= pos.stopLoss) { shouldClose = true; reason = '触发止损' }
      if (currentPrice >= pos.takeProfit) { shouldClose = true; reason = '触发止盈' }
    } else {
      if (currentPrice >= pos.stopLoss) { shouldClose = true; reason = '触发止损' }
      if (currentPrice <= pos.takeProfit) { shouldClose = true; reason = '触发止盈' }
    }

    // Trailing stop
    if (pos.trailingStopPct && !shouldClose) {
      const trailPrice = pos.direction === 'long'
        ? pos.highWatermark * (1 - pos.trailingStopPct / 100)
        : pos.highWatermark * (1 + pos.trailingStopPct / 100)
      if (pos.direction === 'long' && currentPrice <= trailPrice) {
        shouldClose = true; reason = '移动止损'
      } else if (pos.direction === 'short' && currentPrice >= trailPrice) {
        shouldClose = true; reason = '移动止损'
      }
    }

    if (shouldClose) {
      const pnl = closePosition(pos.id, currentPrice, reason)
      closed.push({ posId: pos.id, reason, pnl })
    }
  }

  return closed
}

export function closeAllPositions(currentPrice: number): number {
  let totalPnl = 0
  for (const pos of [...positions]) {
    totalPnl += closePosition(pos.id, currentPrice, '手动全平')
  }
  return totalPnl
}

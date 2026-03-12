import Database from 'better-sqlite3'
import { getLogger } from './logger.js'
import { getDbPath } from './paths.js'
import type { DecisionRecord } from '../strategy/types.js'

const log = () => getLogger()

let db: Database.Database | null = null
const DB_PATH = getDbPath()

export function initDecisionLog() {
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      strategy TEXT NOT NULL,
      signals_json TEXT,
      config_json TEXT,
      intent_json TEXT,
      risk_result_json TEXT,
      execution_json TEXT,
      pnl_at_exit REAL
    );
    CREATE INDEX IF NOT EXISTS idx_decisions_ts ON decisions(timestamp);
    CREATE INDEX IF NOT EXISTS idx_decisions_strategy ON decisions(strategy);
  `)
}

export function logDecision(record: DecisionRecord) {
  if (!db) initDecisionLog()
  if (!db) return

  const stmt = db.prepare(`
    INSERT INTO decisions (timestamp, strategy, signals_json, config_json, intent_json, risk_result_json, execution_json, pnl_at_exit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    record.timestamp,
    record.strategy,
    JSON.stringify(record.signalsSnapshot),
    JSON.stringify(record.configSnapshot),
    record.intent ? JSON.stringify(record.intent) : null,
    JSON.stringify(record.riskFilterResult),
    record.executionResult ? JSON.stringify(record.executionResult) : null,
    record.pnlAtExit ?? null,
  )
}

export function updateDecisionPnl(intentId: string, pnl: number) {
  if (!db) return
  db.prepare(`
    UPDATE decisions SET pnl_at_exit = ? WHERE intent_json LIKE ?
  `).run(pnl, `%"id":"${intentId}"%`)
}

export function getRecentDecisions(limit = 20): DecisionRecord[] {
  if (!db) initDecisionLog()
  if (!db) return []

  const rows = db.prepare(`
    SELECT * FROM decisions ORDER BY timestamp DESC LIMIT ?
  `).all(limit) as Record<string, unknown>[]

  return rows.map(row => ({
    timestamp: row.timestamp as number,
    strategy: row.strategy as string,
    signalsSnapshot: JSON.parse((row.signals_json as string) || '[]'),
    configSnapshot: JSON.parse((row.config_json as string) || '{}'),
    intent: row.intent_json ? JSON.parse(row.intent_json as string) : null,
    riskFilterResult: JSON.parse((row.risk_result_json as string) || '{"passed":false}'),
    executionResult: row.execution_json ? JSON.parse(row.execution_json as string) : null,
    pnlAtExit: row.pnl_at_exit as number | undefined,
  }))
}

export function closeDecisionLog() {
  if (db) { db.close(); db = null }
}

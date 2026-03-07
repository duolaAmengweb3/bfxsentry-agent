import Database from 'better-sqlite3'
import { getLogger } from './logger.js'
import { getDbPath } from './paths.js'
import type { MarketSnapshot } from '../collector/types.js'
import type { Signal } from '../signal/types.js'

const log = () => getLogger()

let db: Database.Database | null = null

const DB_PATH = getDbPath()

export function initRecorder() {
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      data_json TEXT NOT NULL,
      signals_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_snapshots_ts ON snapshots(timestamp);
  `)
  log().info({ path: DB_PATH }, 'Recorder initialized')
}

export function recordSnapshot(snapshot: MarketSnapshot, signals: Signal[]) {
  if (!db) return
  const stmt = db.prepare(
    'INSERT INTO snapshots (timestamp, data_json, signals_json) VALUES (?, ?, ?)'
  )
  stmt.run(
    snapshot.timestamp,
    JSON.stringify(snapshot),
    JSON.stringify(signals),
  )
}

export function cleanOldSnapshots(retentionDays: number) {
  if (!db) return
  const cutoff = Date.now() - retentionDays * 86400_000
  const result = db.prepare('DELETE FROM snapshots WHERE timestamp < ?').run(cutoff)
  if (result.changes > 0) {
    log().info({ deleted: result.changes, retentionDays }, 'Cleaned old snapshots')
  }
}

export function closeRecorder() {
  if (db) {
    db.close()
    db = null
  }
}

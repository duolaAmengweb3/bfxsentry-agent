import { resolve } from 'node:path'
import { mkdirSync, readFileSync } from 'node:fs'

// Resolve project root data/ directory regardless of dev (src/) or dist (dist/src/) execution.
// Uses the same probing strategy as config.ts — try both candidate paths.
function findProjectRoot(): string {
  const candidates = [
    resolve(import.meta.dirname, '..', '..'),          // from src/core/
    resolve(import.meta.dirname, '..', '..', '..'),    // from dist/src/core/
  ]
  for (const dir of candidates) {
    try {
      readFileSync(resolve(dir, 'package.json'))
      return dir
    } catch { /* try next */ }
  }
  return candidates[0]
}

const PROJECT_ROOT = findProjectRoot()

export function getDataDir(): string {
  const dir = resolve(PROJECT_ROOT, 'data')
  try { mkdirSync(dir, { recursive: true }) } catch { /* already exists */ }
  return dir
}

export function getDbPath(): string {
  return resolve(getDataDir(), 'sentry.db')
}

export function getPidPath(): string {
  return resolve(getDataDir(), 'sentry.pid')
}

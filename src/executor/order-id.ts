import crypto from 'node:crypto'

// Generate a unique client order ID per intent.
// Each call produces a new CID. Idempotency is handled by attaching the CID to the intent
// and reusing it on retry — not by time-bucket dedup.
export function generateCid(strategy: string): string {
  const ts = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomBytes(4).toString('hex')
  return `sentry-${strategy.replace(/[^a-z0-9]/gi, '')}-${ts}-${nonce}`
}

// Track submitted CIDs to prevent duplicate submissions of the same intent
const submittedCids = new Set<string>()

export function markCidSubmitted(cid: string) {
  submittedCids.add(cid)
  // Prevent memory leak: cap at 10k entries
  if (submittedCids.size > 10_000) {
    const first = submittedCids.values().next().value
    if (first) submittedCids.delete(first)
  }
}

export function isCidSubmitted(cid: string): boolean {
  return submittedCids.has(cid)
}

export function clearCids() {
  submittedCids.clear()
}

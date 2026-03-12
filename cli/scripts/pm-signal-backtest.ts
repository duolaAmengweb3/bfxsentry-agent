/**
 * PM Signal Accuracy Backtest
 * Tests how well BfxSentry's aggregated signals predict next-candle BTC direction.
 * Used to determine the optimal confidence threshold for Polymarket auto-betting.
 */
import { loadConfig } from '../src/core/config.js'
import { fetchHistoricalSnapshots } from '../src/backtest/historical-fetcher.js'
import { generateAllSignals, signalSummary } from '../src/signal/index.js'

const DAYS = 30

async function main() {
  const cfg = loadConfig()

  console.log(`\n📊 PM Signal Accuracy Backtest (${DAYS} days)\n`)
  console.log('Fetching historical data...')

  const snapshots = await fetchHistoricalSnapshots(cfg, DAYS, (p) => {
    process.stdout.write(`  ${p.phase}: ${p.detail}\r`)
  })

  console.log(`\nGot ${snapshots.length} snapshots\n`)

  if (snapshots.length < 10) {
    console.log('Not enough data')
    return
  }

  // For each snapshot, generate signals and check against multiple horizons
  interface Result {
    ts: number
    direction: 'long' | 'short' | 'neutral'
    confidence: number
    bullish: number
    bearish: number
    neutral: number
    nextReturn1h: number
    nextReturn4h: number
    nextReturn12h: number
    correct1h: boolean
    correct4h: boolean
    correct12h: boolean
  }

  const results: Result[] = []

  for (let i = 0; i < snapshots.length - 12; i++) {
    const snap = snapshots[i]
    const signals = generateAllSignals(snap)
    const summary = signalSummary(signals)

    const price = snap.ticker.lastPrice
    if (price <= 0) continue

    const ret1h = (snapshots[i + 1].ticker.lastPrice - price) / price
    const ret4h = (snapshots[i + 4].ticker.lastPrice - price) / price
    const ret12h = (snapshots[i + 12].ticker.lastPrice - price) / price

    const dir1h = ret1h > 0.001 ? 'long' : ret1h < -0.001 ? 'short' : 'neutral'
    const dir4h = ret4h > 0.002 ? 'long' : ret4h < -0.002 ? 'short' : 'neutral'
    const dir12h = ret12h > 0.003 ? 'long' : ret12h < -0.003 ? 'short' : 'neutral'

    results.push({
      ts: snap.timestamp,
      direction: summary.direction,
      confidence: summary.confidence,
      bullish: summary.bullish,
      bearish: summary.bearish,
      neutral: summary.neutral,
      nextReturn1h: ret1h,
      nextReturn4h: ret4h,
      nextReturn12h: ret12h,
      correct1h: summary.direction === dir1h,
      correct4h: summary.direction === dir4h,
      correct12h: summary.direction === dir12h,
    })
  }

  // ── Multi-horizon threshold analysis ──
  for (const [label, horizon, getCorrect] of [
    ['1h', 1, (r: Result) => r.correct1h],
    ['4h', 4, (r: Result) => r.correct4h],
    ['12h', 12, (r: Result) => r.correct12h],
  ] as const) {
    console.log(`\n═══ ${label} Horizon ═══`)
    console.log('  Threshold | Signals | Accuracy | Avg Return | PM Expected')
    console.log('  ----------|---------|----------|------------|------------')

    for (const threshold of [0, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]) {
      const filtered = results.filter(r => r.confidence >= threshold && r.direction !== 'neutral')
      if (filtered.length === 0) continue

      const correct = filtered.filter(r => getCorrect(r)).length
      const accuracy = correct / filtered.length
      const retKey = `nextReturn${label}` as keyof Result
      const avgReturn = filtered.reduce((s, r) => {
        const ret = r[retKey] as number
        return s + (r.direction === 'long' ? ret : -ret)
      }, 0) / filtered.length

      const pmNet = accuracy * 1.0 - (1 - accuracy) * 1.0 - 0.02

      console.log(`  ${String(threshold).padStart(9)}% | ${String(filtered.length).padStart(7)} | ${(accuracy * 100).toFixed(1).padStart(7)}% | ${(avgReturn * 100).toFixed(3).padStart(9)}% | ${pmNet >= 0 ? '+' : ''}${(pmNet * 100).toFixed(1).padStart(5)}%`)
    }
  }

  // ── Confidence distribution ──
  console.log('\n═══ Confidence Distribution ═══')
  const confBuckets = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]
  for (const lo of confBuckets) {
    const hi = lo + 10
    const bucket = results.filter(r => r.confidence >= lo && r.confidence < hi)
    if (bucket.length === 0) continue
    const dirBucket = bucket.filter(r => r.direction !== 'neutral')
    const correct1h = dirBucket.filter(r => r.correct1h).length
    const correct4h = dirBucket.filter(r => r.correct4h).length
    const correct12h = dirBucket.filter(r => r.correct12h).length
    console.log(`  Conf ${lo}-${hi}%: ${bucket.length} total (${dirBucket.length} dir) | 1h: ${dirBucket.length > 0 ? (correct1h/dirBucket.length*100).toFixed(0) : '-'}% | 4h: ${dirBucket.length > 0 ? (correct4h/dirBucket.length*100).toFixed(0) : '-'}% | 12h: ${dirBucket.length > 0 ? (correct12h/dirBucket.length*100).toFixed(0) : '-'}%`)
  }

  // ── Sample signals ──
  console.log('\n═══ Sample Signals (first 10) ═══')
  const sampleSize = Math.min(10, results.length)
  for (let i = 0; i < sampleSize; i++) {
    const r = results[i]
    const snap = snapshots[i]
    const signals = generateAllSignals(snap)
    const modules = signals.map(s => `${s.module}:${s.direction}(${s.confidence.toFixed(0)})`).join(', ')
    const date = new Date(r.ts).toISOString().slice(0, 13)
    console.log(`  ${date} | conf=${r.confidence.toFixed(1)} dir=${r.direction} | 1h=${(r.nextReturn1h*100).toFixed(2)}%${r.correct1h?'✓':'✗'} 4h=${(r.nextReturn4h*100).toFixed(2)}%${r.correct4h?'✓':'✗'} 12h=${(r.nextReturn12h*100).toFixed(2)}%${r.correct12h?'✓':'✗'} | ${modules}`)
  }

  // ── Summary ──
  const directional = results.filter(r => r.direction !== 'neutral')
  const neutralCount = results.filter(r => r.direction === 'neutral').length
  console.log(`\n═══ Summary ═══`)
  console.log(`  Total snapshots: ${results.length}`)
  console.log(`  Directional: ${directional.length} (${(directional.length/results.length*100).toFixed(0)}%)`)
  console.log(`  Neutral: ${neutralCount} (${(neutralCount/results.length*100).toFixed(0)}%)`)
  console.log(`  Avg confidence (directional): ${(directional.reduce((s,r) => s+r.confidence, 0) / directional.length).toFixed(1)}%`)
  console.log(`  1h accuracy: ${(directional.filter(r=>r.correct1h).length/directional.length*100).toFixed(1)}%`)
  console.log(`  4h accuracy: ${(directional.filter(r=>r.correct4h).length/directional.length*100).toFixed(1)}%`)
  console.log(`  12h accuracy: ${(directional.filter(r=>r.correct12h).length/directional.length*100).toFixed(1)}%`)
}

main().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})

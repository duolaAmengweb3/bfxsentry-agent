import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ─── Types ─────────────────────────────────────────────────────
interface Snapshot {
  timestamp: number
  username: string
  rank: number
  value: number
}

interface PricePoint {
  timestamp: number
  open: number
  close: number
  high: number
  low: number
}

interface WhaleDirection {
  username: string
  currentPnl: number
  pnlChange3h: number
  correlation: number // -1 ~ +1, with BTC price
  direction: 'long' | 'short' | 'hedge'
  confidence: number // 0~1
  dataPoints: number
  pnlSeries: { ts: number; value: number }[]
}

interface SignalDimension {
  name: string
  score: number // 0~25
  detail: string
}

interface TimelineEvent {
  timestamp: number
  btcPrice: number
  signal: number // -100~+100
  direction: string
  trigger: string
}

type Locale = 'en' | 'zh' | 'vi'

function resolveLocale(request: Request): Locale {
  const locale = new URL(request.url).searchParams.get('locale')
  return locale === 'zh' || locale === 'vi' ? locale : 'en'
}

// ─── Pearson correlation ───────────────────────────────────────
function pearson(x: number[], y: number[]): number {
  const n = x.length
  if (n < 4) return 0

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0)
  const sumX2 = x.reduce((a, b) => a + b * b, 0)
  const sumY2 = y.reduce((a, b) => a + b * b, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  )

  if (denominator === 0) return 0
  return numerator / denominator
}

// ─── Fetch helpers ─────────────────────────────────────────────
async function fetchPluSnapshots(): Promise<Snapshot[]> {
  const now = Date.now()
  const start = now - 3 * 86400000 // 3 days
  const res = await fetch(
    `https://api-pub.bitfinex.com/v2/rankings/plu:3h:tGLOBAL:USD/hist?limit=5000&start=${start}&end=${now}`,
    { next: { revalidate: 0 } }
  )
  if (!res.ok) throw new Error(`plu API: ${res.status}`)
  const data: number[][] = await res.json()
  return data.map((item) => ({
    timestamp: item[0],
    username: String(item[2] || 'Anonymous'),
    rank: item[3],
    value: item[6],
  }))
}

async function fetchBtcCandles3h(): Promise<PricePoint[]> {
  const res = await fetch(
    'https://api-pub.bitfinex.com/v2/candles/trade:3h:tBTCUSD/hist?limit=30',
    { next: { revalidate: 0 } }
  )
  if (!res.ok) throw new Error(`candles API: ${res.status}`)
  const data: number[][] = await res.json()
  return data
    .map((item) => ({
      timestamp: item[0],
      open: item[1],
      close: item[2],
      high: item[3],
      low: item[4],
    }))
    .reverse()
}

async function fetchPositions() {
  const [longRes, shortRes] = await Promise.all([
    fetch(
      'https://api-pub.bitfinex.com/v2/stats1/pos.size:1h:tBTCUSD:long/hist?limit=25',
      { next: { revalidate: 0 } }
    ),
    fetch(
      'https://api-pub.bitfinex.com/v2/stats1/pos.size:1h:tBTCUSD:short/hist?limit=25',
      { next: { revalidate: 0 } }
    ),
  ])

  if (!longRes.ok || !shortRes.ok) throw new Error('positions API failed')

  const longData: number[][] = await longRes.json()
  const shortData: number[][] = await shortRes.json()

  return {
    longs: longData.map((d) => ({ timestamp: d[0], value: d[1] })).reverse(),
    shorts: shortData.map((d) => ({ timestamp: d[0], value: d[1] })).reverse(),
  }
}

async function fetchFundingRate() {
  const res = await fetch(
    'https://api-pub.bitfinex.com/v2/status/deriv?keys=tBTCF0:USTF0',
    { next: { revalidate: 0 } }
  )
  if (!res.ok) throw new Error('deriv API failed')
  const data = await res.json()
  const btc = data[0]
  return {
    currentRate: btc[9] as number,
    nextFundingTs: btc[8] as number,
  }
}

async function fetchPlrCurrent(): Promise<
  { username: string; profit: number }[]
> {
  const res = await fetch(
    'https://api-pub.bitfinex.com/v2/rankings/plr:1w:tGLOBAL:USD/hist?limit=25',
    { next: { revalidate: 0 } }
  )
  if (!res.ok) return []
  const data: number[][] = await res.json()
  return data.map((item) => ({
    username: String(item[2]),
    profit: item[6],
  }))
}

// ─── Signal computation ────────────────────────────────────────
function computeWhaleDirections(
  snapshots: Snapshot[],
  candles: PricePoint[]
): WhaleDirection[] {
  // Group snapshots by timestamp
  const byTimestamp = new Map<number, Snapshot[]>()
  for (const s of snapshots) {
    if (!byTimestamp.has(s.timestamp)) byTimestamp.set(s.timestamp, [])
    byTimestamp.get(s.timestamp)!.push(s)
  }

  const timestamps = Array.from(byTimestamp.keys()).sort()
  if (timestamps.length < 2) return []

  // Build BTC price change series aligned with snapshot timestamps
  const candleMap = new Map(candles.map((c) => [c.timestamp, c]))
  const btcChanges: { ts: number; change: number }[] = []
  for (let i = 1; i < timestamps.length; i++) {
    const ts = timestamps[i]
    // Find closest candle
    const candle = findClosestCandle(ts, candles)
    const prevCandle = findClosestCandle(timestamps[i - 1], candles)
    if (candle && prevCandle && prevCandle.close > 0) {
      btcChanges.push({
        ts,
        change: (candle.close - prevCandle.close) / prevCandle.close,
      })
    }
  }

  // For each user, build PnL change series and correlate
  const userSnapshots = new Map<string, { ts: number; value: number }[]>()
  for (const ts of timestamps) {
    const entries = byTimestamp.get(ts) || []
    for (const e of entries) {
      if (!userSnapshots.has(e.username)) userSnapshots.set(e.username, [])
      userSnapshots.get(e.username)!.push({ ts, value: e.value })
    }
  }

  const results: WhaleDirection[] = []

  for (const [username, series] of Array.from(userSnapshots.entries())) {
    series.sort((a, b) => a.ts - b.ts)
    if (series.length < 3) continue // Need enough data points

    // Build PnL change series
    const pnlChanges: { ts: number; change: number }[] = []
    for (let i = 1; i < series.length; i++) {
      if (series[i - 1].value !== 0) {
        pnlChanges.push({
          ts: series[i].ts,
          change: series[i].value - series[i - 1].value,
        })
      }
    }

    // Align with BTC changes
    const alignedPnl: number[] = []
    const alignedBtc: number[] = []
    for (const pc of pnlChanges) {
      const bc = btcChanges.find((b) => b.ts === pc.ts)
      if (bc) {
        alignedPnl.push(pc.change)
        alignedBtc.push(bc.change)
      }
    }

    if (alignedPnl.length < 3) continue

    const corr = pearson(alignedPnl, alignedBtc)
    const currentPnl = series[series.length - 1].value
    const prevPnl = series.length >= 2 ? series[series.length - 2].value : currentPnl
    const pnlChange3h = currentPnl - prevPnl

    let direction: 'long' | 'short' | 'hedge'
    let confidence: number

    if (corr > 0.4) {
      direction = 'long'
      confidence = Math.min(1, (corr - 0.4) / 0.5)
    } else if (corr < -0.4) {
      direction = 'short'
      confidence = Math.min(1, (-corr - 0.4) / 0.5)
    } else {
      direction = 'hedge'
      confidence = 0
    }

    results.push({
      username,
      currentPnl,
      pnlChange3h,
      correlation: corr,
      direction,
      confidence,
      dataPoints: alignedPnl.length,
      pnlSeries: series,
    })
  }

  // Sort by absolute PnL
  results.sort((a, b) => Math.abs(b.currentPnl) - Math.abs(a.currentPnl))

  return results
}

function findClosestCandle(ts: number, candles: PricePoint[]): PricePoint | undefined {
  let best: PricePoint | undefined
  let bestDiff = Infinity
  for (const c of candles) {
    const diff = Math.abs(c.timestamp - ts)
    if (diff < bestDiff) {
      bestDiff = diff
      best = c
    }
  }
  // Within 4 hours tolerance
  return bestDiff < 4 * 3600000 ? best : undefined
}

function computeSignal(
  whales: WhaleDirection[],
  positions: { longs: { timestamp: number; value: number }[]; shorts: { timestamp: number; value: number }[] },
  fundingRate: number,
  plrUsers: { username: string; profit: number }[],
  candles: PricePoint[],
  locale: Locale
): {
  score: number
  direction: string
  dimensions: SignalDimension[]
} {
  const dimensions: SignalDimension[] = []

  // 1. 浮盈方向分 (0-25) — weighted by PnL size
  const longWhales = whales.filter((w) => w.direction === 'long')
  const shortWhales = whales.filter((w) => w.direction === 'short')
  const totalLongPnl = longWhales.reduce((s, w) => s + Math.abs(w.currentPnl), 0)
  const totalShortPnl = shortWhales.reduce((s, w) => s + Math.abs(w.currentPnl), 0)
  const totalPnl = totalLongPnl + totalShortPnl

  let pnlScore = 12.5 // neutral
  if (totalPnl > 0) {
    const longRatio = totalLongPnl / totalPnl
    pnlScore = longRatio * 25
  }

  const longPct = totalPnl > 0 ? ((totalLongPnl / totalPnl) * 100).toFixed(0) : '50'
  const shortPct = totalPnl > 0 ? ((totalShortPnl / totalPnl) * 100).toFixed(0) : '50'

  dimensions.push({
    name: locale === 'zh' ? '浮盈方向' : 'PnL direction',
    score: Math.round(pnlScore),
    detail: locale === 'zh'
      ? `做多 ${longPct}% · 做空 ${shortPct}% (${longWhales.length}多/${shortWhales.length}空)`
      : `Long ${longPct}% · Short ${shortPct}% (${longWhales.length}/${shortWhales.length})`,
  })

  // 2. 持仓验证分 (0-25) — position changes
  let posScore = 12.5
  const longs = positions.longs
  const shorts = positions.shorts
  let posDetail = ''

  if (longs.length >= 2 && shorts.length >= 2) {
    const longLatest = longs[longs.length - 1].value
    const long4hAgo = longs.length >= 5 ? longs[longs.length - 5].value : longs[0].value
    const longChange = longLatest - long4hAgo

    const shortLatest = shorts[shorts.length - 1].value
    const short4hAgo = shorts.length >= 5 ? shorts[shorts.length - 5].value : shorts[0].value
    const shortChange = shortLatest - short4hAgo

    // If longs increasing → bullish, shorts increasing → bearish
    if (longChange > 0 && shortChange <= 0) {
      posScore = 20 + Math.min(5, (longChange / longLatest) * 500)
      posDetail = locale === 'zh' ? `多头增仓 ${longChange > 0 ? '+' : ''}${longChange.toFixed(1)} BTC` : `Longs building ${longChange > 0 ? '+' : ''}${longChange.toFixed(1)} BTC`
    } else if (shortChange > 0 && longChange <= 0) {
      posScore = 5 - Math.min(5, (shortChange / shortLatest) * 500)
      posDetail = locale === 'zh' ? `空头增仓 +${shortChange.toFixed(1)} BTC` : `Shorts building +${shortChange.toFixed(1)} BTC`
    } else if (longChange > 0 && shortChange > 0) {
      posScore = longChange > shortChange * 10 ? 18 : 12.5
      posDetail = locale === 'zh' ? `多空同增 (多 ${longChange > 0 ? '+' : ''}${longChange.toFixed(1)} / 空 +${shortChange.toFixed(1)})` : `Both sides up (long ${longChange > 0 ? '+' : ''}${longChange.toFixed(1)} / short +${shortChange.toFixed(1)})`
    } else {
      posScore = 12.5
      posDetail = locale === 'zh' ? `多空同减 (多 ${longChange.toFixed(1)} / 空 ${shortChange.toFixed(1)})` : `Both sides down (long ${longChange.toFixed(1)} / short ${shortChange.toFixed(1)})`
    }
  } else {
    posDetail = locale === 'zh' ? '持仓数据不足' : 'Insufficient position data'
  }

  dimensions.push({
    name: locale === 'zh' ? '持仓验证' : 'Position confirmation',
    score: Math.round(Math.max(0, Math.min(25, posScore))),
    detail: posDetail,
  })

  // 3. 资金费率分 (0-25)
  const annualized = fundingRate * 100 * 3 * 365
  let fundingScore = 12.5

  if (annualized > 100) {
    // Extremely high → overheated, contrarian signal
    fundingScore = 5
  } else if (annualized > 30) {
    // High, longs paying → bullish consensus
    fundingScore = 18
  } else if (annualized > 0) {
    fundingScore = 15
  } else if (annualized > -30) {
    fundingScore = 10
  } else {
    // Very negative → shorts paying → bearish consensus
    fundingScore = 7
  }

  const payerSide = locale === 'zh' ? (fundingRate >= 0 ? '多头付费' : '空头付费') : fundingRate >= 0 ? 'Longs pay' : 'Shorts pay'
  dimensions.push({
    name: locale === 'zh' ? '资金费率' : 'Funding rate',
    score: Math.round(fundingScore),
    detail: locale === 'zh' ? `${payerSide} · 年化 ${annualized.toFixed(1)}%` : `${payerSide} · annualized ${annualized.toFixed(1)}%`,
  })

  // 4. 平仓信号分 (0-25)
  // Check if any top plu users appeared in plr (meaning they cashed out)
  const pluUsernames = new Set(whales.slice(0, 15).map((w) => w.username))
  const plrUsernames = new Set(plrUsers.map((u) => u.username))
  const cashedOut = Array.from(pluUsernames).filter((u) => plrUsernames.has(u))

  let exitScore = 20 // Default: no abnormal exit = positive
  let exitDetail = locale === 'zh' ? '无异常平仓' : 'No abnormal exits'

  if (cashedOut.length >= 3) {
    exitScore = 5
    exitDetail = locale === 'zh' ? `${cashedOut.length} 位大户同时出现在利润榜 (疑似集体平仓)` : `${cashedOut.length} whales also appeared on the realized-profit board`
  } else if (cashedOut.length >= 1) {
    exitScore = 15
    exitDetail = locale === 'zh' ? `${cashedOut.join(', ')} 出现在利润榜` : `${cashedOut.join(', ')} appeared on the realized-profit board`
  }

  dimensions.push({
    name: locale === 'zh' ? '平仓信号' : 'Exit signal',
    score: Math.round(exitScore),
    detail: exitDetail,
  })

  // Composite score: 0-100, >50 = bullish, <50 = bearish
  const totalScore = dimensions.reduce((s, d) => s + d.score, 0)

  let direction: string
  if (locale === 'zh') {
    if (totalScore >= 70) direction = '强烈看多'
    else if (totalScore >= 60) direction = '偏多'
    else if (totalScore >= 40) direction = '中性'
    else if (totalScore >= 30) direction = '偏空'
    else direction = '强烈看空'
  } else {
    if (totalScore >= 70) direction = 'Strong long'
    else if (totalScore >= 60) direction = 'Bullish'
    else if (totalScore >= 40) direction = 'Neutral'
    else if (totalScore >= 30) direction = 'Bearish'
    else direction = 'Strong short'
  }

  return { score: totalScore, direction, dimensions }
}

// Build timeline from snapshot data
function buildTimeline(
  snapshots: Snapshot[],
  candles: PricePoint[],
  locale: Locale
): TimelineEvent[] {
  const byTimestamp = new Map<number, Snapshot[]>()
  for (const s of snapshots) {
    if (!byTimestamp.has(s.timestamp)) byTimestamp.set(s.timestamp, [])
    byTimestamp.get(s.timestamp)!.push(s)
  }

  const timestamps = Array.from(byTimestamp.keys()).sort()
  const events: TimelineEvent[] = []

  for (let i = 1; i < timestamps.length; i++) {
    const ts = timestamps[i]
    const prevTs = timestamps[i - 1]
    const current = byTimestamp.get(ts) || []
    const prev = byTimestamp.get(prevTs) || []

    const candle = findClosestCandle(ts, candles)
    const btcPrice = candle?.close || 0

    // Compute snapshot-level signal
    const prevMap = new Map(prev.map((p) => [p.username, p.value]))
    let bullishPnl = 0
    let bearishPnl = 0
    const btcChange = candle
      ? (() => {
          const prevCandle = findClosestCandle(prevTs, candles)
          return prevCandle ? (candle.close - prevCandle.close) / prevCandle.close : 0
        })()
      : 0

    for (const entry of current) {
      const prevVal = prevMap.get(entry.username)
      if (prevVal === undefined) continue
      const pnlChange = entry.value - prevVal
      // If BTC went up and PnL went up → long; same direction = bullish
      if ((pnlChange > 0 && btcChange > 0) || (pnlChange < 0 && btcChange < 0)) {
        bullishPnl += Math.abs(entry.value)
      } else if ((pnlChange > 0 && btcChange < 0) || (pnlChange < 0 && btcChange > 0)) {
        bearishPnl += Math.abs(entry.value)
      }
    }

    const total = bullishPnl + bearishPnl
    const signal = total > 0 ? ((bullishPnl / total) * 200 - 100) : 0 // -100 ~ +100

    let direction: string
    if (locale === 'zh') {
      if (signal > 30) direction = '偏多'
      else if (signal < -30) direction = '偏空'
      else direction = '中性'
    } else {
      if (signal > 30) direction = 'Bullish'
      else if (signal < -30) direction = 'Bearish'
      else direction = 'Neutral'
    }

    // Trigger description
    const triggers: string[] = []
    if (Math.abs(btcChange) > 0.01) {
      triggers.push(locale === 'zh' ? `BTC ${btcChange > 0 ? '上涨' : '下跌'} ${(Math.abs(btcChange) * 100).toFixed(1)}%` : `BTC ${btcChange > 0 ? 'up' : 'down'} ${(Math.abs(btcChange) * 100).toFixed(1)}%`)
    }

    // Find biggest mover
    let biggestMover = ''
    let biggestMove = 0
    for (const entry of current) {
      const prevVal = prevMap.get(entry.username)
      if (prevVal === undefined) continue
      const move = Math.abs(entry.value - prevVal)
      if (move > biggestMove) {
        biggestMove = move
        biggestMover = entry.username
      }
    }
    if (biggestMover && biggestMove > 10000) {
      const moveEntry = current.find((e) => e.username === biggestMover)!
      const moveDir = moveEntry.value - (prevMap.get(biggestMover) || 0) > 0 ? (locale === 'zh' ? '增长' : 'up') : locale === 'zh' ? '减少' : 'down'
      triggers.push(locale === 'zh' ? `${biggestMover} 浮盈${moveDir} $${formatNum(biggestMove)}` : `${biggestMover} PnL ${moveDir} $${formatNum(biggestMove)}`)
    }

    events.push({
      timestamp: ts,
      btcPrice,
      signal: Math.round(signal),
      direction,
      trigger: triggers.join(locale === 'zh' ? '，' : ', ') || (locale === 'zh' ? '无显著变动' : 'No major change'),
    })
  }

  return events.reverse() // newest first
}

function formatNum(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return n.toFixed(0)
}

// ─── Main handler ──────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const locale = resolveLocale(request)
    const [snapshots, candles, positions, funding, plrUsers] = await Promise.all([
      fetchPluSnapshots(),
      fetchBtcCandles3h(),
      fetchPositions(),
      fetchFundingRate(),
      fetchPlrCurrent(),
    ])

    const whales = computeWhaleDirections(snapshots, candles)

    const signal = computeSignal(
      whales,
      positions,
      funding.currentRate,
      plrUsers,
      candles,
      locale
    )

    const timeline = buildTimeline(snapshots, candles, locale)

    // Build trend data for chart
    const byTimestamp = new Map<number, Snapshot[]>()
    for (const s of snapshots) {
      if (!byTimestamp.has(s.timestamp)) byTimestamp.set(s.timestamp, [])
      byTimestamp.get(s.timestamp)!.push(s)
    }
    const snapshotTimestamps = Array.from(byTimestamp.keys()).sort()

    const trendData = snapshotTimestamps.map((ts) => {
      const entries = byTimestamp.get(ts)!
      const totalPnl = entries.reduce((s, e) => s + e.value, 0)
      const candle = findClosestCandle(ts, candles)
      const longPnl = entries
        .filter((e) => whales.find((w) => w.username === e.username && w.direction === 'long'))
        .reduce((s, e) => s + e.value, 0)
      const shortPnl = entries
        .filter((e) => whales.find((w) => w.username === e.username && w.direction === 'short'))
        .reduce((s, e) => s + e.value, 0)
      return {
        timestamp: ts,
        btcPrice: candle?.close || 0,
        totalPnl,
        longPnl,
        shortPnl,
        whaleCount: entries.length,
      }
    })

    // Position summary
    const longsArr = positions.longs
    const shortsArr = positions.shorts
    const positionSummary = {
      currentLongs: longsArr[longsArr.length - 1]?.value || 0,
      currentShorts: shortsArr[shortsArr.length - 1]?.value || 0,
      longs1hChange:
        longsArr.length >= 2
          ? longsArr[longsArr.length - 1].value - longsArr[longsArr.length - 2].value
          : 0,
      shorts1hChange:
        shortsArr.length >= 2
          ? shortsArr[shortsArr.length - 1].value - shortsArr[shortsArr.length - 2].value
          : 0,
      longs4hChange:
        longsArr.length >= 5
          ? longsArr[longsArr.length - 1].value - longsArr[longsArr.length - 5].value
          : 0,
      longs24hChange:
        longsArr.length >= 25
          ? longsArr[longsArr.length - 1].value - longsArr[0].value
          : 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        signal,
        whales: whales.slice(0, 20), // Top 20
        timeline: timeline.slice(0, 12), // Last 12 events
        trendData,
        positionSummary,
        fundingRate: {
          current: funding.currentRate,
          annualized: funding.currentRate * 3 * 365,
          nextFundingTs: funding.nextFundingTs,
        },
        btcPrice: candles[candles.length - 1]?.close || 0,
        meta: {
          snapshotCount: snapshotTimestamps.length,
          whaleCount: whales.length,
          dataRange: {
            from: snapshotTimestamps[0],
            to: snapshotTimestamps[snapshotTimestamps.length - 1],
          },
        },
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Smart Money API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      },
      { status: 500 }
    )
  }
}

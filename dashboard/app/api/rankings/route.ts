import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RankingKey = 'plr' | 'plu' | 'plu_diff' | 'vol'
type TimeFrame = '3h' | '1w' | '1M'

interface RankingEntry {
  timestamp: number
  username: string
  rank: number
  value: number
  flag: number
}

const VALID_KEYS: RankingKey[] = ['plr', 'plu', 'plu_diff', 'vol']
const VALID_TIMEFRAMES: Record<RankingKey, TimeFrame[]> = {
  plr: ['1w', '1M'],
  plu: ['3h', '1w'],
  plu_diff: ['3h', '1w'],
  vol: ['1w', '1M'],
}

async function fetchRankings(
  type: RankingKey,
  timeframe: TimeFrame,
  limit: number,
  start?: number,
  end?: number
): Promise<RankingEntry[]> {
  let url = `https://api-pub.bitfinex.com/v2/rankings/${type}:${timeframe}:tGLOBAL:USD/hist?limit=${limit}`
  if (start) url += `&start=${start}`
  if (end) url += `&end=${end}`

  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Bitfinex API error: ${res.status}`)

  const data: number[][] = await res.json()
  return data.map((item) => ({
    timestamp: item[0],
    username: String(item[2] || 'Anonymous'),
    rank: item[3],
    value: item[6],
    flag: item[8],
  }))
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') || 'plr') as RankingKey
    const timeframe = (searchParams.get('timeframe') || '1w') as TimeFrame
    const limit = Math.min(Number(searchParams.get('limit') || 25), 100)
    const withPrev = searchParams.get('withPrev') === '1'

    if (!VALID_KEYS.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Use: ${VALID_KEYS.join(', ')}` },
        { status: 400 }
      )
    }

    if (!VALID_TIMEFRAMES[type].includes(timeframe)) {
      return NextResponse.json(
        { success: false, error: `Invalid timeframe for ${type}. Use: ${VALID_TIMEFRAMES[type].join(', ')}` },
        { status: 400 }
      )
    }

    const rankings = await fetchRankings(type, timeframe, limit)

    const totalValue = rankings.reduce((sum, r) => sum + r.value, 0)
    const topValue = rankings[0]?.value || 0
    const count = rankings.length

    // 可选：拉上个周期的数据做对比
    let prevRankings: RankingEntry[] | undefined
    if (withPrev && timeframe === '1w') {
      const now = Date.now()
      const end = now - 7 * 86400000
      const start = end - 7 * 86400000
      try {
        prevRankings = await fetchRankings(type, timeframe, limit, start, end)
      } catch {
        // 上周数据获取失败不影响主流程
      }
    }

    let prevSummary: { totalValue: number; topValue: number; count: number } | undefined
    if (prevRankings?.length) {
      prevSummary = {
        totalValue: prevRankings.reduce((sum, r) => sum + r.value, 0),
        topValue: prevRankings[0]?.value || 0,
        count: prevRankings.length,
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        rankings,
        summary: { totalValue, topValue, count },
        prevSummary,
        prevRankings,
        meta: { type, timeframe },
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Rankings API Error:', error)
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

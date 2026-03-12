import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'analytics.json')

export async function GET(req: NextRequest) {
  // Simple auth: ?key=bfxsentry
  const key = req.nextUrl.searchParams.get('key')
  if (key !== 'bfxsentry') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json({
        totalPV: 0,
        totalUV: 0,
        today: { pv: 0, uv: 0 },
        last7d: { pv: 0, uv: 0 },
        last30d: { pv: 0, uv: 0 },
        daily: [],
        topPages: [],
      })
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    const today = new Date().toISOString().slice(0, 10)

    // Calculate date ranges
    const now = new Date()
    const d7 = new Date(now); d7.setDate(d7.getDate() - 7)
    const d30 = new Date(now); d30.setDate(d30.getDate() - 30)
    const d7Str = d7.toISOString().slice(0, 10)
    const d30Str = d30.toISOString().slice(0, 10)

    let pv7 = 0, pv30 = 0
    const uvSet7 = new Set<string>()
    const uvSet30 = new Set<string>()

    const dailyList: { date: string; pv: number; uv: number }[] = []

    for (const [day, stat] of Object.entries(data.daily || {})) {
      const s = stat as { pv: number; uv: string[] }
      dailyList.push({ date: day, pv: s.pv, uv: s.uv.length })

      if (day >= d7Str) {
        pv7 += s.pv
        s.uv.forEach(id => uvSet7.add(id))
      }
      if (day >= d30Str) {
        pv30 += s.pv
        s.uv.forEach(id => uvSet30.add(id))
      }
    }

    dailyList.sort((a, b) => b.date.localeCompare(a.date))

    // Top pages
    const topPages = Object.entries(data.pages || {})
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 20)

    const todayStat = data.daily?.[today]

    return NextResponse.json({
      totalPV: data.totalPV || 0,
      totalUV: (data.totalUV || []).length,
      today: {
        pv: todayStat?.pv || 0,
        uv: todayStat?.uv?.length || 0,
      },
      last7d: { pv: pv7, uv: uvSet7.size },
      last30d: { pv: pv30, uv: uvSet30.size },
      daily: dailyList.slice(0, 30),
      topPages,
    })
  } catch {
    return NextResponse.json({ error: 'read failed' }, { status: 500 })
  }
}

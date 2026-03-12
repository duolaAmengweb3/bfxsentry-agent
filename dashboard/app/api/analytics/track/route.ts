import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'analytics.json')

interface DayStat {
  pv: number
  uv: Set<string> | string[] // Set in memory, string[] in JSON
}

interface AnalyticsData {
  totalPV: number
  totalUV: string[]
  daily: Record<string, { pv: number; uv: string[] }>
  pages: Record<string, number>
}

function readData(): AnalyticsData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    }
  } catch {}
  return { totalPV: 0, totalUV: [], daily: {}, pages: {} }
}

function writeData(data: AnalyticsData) {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

function getVisitorId(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  const ua = req.headers.get('user-agent') || ''
  // Simple hash: IP + UA prefix for basic fingerprinting
  return Buffer.from(`${ip}|${ua.slice(0, 50)}`).toString('base64').slice(0, 24)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const page = (body.page as string) || '/'
    const visitorId = getVisitorId(req)
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    const data = readData()

    // Total PV
    data.totalPV += 1

    // Total UV
    if (!data.totalUV.includes(visitorId)) {
      data.totalUV.push(visitorId)
    }

    // Daily stats
    if (!data.daily[today]) {
      data.daily[today] = { pv: 0, uv: [] }
    }
    data.daily[today].pv += 1
    if (!data.daily[today].uv.includes(visitorId)) {
      data.daily[today].uv.push(visitorId)
    }

    // Page stats
    data.pages[page] = (data.pages[page] || 0) + 1

    // Keep only last 90 days
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    for (const day of Object.keys(data.daily)) {
      if (day < cutoffStr) delete data.daily[day]
    }

    writeData(data)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

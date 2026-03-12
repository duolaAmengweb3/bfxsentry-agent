import { NextResponse } from 'next/server'
import { fetchDashboardMetrics } from '@/lib/services/metrics'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const metrics = await fetchDashboardMetrics()

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('API v1 metrics error:', error)

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

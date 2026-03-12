import { NextResponse } from 'next/server'
import { fetchRealtimeData } from '@/lib/services/realtime'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const data = await fetchRealtimeData()

    return NextResponse.json({
      success: true,
      data,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('API v1 realtime error:', error)

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

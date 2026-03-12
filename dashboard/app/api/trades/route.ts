import { NextResponse } from 'next/server'
import { fetchRecentTrades } from '@/lib/services/trades'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const trades = await fetchRecentTrades(30)

    return NextResponse.json({
      success: true,
      data: trades,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Trades API Error:', error)
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

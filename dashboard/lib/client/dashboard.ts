import type { ApiResponse, DashboardMetrics } from '@/types'
import { fetchBackend } from './backend'
import type { RealtimeData } from '@/lib/services/realtime'
import type { Trade } from '@/lib/services/trades'

export async function fetchMetrics(): Promise<DashboardMetrics> {
  const data = await fetchBackend<ApiResponse<DashboardMetrics>>('/metrics')
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch metrics')
  return data.data
}

export async function fetchRealtime(): Promise<RealtimeData> {
  const data = await fetchBackend<ApiResponse<RealtimeData>>('/realtime')
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch realtime')
  return data.data
}

export async function fetchTrades(): Promise<Trade[]> {
  const data = await fetchBackend<ApiResponse<Trade[]>>('/trades')
  if (!data.success || !data.data) return []
  return data.data
}

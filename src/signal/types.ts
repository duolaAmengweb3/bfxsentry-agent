export interface Signal {
  id: string
  module: 'smart-money' | 'funding' | 'liquidation' | 'orderbook' | 'polymarket'
  direction: 'long' | 'short' | 'neutral'
  confidence: number        // 0-100
  level: 'green' | 'yellow' | 'red'
  title: string
  summary: string
  details: Record<string, unknown>
  ttlSec?: number
  timestamp: number
}

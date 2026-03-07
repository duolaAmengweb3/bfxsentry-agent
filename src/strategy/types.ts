export interface TradeIntent {
  id: string
  strategy: string
  direction: 'long' | 'short'
  instrument: string
  sizePct: number           // % of total capital
  leverage: number
  entryPrice: number
  stopLossPct: number
  takeProfitPct: number
  confidence: number        // 0-100
  reason: string
  signalIds: string[]       // which signals triggered this
  timestamp: number
  ttlSec?: number           // intent expires after this
  meta?: Record<string, unknown>
}

export interface Position {
  id: string
  strategy: string
  direction: 'long' | 'short'
  instrument: string
  entryPrice: number
  currentPrice: number
  size: number              // in base currency (BTC)
  sizeUsd: number
  leverage: number
  unrealizedPnl: number
  unrealizedPnlPct: number
  stopLoss: number
  takeProfit: number
  openedAt: number
  highWatermark: number     // for trailing stop
  trailingStopPct?: number
}

export interface ExecutionResult {
  success: boolean
  orderId?: string            // client order id (CID)
  exchangeOrderId?: string    // exchange-side order id
  fillPrice?: number
  fillSize?: number
  fee?: number
  error?: string
  timestamp: number
}

export interface DecisionRecord {
  timestamp: number
  strategy: string
  signalsSnapshot: Record<string, unknown>[]
  configSnapshot: Record<string, unknown>
  intent: TradeIntent | null
  riskFilterResult: { passed: boolean; reason?: string }
  executionResult: ExecutionResult | null
  pnlAtExit?: number
}

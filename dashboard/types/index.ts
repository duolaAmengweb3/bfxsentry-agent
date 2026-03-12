// Whale Regime 状态
export type WhaleRegime = 'accumulation' | 'mixed' | 'distribution'

// 价格数据
export interface PriceData {
  venue: 'bfx' | 'cb'
  symbol: string
  bid: number
  ask: number
  lastPrice: number
  volume24h: number
  dailyChange: number
  dailyChangePerc: number
  high24h: number
  low24h: number
  timestamp: number
}

// 仓位数据
export interface PositionData {
  symbol: string
  longs: number
  shorts: number
  longShortRatio: number
  timestamp: number
}

// Premium 数据
export interface PremiumData {
  bfxPrice: number
  cbPrice: number
  premium: number
  premiumPct: string
  status: 'NORMAL' | 'ALERT'
  duration?: number
  timestamp: number
}

// Funding Rate 数据
export interface FundingData {
  symbol: string
  fundingRate: number
  annualizedRate: number
  nextFundingTs: number
  derivPrice: number
  spotPrice: number
  timestamp: number
}

// 借贷数据
export interface LoanData {
  currency: string
  totalSize: number
  btcUsedSize: number
  concentration: number
  timestamp: number
}

// 清算数据
export interface LiquidationData {
  id: number
  symbol: string
  side: 'long' | 'short'
  amount: number
  price: number
  timestamp: number
}

// 事件类型
export type EventType =
  | 'PREMIUM_SPIKE'
  | 'LONGS_BUILD'
  | 'LONGS_UNWIND'
  | 'REGIME_FLIP'
  | 'FUNDING_EXTREME'
  | 'LIQUIDATION_SURGE'
  | 'CONCENTRATION_HIGH'

// 事件严重程度
export type EventSeverity = 'LOW' | 'MED' | 'HIGH'

// 事件数据
export interface WhaleEvent {
  id: string
  type: EventType
  severity: EventSeverity
  triggeredAt: number
  snapshot: {
    btcPrice: number
    premium: number
    longs: number
    fundingRate: number
    longShortRatio: number
  }
  explanation: string
  outcome1d?: {
    priceChange: number
    priceChangePerc: number
  }
  outcome7d?: {
    priceChange: number
    priceChangePerc: number
  }
}

// Dashboard 指标汇总
export interface DashboardMetrics {
  regime: WhaleRegime
  regimeExplanation: string

  btcPrice: number
  btcLongs: number
  btcShorts: number
  btcLongsChange7d: number
  btcLongsChange30d: number
  longShortRatio: number

  premium: PremiumData

  ethBtcLongs: number
  ethBtcPhase: 'BUILD' | 'UNWIND' | 'NEUTRAL'
  ethBtcPhaseDuration: number

  fundingBtc: FundingData
  fundingEth: FundingData

  loanConcentration: number
  totalUsdFunding: number
  btcUsdFunding: number

  recentLiquidations: LiquidationData[]
  liquidation24hTotal: number

  lastUpdate: number
}

// 时间序列数据点
export interface TimeSeriesPoint {
  timestamp: number
  value: number
}

// API 响应格式
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
}

export interface TickerData {
  bid: number
  bidSize: number
  ask: number
  askSize: number
  dailyChange: number
  dailyChangePct: number
  lastPrice: number
  volume: number
  high: number
  low: number
}

export interface OrderbookLevel {
  price: number
  count: number
  amount: number
}

export interface OrderbookData {
  bids: OrderbookLevel[]
  asks: OrderbookLevel[]
  bidDepth02: number
  bidDepth05: number
  bidDepth10: number
  askDepth02: number
  askDepth05: number
  askDepth10: number
  walls: WallInfo[]
}

export interface WallInfo {
  side: 'bid' | 'ask'
  price: number
  amount: number
  multiplier: number
}

export interface TradeEntry {
  id: number
  timestamp: number
  amount: number
  price: number
  side: 'buy' | 'sell'
}

export interface TradeFlow {
  buyVol30s: number
  sellVol30s: number
  buyVol60s: number
  sellVol60s: number
  buyVol5m: number
  sellVol5m: number
  buyCount60s: number
  sellCount60s: number
  netFlow60s: number
  buyRatio60s: number
}

export interface LiquidationEntry {
  id: number
  timestamp: number
  symbol: string
  amount: number
  price: number
  side: 'long' | 'short'
  usdValue: number
}

export interface LiquidationAgg {
  longUsd: number
  shortUsd: number
  total: number
  count: number
}

export interface FundingStatPoint {
  timestamp: number
  frr: number
  avgPeriod: number
  totalAmount: number
  usedAmount: number
  utilization: number
}

export interface DerivStatus {
  fundingRate: number
  nextFundingTs: number
  markPrice: number
  spotPrice: number
  openInterest: number
}

export interface WhaleEntry {
  username: string
  rank: number
  pnl: number
  direction: 'long' | 'short' | 'hedge'
  correlation: number
  confidence: number
}

export interface MarketSnapshot {
  timestamp: number
  ticker: TickerData
  orderbook: OrderbookData
  trades: TradeEntry[]
  tradeFlow: TradeFlow
  liquidations: LiquidationEntry[]
  liqAgg: {
    w1m: LiquidationAgg
    w5m: LiquidationAgg
    w15m: LiquidationAgg
    w1h: LiquidationAgg
    w24h: LiquidationAgg
  }
  liqIntensityPct: number
  funding: FundingStatPoint[]
  fundingCurrent: FundingStatPoint | null
  deriv: DerivStatus | null
  whales: WhaleEntry[]
  whaleScore: number
  whaleDirection: string
}

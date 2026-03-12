const BFX_BASE = 'https://api-pub.bitfinex.com/v2'

// Ticker 数据格式: [BID, BID_SIZE, ASK, ASK_SIZE, DAILY_CHANGE, DAILY_CHANGE_PERC, LAST_PRICE, VOLUME, HIGH, LOW]
export interface BfxTicker {
  bid: number
  bidSize: number
  ask: number
  askSize: number
  dailyChange: number
  dailyChangePerc: number
  lastPrice: number
  volume: number
  high: number
  low: number
}

// 获取单个 Ticker
export async function getTicker(symbol: string): Promise<BfxTicker> {
  const res = await fetch(`${BFX_BASE}/ticker/t${symbol}`, {
    next: { revalidate: 15 },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ticker: ${res.status}`)
  }

  const data = await res.json()

  return {
    bid: data[0],
    bidSize: data[1],
    ask: data[2],
    askSize: data[3],
    dailyChange: data[4],
    dailyChangePerc: data[5],
    lastPrice: data[6],
    volume: data[7],
    high: data[8],
    low: data[9],
  }
}

// 获取多个 Tickers
export async function getTickers(symbols: string[]): Promise<Map<string, BfxTicker>> {
  const symbolsParam = symbols.map((s) => `t${s}`).join(',')
  const res = await fetch(`${BFX_BASE}/tickers?symbols=${symbolsParam}`, {
    next: { revalidate: 15 },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch tickers: ${res.status}`)
  }

  const data = await res.json()
  const result = new Map<string, BfxTicker>()

  for (const item of data) {
    const symbol = item[0].substring(1) // 去掉 't' 前缀
    result.set(symbol, {
      bid: item[1],
      bidSize: item[2],
      ask: item[3],
      askSize: item[4],
      dailyChange: item[5],
      dailyChangePerc: item[6],
      lastPrice: item[7],
      volume: item[8],
      high: item[9],
      low: item[10],
    })
  }

  return result
}

// 仓位数据
export interface PositionStats {
  timestamp: number
  value: number
}

// 获取仓位数据 (最新)
export async function getPositionLast(
  symbol: string,
  side: 'long' | 'short'
): Promise<PositionStats> {
  const res = await fetch(
    `${BFX_BASE}/stats1/pos.size:1m:t${symbol}:${side}/last`,
    { next: { revalidate: 60 } }
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch position: ${res.status}`)
  }

  const data = await res.json()
  return {
    timestamp: data[0],
    value: data[1],
  }
}

// 获取仓位历史
export async function getPositionHistory(
  symbol: string,
  side: 'long' | 'short',
  timeframe: '1m' | '1h' = '1h',
  limit = 24
): Promise<PositionStats[]> {
  const res = await fetch(
    `${BFX_BASE}/stats1/pos.size:${timeframe}:t${symbol}:${side}/hist?limit=${limit}`,
    { next: { revalidate: 60 } }
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch position history: ${res.status}`)
  }

  const data = await res.json()
  return data.map((d: number[]) => ({
    timestamp: d[0],
    value: d[1],
  }))
}

// 借贷数据
export interface CreditStats {
  timestamp: number
  value: number
}

// 获取借贷规模 (总量)
export async function getCreditSize(currency: string): Promise<CreditStats> {
  const res = await fetch(
    `${BFX_BASE}/stats1/credits.size:1m:f${currency}/last`,
    { next: { revalidate: 300 } }
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch credit size: ${res.status}`)
  }

  const data = await res.json()
  return {
    timestamp: data[0],
    value: data[1],
  }
}

// 获取特定交易对使用的借贷规模
export async function getCreditSizeBySymbol(
  currency: string,
  symbol: string
): Promise<CreditStats> {
  const res = await fetch(
    `${BFX_BASE}/stats1/credits.size.sym:1m:f${currency}:t${symbol}/last`,
    { next: { revalidate: 300 } }
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch credit size by symbol: ${res.status}`)
  }

  const data = await res.json()
  return {
    timestamp: data[0],
    value: data[1],
  }
}

// 永续合约状态
export interface DerivStatus {
  symbol: string
  timestamp: number
  derivPrice: number
  spotPrice: number
  fundingRate: number
  nextFundingTs: number
  insuranceFund: number
}

// 获取永续合约状态
export async function getDerivStatus(symbols: string[]): Promise<DerivStatus[]> {
  const keys = symbols.join(',')
  const res = await fetch(`${BFX_BASE}/status/deriv?keys=${keys}`, {
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch deriv status: ${res.status}`)
  }

  const data = await res.json()
  return data.map((d: any[]) => ({
    symbol: d[0],
    timestamp: d[1],
    derivPrice: d[3],
    spotPrice: d[4],
    fundingRate: d[9],
    nextFundingTs: d[8],
    insuranceFund: d[6],
  }))
}

// 清算数据
export interface Liquidation {
  posId: number
  timestamp: number
  symbol: string
  amount: number
  basePrice: number
  actualPrice: number
}

// 获取清算历史
export async function getLiquidations(limit = 10): Promise<Liquidation[]> {
  const res = await fetch(`${BFX_BASE}/liquidations/hist?limit=${limit}`, {
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch liquidations: ${res.status}`)
  }

  const data = await res.json()
  return data.map((item: any[][]) => {
    const d = item[0]
    return {
      posId: d[1],
      timestamp: d[2],
      symbol: d[4],
      amount: Math.abs(d[5]),
      basePrice: d[6],
      actualPrice: d[11],
    }
  })
}

// 平台状态
export async function getPlatformStatus(): Promise<boolean> {
  const res = await fetch(`${BFX_BASE}/platform/status`, {
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    return false
  }

  const data = await res.json()
  return data[0] === 1
}

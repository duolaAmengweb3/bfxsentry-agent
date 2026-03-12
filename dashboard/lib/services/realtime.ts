export interface TickerData {
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

export interface OrderBookDepth {
  bids: Array<{ price: number; count: number; amount: number }>
  asks: Array<{ price: number; count: number; amount: number }>
  bidTotal: number
  askTotal: number
  bidAskRatio: number
  spread: number
  spreadPerc: number
}

export interface PositionHistory {
  timestamp: number
  value: number
}

export interface CandleData {
  timestamp: number
  open: number
  close: number
  high: number
  low: number
  volume: number
}

export interface RealtimeData {
  ticker: TickerData
  orderBook: OrderBookDepth
  longHistory24h: PositionHistory[]
  shortHistory24h: PositionHistory[]
  candles1h: CandleData[]
  fundingCountdown: {
    nextFundingTs: number
    secondsUntil: number
    currentRate: number
    predictedRate: number
  }
  positionVelocity: {
    change1h: number
    change4h: number
    change24h: number
  }
}

async function fetchTicker(): Promise<TickerData> {
  const res = await fetch('https://api-pub.bitfinex.com/v2/ticker/tBTCUSD', {
    next: { revalidate: 0 },
  })
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

async function fetchOrderBook(): Promise<OrderBookDepth> {
  const res = await fetch('https://api-pub.bitfinex.com/v2/book/tBTCUSD/P0?len=100', {
    next: { revalidate: 0 },
  })
  const data: number[][] = await res.json()

  const bids = data.filter((x) => x[2] > 0).map((x) => ({ price: x[0], count: x[1], amount: x[2] }))
  const asks = data
    .filter((x) => x[2] < 0)
    .map((x) => ({ price: x[0], count: x[1], amount: Math.abs(x[2]) }))

  const bidTotal = bids.reduce((sum, b) => sum + b.amount, 0)
  const askTotal = asks.reduce((sum, a) => sum + a.amount, 0)

  const bestBid = bids.length ? Math.max(...bids.map((b) => b.price)) : 0
  const bestAsk = asks.length ? Math.min(...asks.map((a) => a.price)) : 0
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0
  const spreadPerc = bestBid > 0 ? (spread / bestBid) * 100 : 0

  return {
    bids: bids.slice(0, 20),
    asks: asks.slice(0, 20),
    bidTotal,
    askTotal,
    bidAskRatio: askTotal > 0 ? bidTotal / askTotal : 1,
    spread,
    spreadPerc,
  }
}

async function fetchPositionHistory(side: 'long' | 'short'): Promise<PositionHistory[]> {
  const res = await fetch(
    `https://api-pub.bitfinex.com/v2/stats1/pos.size:1h:tBTCUSD:${side}/hist?limit=24`,
    { next: { revalidate: 0 } }
  )
  const data: number[][] = await res.json()
  return data
    .map((item) => ({
      timestamp: item[0],
      value: item[1],
    }))
    .reverse()
}

async function fetchCandles(): Promise<CandleData[]> {
  const res = await fetch(
    'https://api-pub.bitfinex.com/v2/candles/trade:1h:tBTCUSD/hist?limit=24',
    { next: { revalidate: 0 } }
  )
  const data: number[][] = await res.json()
  return data
    .map((item) => ({
      timestamp: item[0],
      open: item[1],
      close: item[2],
      high: item[3],
      low: item[4],
      volume: item[5],
    }))
    .reverse()
}

async function fetchDerivStatus() {
  const res = await fetch('https://api-pub.bitfinex.com/v2/status/deriv?keys=tBTCF0:USTF0', {
    next: { revalidate: 0 },
  })
  const data = await res.json()
  const btc = data[0]
  return {
    nextFundingTs: btc[8],
    currentRate: btc[9],
    predictedRate: btc[9],
  }
}

export async function fetchRealtimeData(): Promise<RealtimeData> {
  const [ticker, orderBook, longHistory, shortHistory, candles, derivStatus] = await Promise.all([
    fetchTicker(),
    fetchOrderBook(),
    fetchPositionHistory('long'),
    fetchPositionHistory('short'),
    fetchCandles(),
    fetchDerivStatus(),
  ])

  const latestLong = longHistory[longHistory.length - 1]?.value || 0
  const long1hAgo = longHistory[longHistory.length - 2]?.value || latestLong
  const long4hAgo = longHistory[longHistory.length - 5]?.value || latestLong
  const long24hAgo = longHistory[0]?.value || latestLong

  const safeChange = (now: number, before: number) => {
    if (!before) return 0
    return ((now - before) / before) * 100
  }

  const positionVelocity = {
    change1h: safeChange(latestLong, long1hAgo),
    change4h: safeChange(latestLong, long4hAgo),
    change24h: safeChange(latestLong, long24hAgo),
  }

  const now = Date.now()

  return {
    ticker,
    orderBook,
    longHistory24h: longHistory,
    shortHistory24h: shortHistory,
    candles1h: candles,
    fundingCountdown: {
      nextFundingTs: derivStatus.nextFundingTs,
      secondsUntil: Math.max(0, Math.floor((derivStatus.nextFundingTs - now) / 1000)),
      currentRate: derivStatus.currentRate,
      predictedRate: derivStatus.predictedRate,
    },
    positionVelocity,
  }
}

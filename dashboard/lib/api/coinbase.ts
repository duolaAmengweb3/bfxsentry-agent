const CB_BASE = 'https://api.coinbase.com/v2'
const CB_EXCHANGE = 'https://api.exchange.coinbase.com'

// Spot Price 响应
export interface CbSpotPrice {
  amount: number
  base: string
  currency: string
}

// 获取现货价格 (简单 API)
export async function getSpotPrice(pair: string): Promise<CbSpotPrice> {
  const res = await fetch(`${CB_BASE}/prices/${pair}/spot`, {
    next: { revalidate: 15 },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch Coinbase spot price: ${res.status}`)
  }

  const data = await res.json()
  return {
    amount: parseFloat(data.data.amount),
    base: data.data.base,
    currency: data.data.currency,
  }
}

// Exchange Ticker 响应
export interface CbTicker {
  bid: number
  ask: number
  price: number
  volume: number
  time: Date
  tradeId: number
}

// 获取 Exchange Ticker (更详细)
export async function getExchangeTicker(product: string): Promise<CbTicker> {
  const res = await fetch(`${CB_EXCHANGE}/products/${product}/ticker`, {
    next: { revalidate: 15 },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch Coinbase ticker: ${res.status}`)
  }

  const data = await res.json()
  return {
    bid: parseFloat(data.bid),
    ask: parseFloat(data.ask),
    price: parseFloat(data.price),
    volume: parseFloat(data.volume),
    time: new Date(data.time),
    tradeId: data.trade_id,
  }
}

// 获取多个价格
export async function getMultipleSpotPrices(
  pairs: string[]
): Promise<Map<string, number>> {
  const results = await Promise.all(
    pairs.map(async (pair) => {
      try {
        const price = await getSpotPrice(pair)
        return [pair, price.amount] as [string, number]
      } catch {
        return [pair, 0] as [string, number]
      }
    })
  )

  return new Map(results)
}

export interface Trade {
  id: number
  price: number
  amount: number
  side: 'buy' | 'sell'
  timestamp: number
}

export async function fetchRecentTrades(limit = 30): Promise<Trade[]> {
  const res = await fetch(`https://api-pub.bitfinex.com/v2/trades/tBTCUSD/hist?limit=${limit}`, {
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`Bitfinex API error: ${res.status}`)
  }

  const data = await res.json()

  return data.map((item: number[]) => ({
    id: item[0],
    timestamp: item[1],
    amount: Math.abs(item[2]),
    price: item[3],
    side: item[2] > 0 ? 'buy' : 'sell',
  }))
}

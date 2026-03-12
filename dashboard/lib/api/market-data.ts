// ─── Shared data layer with in-memory cache ─────────────────────
// Prevents 429 rate-limit errors from Bitfinex public API (~30-60 req/min)

const cache = new Map<string, { data: unknown; ts: number }>()

async function cachedFetch<T>(url: string, ttlMs: number, parse: (res: Response) => Promise<T>): Promise<T> {
  const now = Date.now()
  const entry = cache.get(url)
  if (entry && now - entry.ts < ttlMs) return entry.data as T

  const res = await fetch(url, { cache: 'no-store' })
  if (res.status === 429) {
    // Rate limited — return stale cache if available, otherwise throw
    if (entry) return entry.data as T
    throw new Error(`Rate limited (429) and no cache for: ${url}`)
  }
  if (!res.ok) throw new Error(`${url}: ${res.status}`)

  const data = await parse(res)
  cache.set(url, { data, ts: now })
  return data
}

export interface FundingStatPoint {
  timestamp: number
  frr: number
  avgPeriod: number
  totalAmount: number
  usedAmount: number
  utilization: number
}

export interface LiquidationEntry {
  timestamp: number
  symbol: string
  amount: number
  price: number
  side: 'long' | 'short'
  usdValue: number
}

export interface OrderbookLevel {
  price: number
  count: number
  amount: number // positive=bid, raw from API
}

export interface TradeEntry {
  id: number
  timestamp: number
  amount: number // positive=buyer is taker
  price: number
  side: 'buy' | 'sell'
}

export interface TickerData {
  bid: number
  ask: number
  lastPrice: number
  volume: number
  high: number
  low: number
  dailyChange: number
  dailyChangePerc: number
}

// ─── Fetch functions ───────────────────────────────────────────

export async function fetchFundingStats(
  symbol = 'fUSD',
  limit = 168
): Promise<FundingStatPoint[]> {
  const url = `https://api-pub.bitfinex.com/v2/funding/stats/${symbol}/hist?limit=${limit}`
  return cachedFetch(url, 30_000, async (res) => {
    const data: number[][] = await res.json()
    return data.map((item) => {
      const total = item[7] || 0
      const used = item[8] || 0
      return {
        timestamp: item[0],
        frr: item[3] || 0,
        avgPeriod: item[4] || 0,
        totalAmount: total,
        usedAmount: used,
        utilization: total > 0 ? used / total : 0,
      }
    })
  })
}

export async function fetchDerivStatus(): Promise<{
  fundingRate: number
  nextFundingTs: number
  markPrice: number
}> {
  const url = 'https://api-pub.bitfinex.com/v2/status/deriv?keys=tBTCF0:USTF0'
  return cachedFetch(url, 15_000, async (res) => {
    const data = await res.json()
    const btc = data[0]
    return {
      fundingRate: btc[9],
      nextFundingTs: btc[8],
      markPrice: btc[15] || btc[3] || 0,
    }
  })
}

export async function fetchLiquidations(limit = 500): Promise<LiquidationEntry[]> {
  // Use a stable URL key (round start/end to 10s) so cache hits properly
  const now = Date.now()
  const roundedNow = Math.floor(now / 10000) * 10000
  const start = roundedNow - 24 * 3600000
  const url = `https://api-pub.bitfinex.com/v2/liquidations/hist?limit=${limit}&start=${start}&end=${roundedNow}`
  return cachedFetch(url, 10_000, async (res) => {
    const data = await res.json()
    return data
      .map((item: unknown[]) => {
        const inner = Array.isArray(item[0]) ? (item[0] as number[]) : (item as number[])
        if (inner.length < 7) return null
        const amount = inner[5] as number
        const price = inner[6] as number
        return {
          timestamp: inner[2] as number,
          symbol: String(inner[4]),
          amount: Math.abs(amount),
          price,
          side: (amount < 0 ? 'long' : 'short') as 'long' | 'short',
          usdValue: Math.abs(amount) * price,
        }
      })
      .filter(Boolean) as LiquidationEntry[]
  })
}

export async function fetchOrderbook(
  symbol = 'tBTCUSD',
  len = 100
): Promise<{ bids: OrderbookLevel[]; asks: OrderbookLevel[] }> {
  const url = `https://api-pub.bitfinex.com/v2/book/${symbol}/P0?len=${len}`
  return cachedFetch(url, 5_000, async (res) => {
    const data: number[][] = await res.json()
    const bids = data
      .filter((x) => x[2] > 0)
      .map((x) => ({ price: x[0], count: x[1], amount: x[2] }))
      .sort((a, b) => b.price - a.price)
    const asks = data
      .filter((x) => x[2] < 0)
      .map((x) => ({ price: x[0], count: x[1], amount: Math.abs(x[2]) }))
      .sort((a, b) => a.price - b.price)
    return { bids, asks }
  })
}

export async function fetchTrades(
  symbol = 'tBTCUSD',
  limit = 200
): Promise<TradeEntry[]> {
  const url = `https://api-pub.bitfinex.com/v2/trades/${symbol}/hist?limit=${limit}`
  return cachedFetch(url, 5_000, async (res) => {
    const data: number[][] = await res.json()
    return data.map((item) => ({
      id: item[0],
      timestamp: item[1],
      amount: Math.abs(item[2]),
      price: item[3],
      side: (item[2] > 0 ? 'buy' : 'sell') as 'buy' | 'sell',
    }))
  })
}

export async function fetchTicker(symbol = 'tBTCUSD'): Promise<TickerData> {
  const url = `https://api-pub.bitfinex.com/v2/ticker/${symbol}`
  return cachedFetch(url, 5_000, async (res) => {
    const d: number[] = await res.json()
    return {
      bid: d[0],
      ask: d[2],
      lastPrice: d[6],
      volume: d[7],
      high: d[8],
      low: d[9],
      dailyChange: d[4],
      dailyChangePerc: d[5],
    }
  })
}

// ─── Shared utilities ──────────────────────────────────────────

/** Calculate percentile of `value` within sorted array */
export function percentile(value: number, sorted: number[]): number {
  if (sorted.length === 0) return 0
  const below = sorted.filter((v) => v <= value).length
  return below / sorted.length
}

/** Format number for API responses */
export function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(2)
}

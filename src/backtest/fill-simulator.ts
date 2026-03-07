import type { TradeIntent, ExecutionResult } from '../strategy/types.js'
import type { MarketSnapshot } from '../collector/types.js'

// Simulates order fills conservatively using recorded snapshot data
export function simulateFill(intent: TradeIntent, snapshot: MarketSnapshot): ExecutionResult {
  const { ticker, orderbook } = snapshot

  // Market order: fill at best bid/ask with slippage
  const bestBid = orderbook.bids[0]?.price || ticker.lastPrice
  const bestAsk = orderbook.asks[0]?.price || ticker.lastPrice

  let fillPrice: number
  if (intent.direction === 'long') {
    // Buying: fill at ask + estimated slippage from depth
    const depth = orderbook.askDepth02
    const slippage = depth > 0 ? Math.min(0.001, 0.01 / depth) : 0.001
    fillPrice = bestAsk * (1 + slippage)
  } else {
    // Selling: fill at bid - estimated slippage
    const depth = orderbook.bidDepth02
    const slippage = depth > 0 ? Math.min(0.001, 0.01 / depth) : 0.001
    fillPrice = bestBid * (1 - slippage)
  }

  const capitalUsd = 5000
  const sizeUsd = capitalUsd * (intent.sizePct / 100)
  const fillSize = sizeUsd / fillPrice

  return {
    success: true,
    orderId: `bt-${intent.id}`,
    fillPrice,
    fillSize,
    fee: sizeUsd * 0.001,
    timestamp: snapshot.timestamp,
  }
}

// Check if a limit order would have been filled
export function wouldFillLimit(
  price: number,
  direction: 'long' | 'short',
  nextSnapshot: MarketSnapshot,
): boolean {
  if (direction === 'long') {
    // Buy limit fills when ask drops to or below price
    return nextSnapshot.ticker.low <= price
  } else {
    // Sell limit fills when bid rises to or above price
    return nextSnapshot.ticker.high >= price
  }
}

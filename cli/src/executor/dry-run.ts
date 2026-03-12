import type { TradeIntent, ExecutionResult } from '../strategy/types.js'
import type { MarketSnapshot } from '../collector/types.js'
import { getLogger } from '../core/logger.js'
import { generateCid } from './order-id.js'

const log = () => getLogger()

export function dryRunExecute(intent: TradeIntent, snapshot: MarketSnapshot): ExecutionResult {
  const price = snapshot.ticker.lastPrice
  // Simulate slippage: 0.01-0.05%
  const slippage = (Math.random() * 0.04 + 0.01) / 100
  const fillPrice = intent.direction === 'long'
    ? price * (1 + slippage)
    : price * (1 - slippage)

  // Calculate size from sizePct or from meta (PM hedge uses fixed stake)
  const capitalUsd = 5000 // simulated capital
  let sizeUsd = capitalUsd * (intent.sizePct / 100)
  if (sizeUsd === 0 && intent.meta?.stakeUsdc) {
    sizeUsd = intent.meta.stakeUsdc as number
  }
  if (sizeUsd === 0) sizeUsd = 100 // minimum fallback
  const fillSize = sizeUsd / fillPrice

  const cid = generateCid(intent.strategy)

  log().info({
    strategy: intent.strategy,
    direction: intent.direction,
    price: fillPrice.toFixed(2),
    size: fillSize.toFixed(6),
    sizeUsd: sizeUsd.toFixed(2),
    cid,
    mode: 'DRY-RUN',
  }, `[DRY-RUN] ${intent.direction.toUpperCase()} ${intent.instrument}`)

  return {
    success: true,
    orderId: cid,
    fillPrice,
    fillSize,
    fee: sizeUsd * 0.001, // simulated 0.1% fee
    timestamp: Date.now(),
  }
}

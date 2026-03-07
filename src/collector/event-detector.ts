import { eventBus } from '../core/event-bus.js'
import { getLogger } from '../core/logger.js'
import type { MarketSnapshot } from './types.js'

const log = () => getLogger()

let prevSnapshot: MarketSnapshot | null = null

export function detectEvents(snapshot: MarketSnapshot) {
  // 1. Liquidation cascade: 1-min liq USD > P95 equivalent
  if (snapshot.liqIntensityPct >= 0.95) {
    log().warn({ pct: snapshot.liqIntensityPct }, 'Liquidation cascade detected')
    eventBus.emit('event:liq_cascade', snapshot)
  }

  // 2. Wall break detection
  if (prevSnapshot) {
    const prevWalls = prevSnapshot.orderbook.walls
    const curWalls = snapshot.orderbook.walls
    for (const pw of prevWalls) {
      const stillExists = curWalls.some(
        cw => cw.side === pw.side && Math.abs(cw.price - pw.price) / pw.price < 0.001
      )
      if (!stillExists) {
        const price = snapshot.ticker.lastPrice
        const broke = pw.side === 'ask'
          ? price >= pw.price * 0.999
          : price <= pw.price * 1.001
        if (broke) {
          log().info({ side: pw.side, wallPrice: pw.price, price }, 'Wall break detected')
          eventBus.emit('event:wall_break', { wall: pw, snapshot })
        }
      }
    }
  }

  // 3. Spread extreme
  const spread = snapshot.orderbook.asks[0] && snapshot.orderbook.bids[0]
    ? snapshot.orderbook.asks[0].price - snapshot.orderbook.bids[0].price
    : 0
  const mid = snapshot.ticker.lastPrice
  const spreadPct = mid > 0 ? (spread / mid) * 100 : 0
  if (spreadPct > 0.1) { // > 0.1% spread is extreme for BTC
    log().warn({ spreadPct: spreadPct.toFixed(4) }, 'Extreme spread detected')
    eventBus.emit('event:spread_extreme', { spreadPct, snapshot })
  }

  prevSnapshot = snapshot
}

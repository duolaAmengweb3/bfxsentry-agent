import type { MarketSnapshot } from '../collector/types.js'
import type { Signal } from './types.js'

export function generateOrderbookSignals(snapshot: MarketSnapshot): Signal[] {
  const { orderbook, tradeFlow, ticker } = snapshot
  const now = snapshot.timestamp
  const signals: Signal[] = []

  const { bidDepth05, askDepth05, walls } = orderbook
  const imbalance05 = askDepth05 > 0 ? bidDepth05 / askDepth05 : 1

  // O1: 买盘失衡
  if (imbalance05 >= 1.5 && tradeFlow.netFlow60s > 0) {
    signals.push({
      id: 'OB-1',
      module: 'orderbook',
      direction: 'long',
      confidence: Math.min(80, 50 + (imbalance05 - 1.5) * 30),
      level: 'yellow',
      title: '买盘失衡',
      summary: `Bid/Ask ${imbalance05.toFixed(2)}x (0.5%), 60s 净买入 ${tradeFlow.netFlow60s.toFixed(3)} BTC`,
      details: {
        imbalance: imbalance05,
        bidDepth: bidDepth05,
        askDepth: askDepth05,
        netFlow: tradeFlow.netFlow60s,
        buyRatio: tradeFlow.buyRatio60s,
      },
      ttlSec: 120,
      timestamp: now,
    })
  }

  // O2: 卖盘失衡
  if (imbalance05 <= 0.67 && tradeFlow.netFlow60s < 0) {
    signals.push({
      id: 'OB-2',
      module: 'orderbook',
      direction: 'short',
      confidence: Math.min(80, 50 + (1 / imbalance05 - 1.5) * 30),
      level: 'yellow',
      title: '卖盘失衡',
      summary: `Bid/Ask ${imbalance05.toFixed(2)}x (0.5%), 60s 净卖出 ${Math.abs(tradeFlow.netFlow60s).toFixed(3)} BTC`,
      details: {
        imbalance: imbalance05,
        bidDepth: bidDepth05,
        askDepth: askDepth05,
        netFlow: tradeFlow.netFlow60s,
        buyRatio: tradeFlow.buyRatio60s,
      },
      ttlSec: 120,
      timestamp: now,
    })
  }

  // O3: Wall breaks (detected via event-detector, but also check current state)
  const askWalls = walls.filter(w => w.side === 'ask')
  const bidWalls = walls.filter(w => w.side === 'bid')

  for (const w of askWalls) {
    if (ticker.lastPrice >= w.price * 0.999) {
      signals.push({
        id: `OB-3a-${w.price.toFixed(0)}`,
        module: 'orderbook',
        direction: 'long',
        confidence: 60,
        level: 'yellow',
        title: '上方墙突破',
        summary: `价格逼近卖墙 $${w.price.toFixed(0)} (${w.multiplier.toFixed(1)}x 均量)`,
        details: { wall: w, price: ticker.lastPrice },
        ttlSec: 60,
        timestamp: now,
      })
    }
  }

  for (const w of bidWalls) {
    if (ticker.lastPrice <= w.price * 1.001) {
      signals.push({
        id: `OB-3b-${w.price.toFixed(0)}`,
        module: 'orderbook',
        direction: 'short',
        confidence: 60,
        level: 'yellow',
        title: '下方墙击穿',
        summary: `价格逼近买墙 $${w.price.toFixed(0)} (${w.multiplier.toFixed(1)}x 均量)`,
        details: { wall: w, price: ticker.lastPrice },
        ttlSec: 60,
        timestamp: now,
      })
    }
  }

  // No signals = green
  if (signals.length === 0) {
    signals.push({
      id: 'OB-0',
      module: 'orderbook',
      direction: 'neutral',
      confidence: 20,
      level: 'green',
      title: '盘口正常',
      summary: `Bid/Ask ${imbalance05.toFixed(2)}x, 墙 ${walls.length} 个`,
      details: { imbalance: imbalance05, wallCount: walls.length },
      timestamp: now,
    })
  }

  return signals
}

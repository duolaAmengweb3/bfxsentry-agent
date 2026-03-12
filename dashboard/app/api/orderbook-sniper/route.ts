import { NextResponse } from 'next/server'
import {
  fetchOrderbook,
  fetchTrades,
  fetchTicker,
  type OrderbookLevel,
} from '@/lib/api/market-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ObSignal {
  id: string
  name: string
  level: 'green' | 'yellow' | 'red'
  evidence: string[]
  action: string
  ttlSeconds: number
}

interface Wall {
  price: number
  amount: number
  usdValue: number
  side: 'bid' | 'ask'
  distFromMid: number // percentage
}

// ─── Module-level cache for wall tracking ─────────────────────
let prevWalls: Wall[] = []
let prevWallsTs = 0

export async function GET() {
  try {
    const [{ bids, asks }, trades, ticker] = await Promise.all([
      fetchOrderbook('tBTCUSD', 100),
      fetchTrades('tBTCUSD', 200),
      fetchTicker('tBTCUSD'),
    ])

    const now = Date.now()
    const mid = (bids[0]?.price + asks[0]?.price) / 2 || ticker.lastPrice

    // ── 1. Depth Imbalance ────────────────────────────────
    const depthInRange = (rangePct: number) => {
      const lo = mid * (1 - rangePct)
      const hi = mid * (1 + rangePct)
      const bidDepth = bids.filter((b) => b.price >= lo).reduce((s, b) => s + b.amount, 0)
      const askDepth = asks.filter((a) => a.price <= hi).reduce((s, a) => s + a.amount, 0)
      const imbalance = askDepth > 0 ? bidDepth / askDepth : bidDepth > 0 ? 999 : 1
      return { bidDepth, askDepth, imbalance }
    }

    const depth02 = depthInRange(0.002) // 0.2%
    const depth05 = depthInRange(0.005) // 0.5%
    const depth10 = depthInRange(0.01) // 1%

    // ── 2. Aggressive Flow ────────────────────────────────
    const flowInWindow = (windowMs: number) => {
      const cutoff = now - windowMs
      const windowTrades = trades.filter((t) => t.timestamp >= cutoff)
      const buyVol = windowTrades.filter((t) => t.side === 'buy').reduce((s, t) => s + t.amount, 0)
      const sellVol = windowTrades.filter((t) => t.side === 'sell').reduce((s, t) => s + t.amount, 0)
      const buyCount = windowTrades.filter((t) => t.side === 'buy').length
      const sellCount = windowTrades.filter((t) => t.side === 'sell').length
      const total = buyVol + sellVol
      return {
        buyVol,
        sellVol,
        netFlow: buyVol - sellVol,
        buyRatio: total > 0 ? buyVol / total : 0.5,
        buyCount,
        sellCount,
      }
    }

    const flow30s = flowInWindow(30000)
    const flow60s = flowInWindow(60000)
    const flow5m = flowInWindow(5 * 60000)

    // ── 3. Wall Detection ─────────────────────────────────
    const allSizes = [...bids, ...asks].map((l) => l.amount)
    const avgSize = allSizes.reduce((a, b) => a + b, 0) / allSizes.length
    const wallThreshold = avgSize * 5

    const currentWalls: Wall[] = []

    for (const b of bids) {
      if (b.amount >= wallThreshold) {
        currentWalls.push({
          price: b.price,
          amount: b.amount,
          usdValue: b.price * b.amount,
          side: 'bid',
          distFromMid: ((mid - b.price) / mid) * 100,
        })
      }
    }
    for (const a of asks) {
      if (a.amount >= wallThreshold) {
        currentWalls.push({
          price: a.price,
          amount: a.amount,
          usdValue: a.price * a.amount,
          side: 'ask',
          distFromMid: ((a.price - mid) / mid) * 100,
        })
      }
    }

    // Wall state changes (compare with previous snapshot)
    const wallEvents: { type: string; wall: Wall }[] = []

    if (prevWallsTs > 0 && now - prevWallsTs < 30000) {
      // Detect removed walls
      for (const pw of prevWalls) {
        const stillExists = currentWalls.find(
          (w) => w.side === pw.side && Math.abs(w.price - pw.price) < mid * 0.0005
        )
        if (!stillExists) {
          wallEvents.push({
            type: pw.side === 'ask' ? 'ask_wall_removed' : 'bid_wall_removed',
            wall: pw,
          })
        }
      }

      // Detect new walls
      for (const cw of currentWalls) {
        const existed = prevWalls.find(
          (w) => w.side === cw.side && Math.abs(w.price - cw.price) < mid * 0.0005
        )
        if (!existed) {
          wallEvents.push({
            type: 'new_wall',
            wall: cw,
          })
        }
      }
    }

    // Update cache
    prevWalls = currentWalls
    prevWallsTs = now

    // ── 4. Signal computation ─────────────────────────────
    const signals: ObSignal[] = []

    // O1: Buy Imbalance
    if (depth05.imbalance >= 1.5 && flow60s.netFlow > 0) {
      signals.push({
        id: 'O1',
        name: '买盘失衡 Buy Imbalance',
        level: 'yellow',
        evidence: [
          `0.5% 范围 Bid/Ask 比 ${depth05.imbalance.toFixed(2)} (≥1.5触发)`,
          `60s 主动买入 ${flow60s.buyVol.toFixed(3)} BTC > 卖出 ${flow60s.sellVol.toFixed(3)} BTC`,
          `买盘深度 ${depth05.bidDepth.toFixed(2)} BTC / 卖盘 ${depth05.askDepth.toFixed(2)} BTC`,
        ],
        action: '短线偏向上方；若同时存在多头爆仓则谨慎（可能只是反弹）',
        ttlSeconds: 120,
      })
    }

    // O2: Sell Imbalance
    if (depth05.imbalance <= 0.67 && flow60s.netFlow < 0) {
      signals.push({
        id: 'O2',
        name: '卖盘失衡 Sell Imbalance',
        level: 'yellow',
        evidence: [
          `0.5% 范围 Bid/Ask 比 ${depth05.imbalance.toFixed(2)} (≤0.67触发)`,
          `60s 主动卖出 ${flow60s.sellVol.toFixed(3)} BTC > 买入 ${flow60s.buyVol.toFixed(3)} BTC`,
          `买盘深度 ${depth05.bidDepth.toFixed(2)} BTC / 卖盘 ${depth05.askDepth.toFixed(2)} BTC`,
        ],
        action: '短线偏向下方；若同时存在空头爆仓则更偏趋势延续',
        ttlSeconds: 120,
      })
    }

    // O3: Wall Break
    for (const ev of wallEvents) {
      if (ev.type === 'ask_wall_removed') {
        // Ask wall removed + price near/above wall → breakout
        if (ticker.lastPrice >= ev.wall.price * 0.999) {
          signals.push({
            id: `O3a-${ev.wall.price.toFixed(0)}`,
            name: '上方墙突破 Wall Break',
            level: 'yellow',
            evidence: [
              `Ask 墙消失: $${ev.wall.price.toFixed(0)} (${ev.wall.amount.toFixed(4)} BTC / $${(ev.wall.usdValue / 1000).toFixed(0)}K)`,
              `当前价格 $${ticker.lastPrice.toFixed(0)} 已触及/突破墙价位`,
              `阻力消失，向上突破更可信`,
            ],
            action: '突破确认倾向增强（结合爆仓/融资环境综合判断）',
            ttlSeconds: 60,
          })
        }
      }
      if (ev.type === 'bid_wall_removed') {
        if (ticker.lastPrice <= ev.wall.price * 1.001) {
          signals.push({
            id: `O3b-${ev.wall.price.toFixed(0)}`,
            name: '下方墙击穿 Wall Break',
            level: 'yellow',
            evidence: [
              `Bid 墙消失: $${ev.wall.price.toFixed(0)} (${ev.wall.amount.toFixed(4)} BTC / $${(ev.wall.usdValue / 1000).toFixed(0)}K)`,
              `当前价格 $${ticker.lastPrice.toFixed(0)} 已跌破墙价位`,
              `支撑消失，向下突破更可信`,
            ],
            action: '支撑击穿确认，注意下方风险',
            ttlSeconds: 60,
          })
        }
      }
    }

    const overallLevel: 'green' | 'yellow' | 'red' =
      signals.some((s) => s.level === 'red')
        ? 'red'
        : signals.some((s) => s.level === 'yellow')
        ? 'yellow'
        : 'green'

    // ── Top bids/asks for display ─────────────────────────
    const topBids = bids.slice(0, 15).map((b) => ({
      price: b.price,
      amount: b.amount,
      usdValue: b.price * b.amount,
      isWall: b.amount >= wallThreshold,
    }))

    const topAsks = asks.slice(0, 15).map((a) => ({
      price: a.price,
      amount: a.amount,
      usdValue: a.price * a.amount,
      isWall: a.amount >= wallThreshold,
    }))

    return NextResponse.json({
      success: true,
      data: {
        mid,
        spread: (asks[0]?.price != null && bids[0]?.price != null) ? asks[0].price - bids[0].price : 0,
        spreadPct: (asks[0]?.price != null && bids[0]?.price != null && mid > 0) ? ((asks[0].price - bids[0].price) / mid) * 100 : 0,
        depth: {
          '0.2%': depth02,
          '0.5%': depth05,
          '1%': depth10,
        },
        flow: {
          '30s': flow30s,
          '60s': flow60s,
          '5m': flow5m,
        },
        walls: currentWalls.sort((a, b) => b.usdValue - a.usdValue).slice(0, 10),
        wallEvents,
        topBids,
        topAsks,
        signals,
        overallLevel,
        btcPrice: ticker.lastPrice,
      },
      timestamp: now,
    })
  } catch (error) {
    console.error('Orderbook Sniper Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() },
      { status: 500 }
    )
  }
}

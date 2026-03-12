'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

interface OrderBookEntry {
  price: number
  count: number
  amount: number
}

interface OrderBookDepthProps {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
  bidTotal: number
  askTotal: number
  bidAskRatio: number
  spread: number
  spreadPerc: number
}

export function OrderBookDepth({
  bids,
  asks,
  bidTotal,
  askTotal,
  bidAskRatio,
  spread,
  spreadPerc,
}: OrderBookDepthProps) {
  const { locale } = useI18n()

  const copy = {
    en: {
      title: 'Orderbook depth',
      buyPressure: 'Buy pressure',
      sellPressure: 'Sell pressure',
      bids: 'Bids',
      asks: 'Asks',
      price: 'Price',
      amount: 'Amount',
    },
    zh: {
      title: '订单簿深度',
      buyPressure: '买压',
      sellPressure: '卖压',
      bids: '买盘',
      asks: '卖盘',
      price: '价格',
      amount: '数量',
    },
    vi: {
      title: 'Độ sâu sổ lệnh',
      buyPressure: 'Áp lực mua',
      sellPressure: 'Áp lực bán',
      bids: 'Mua',
      asks: 'Bán',
      price: 'Giá',
      amount: 'Số lượng',
    },
  }[locale]

  const maxAmount = useMemo(() => {
    const allAmounts = [...bids.map((b) => b.amount), ...asks.map((a) => a.amount)]
    return Math.max(...allAmounts)
  }, [bids, asks])

  const pressure = bidAskRatio > 1 ? 'buy' : 'sell'
  const pressureStrength = Math.abs(bidAskRatio - 1) * 100
  const total = bidTotal + askTotal
  const bidPct = total > 0 ? (bidTotal / total) * 100 : 50
  const askPct = total > 0 ? (askTotal / total) * 100 : 50

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{copy.title}</h3>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              pressure === 'buy'
                ? 'bg-green-500/10 text-green-500'
                : 'bg-red-500/10 text-red-500'
            )}
          >
            {pressure === 'buy' ? copy.buyPressure : copy.sellPressure} {pressureStrength.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* 买卖压力条 */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-green-500">{copy.bids} {bidTotal.toFixed(2)} BTC</span>
          <span className="text-red-500">{copy.asks} {askTotal.toFixed(2)} BTC</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex bg-muted">
          <div
            className="bg-green-500 transition-all duration-500"
            style={{ width: `${bidPct}%` }}
          />
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${askPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 text-muted-foreground">
          <span>{bidPct.toFixed(1)}%</span>
          <span>Spread: ${spread.toFixed(0)} ({spreadPerc.toFixed(3)}%)</span>
          <span>{askPct.toFixed(1)}%</span>
        </div>
      </div>

      {/* 订单簿 */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* 买单 */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-muted-foreground mb-1">
            <span>{copy.price}</span>
            <span>{copy.amount}</span>
          </div>
          {bids.slice(0, 10).map((bid, i) => (
            <div key={i} className="relative flex justify-between py-0.5">
              <div
                className="absolute inset-y-0 right-0 bg-green-500/10"
                style={{ width: `${(bid.amount / maxAmount) * 100}%` }}
              />
              <span className="relative text-green-500 font-mono">
                {bid.price.toLocaleString()}
              </span>
              <span className="relative font-mono">{bid.amount.toFixed(4)}</span>
            </div>
          ))}
        </div>

        {/* 卖单 */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-muted-foreground mb-1">
            <span>{copy.price}</span>
            <span>{copy.amount}</span>
          </div>
          {asks.slice(0, 10).map((ask, i) => (
            <div key={i} className="relative flex justify-between py-0.5">
              <div
                className="absolute inset-y-0 left-0 bg-red-500/10"
                style={{ width: `${(ask.amount / maxAmount) * 100}%` }}
              />
              <span className="relative text-red-500 font-mono">
                {ask.price.toLocaleString()}
              </span>
              <span className="relative font-mono">{ask.amount.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useRef } from 'react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface Trade {
  id: number
  price: number
  amount: number
  side: 'buy' | 'sell'
  timestamp: number
}

interface OrderFlowProps {
  trades: Trade[]
  maxItems?: number
}

export function OrderFlow({ trades, maxItems = 15 }: OrderFlowProps) {
  const { locale, localeTag } = useI18n()
  const [displayTrades, setDisplayTrades] = useState<Trade[]>([])
  const [newTradeIds, setNewTradeIds] = useState<Set<number>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (trades.length > 0) {
      const newIds = new Set(
        trades.filter((t) => !displayTrades.find((d) => d.id === t.id)).map((t) => t.id)
      )
      setNewTradeIds(newIds)
      setDisplayTrades(trades.slice(0, maxItems))

      // 清除高亮
      setTimeout(() => {
        setNewTradeIds(new Set())
      }, 500)
    }
  }, [trades, maxItems])

  // 计算买卖比例
  const buyVolume = displayTrades
    .filter((t) => t.side === 'buy')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const sellVolume = displayTrades
    .filter((t) => t.side === 'sell')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const totalVolume = buyVolume + sellVolume
  const buyPercent = totalVolume > 0 ? (buyVolume / totalVolume) * 100 : 50
  const labels = {
    en: { title: 'Live Trade Flow', buy: 'buy', sell: 'sell', price: 'Price', amount: 'Size', time: 'Time', total: 'Total trades', volume: 'Volume' },
    zh: { title: '实时成交流', buy: '买入', sell: '卖出', price: '价格', amount: '数量', time: '时间', total: '总成交', volume: '成交量' },
    vi: { title: 'Dòng khớp lệnh trực tiếp', buy: 'mua', sell: 'bán', price: 'Giá', amount: 'Khối lượng', time: 'Thời gian', total: 'Tổng giao dịch', volume: 'Khối lượng' },
  }[locale]

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* 头部 */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">{labels.title}</h3>
          <span className="text-xs text-muted-foreground">Bitfinex BTC/USD</span>
        </div>

        {/* 买卖比例条 */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
          <div
            className="bg-green-500 transition-all duration-500"
            style={{ width: `${buyPercent}%` }}
          />
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${100 - buyPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-green-500">{buyPercent.toFixed(1)}% {labels.buy}</span>
          <span className="text-red-500">{(100 - buyPercent).toFixed(1)}% {labels.sell}</span>
        </div>
      </div>

      {/* 成交列表 */}
      <div ref={containerRef} className="max-h-[300px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="text-muted-foreground border-b border-border">
              <th className="py-2 px-3 text-left font-medium">{labels.price}</th>
              <th className="py-2 px-3 text-right font-medium">{labels.amount}</th>
              <th className="py-2 px-3 text-right font-medium">{labels.time}</th>
            </tr>
          </thead>
          <tbody>
            {displayTrades.map((trade, index) => (
              <tr
                key={trade.id}
                className={cn(
                  'border-b border-border/50 transition-all duration-300',
                  newTradeIds.has(trade.id) && 'animate-pulse',
                  trade.side === 'buy'
                    ? newTradeIds.has(trade.id)
                      ? 'bg-green-500/20'
                      : 'hover:bg-green-500/5'
                    : newTradeIds.has(trade.id)
                    ? 'bg-red-500/20'
                    : 'hover:bg-red-500/5'
                )}
                style={{
                  animationDelay: `${index * 20}ms`,
                }}
              >
                <td
                  className={cn(
                    'py-1.5 px-3 font-mono',
                    trade.side === 'buy' ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  ${trade.price.toLocaleString()}
                </td>
                <td className="py-1.5 px-3 text-right font-mono">
                  {Math.abs(trade.amount).toFixed(4)}
                </td>
                <td className="py-1.5 px-3 text-right text-muted-foreground">
                  {new Date(trade.timestamp).toLocaleTimeString(localeTag, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 底部统计 */}
      <div className="p-2 border-t border-border bg-muted/30 flex justify-between text-xs">
        <span className="text-muted-foreground">
          {labels.total}: <span className="text-foreground font-mono">{displayTrades.length}</span>
        </span>
        <span className="text-muted-foreground">
          {labels.volume}:{' '}
          <span className="text-foreground font-mono">{totalVolume.toFixed(2)}</span> BTC
        </span>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { ArrowUp, ArrowDown, Minus, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TickerItem {
  symbol: string
  price: number
  change: number
  volume: string
}

interface LiveTickerProps {
  items: TickerItem[]
}

export function LiveTicker({ items }: LiveTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (items.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [items.length])

  if (items.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-primary/10 via-transparent to-primary/10 border-y border-border overflow-hidden">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
          {/* 实时指示 */}
          <div className="flex items-center gap-2 shrink-0">
            <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">LIVE</span>
          </div>

          {/* Ticker 列表 */}
          {items.map((item, index) => (
            <div
              key={item.symbol}
              className={cn(
                'flex items-center gap-3 shrink-0 transition-all duration-300',
                index === currentIndex && 'scale-105'
              )}
            >
              <span className="font-semibold text-sm">{item.symbol}</span>
              <span className="font-mono text-sm">
                ${item.price.toLocaleString()}
              </span>
              <span
                className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  item.change > 0
                    ? 'text-green-500'
                    : item.change < 0
                    ? 'text-red-500'
                    : 'text-muted-foreground'
                )}
              >
                {item.change > 0 ? (
                  <ArrowUp className="w-3 h-3" />
                ) : item.change < 0 ? (
                  <ArrowDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {Math.abs(item.change).toFixed(2)}%
              </span>
              <span className="text-xs text-muted-foreground">Vol: {item.volume}</span>

              {/* 分隔线 */}
              {index < items.length - 1 && (
                <div className="w-px h-4 bg-border ml-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

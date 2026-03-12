'use client'

import { useEffect, useState, useRef } from 'react'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PriceDisplayProps {
  price: number
  previousPrice?: number
  symbol?: string
  showChange?: boolean
}

export function PriceDisplay({
  price,
  previousPrice,
  symbol = 'BTC',
  showChange = true,
}: PriceDisplayProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const [displayPrice, setDisplayPrice] = useState(price)
  const prevPriceRef = useRef(price)

  useEffect(() => {
    if (price !== prevPriceRef.current) {
      // 触发闪烁效果
      setFlash(price > prevPriceRef.current ? 'up' : 'down')

      // 数字滚动动画
      const startPrice = prevPriceRef.current
      const endPrice = price
      const duration = 500
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        const currentPrice = startPrice + (endPrice - startPrice) * eased

        setDisplayPrice(currentPrice)

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
      prevPriceRef.current = price

      // 清除闪烁
      setTimeout(() => setFlash(null), 300)
    }
  }, [price])

  const change = previousPrice ? ((price - previousPrice) / previousPrice) * 100 : 0

  return (
    <div className="relative">
      {/* 主价格显示 */}
      <div
        className={cn(
          'text-4xl font-bold font-mono transition-colors duration-300',
          flash === 'up' && 'text-green-400',
          flash === 'down' && 'text-red-400',
          !flash && 'text-foreground'
        )}
      >
        <span className="text-muted-foreground text-2xl mr-1">$</span>
        {displayPrice.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
      </div>

      {/* 变化指示 */}
      {showChange && change !== 0 && (
        <div
          className={cn(
            'flex items-center gap-1 mt-1 text-sm',
            change > 0 ? 'text-green-500' : 'text-red-500'
          )}
        >
          {change > 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {change > 0 ? '+' : ''}
            {change.toFixed(2)}%
          </span>
          <span className="text-muted-foreground">24h</span>
        </div>
      )}

      {/* 活跃指示器 */}
      <div className="absolute -right-2 -top-2">
        <Activity
          className={cn(
            'w-4 h-4 transition-opacity',
            flash ? 'opacity-100' : 'opacity-30',
            flash === 'up' && 'text-green-500',
            flash === 'down' && 'text-red-500'
          )}
        />
      </div>
    </div>
  )
}

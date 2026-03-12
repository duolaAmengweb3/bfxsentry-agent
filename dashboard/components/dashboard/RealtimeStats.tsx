'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

interface TickerData {
  bid: number
  bidSize: number
  ask: number
  askSize: number
  dailyChange: number
  dailyChangePerc: number
  lastPrice: number
  volume: number
  high: number
  low: number
}

interface RealtimeStatsProps {
  ticker: TickerData
}

export function RealtimeStats({ ticker }: RealtimeStatsProps) {
  const { locale } = useI18n()

  const copy = {
    en: {
      livePrice: 'BTC/USD live price',
      volume24h: '24h volume',
      bestBid: 'Best bid',
      bestAsk: 'Best ask',
      high24h: '24h high',
      low24h: '24h low',
      current: 'Current',
      low: 'Low',
      high: 'High',
      fromHigh: 'From high',
    },
    zh: {
      livePrice: 'BTC/USD 实时价格',
      volume24h: '24h 成交量',
      bestBid: '买一',
      bestAsk: '卖一',
      high24h: '24h 最高',
      low24h: '24h 最低',
      current: '当前位置',
      low: '低',
      high: '高',
      fromHigh: '距离最高点',
    },
    vi: {
      livePrice: 'Giá BTC/USD trực tiếp',
      volume24h: 'Khối lượng 24h',
      bestBid: 'Mua tốt nhất',
      bestAsk: 'Bán tốt nhất',
      high24h: '24h cao nhất',
      low24h: '24h thấp nhất',
      current: 'Hiện tại',
      low: 'Thấp',
      high: 'Cao',
      fromHigh: 'Cách đỉnh',
    },
  }[locale]

  const [prevPrice, setPrevPrice] = useState(ticker.lastPrice)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    if (ticker.lastPrice !== prevPrice) {
      setFlash(ticker.lastPrice > prevPrice ? 'up' : 'down')
      setPrevPrice(ticker.lastPrice)
      const timer = setTimeout(() => setFlash(null), 300)
      return () => clearTimeout(timer)
    }
  }, [ticker.lastPrice, prevPrice])

  const isPositive = ticker.dailyChangePerc >= 0
  const priceRange = ticker.high - ticker.low
  const pricePosition = priceRange > 0 ? ((ticker.lastPrice - ticker.low) / priceRange) * 100 : 50

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* 主价格区 */}
      <div
        className={cn(
          'p-4 transition-colors duration-300',
          flash === 'up' && 'bg-green-500/10',
          flash === 'down' && 'bg-red-500/10'
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">{copy.livePrice}</div>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  'text-4xl font-bold font-mono tabular-nums transition-colors duration-300',
                  flash === 'up' && 'text-green-500',
                  flash === 'down' && 'text-red-500'
                )}
              >
                ${ticker.lastPrice.toLocaleString()}
              </span>
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
                <span
                  className={cn(
                    'text-lg font-medium',
                    isPositive ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {isPositive ? '+' : ''}
                  {(ticker.dailyChangePerc * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">{copy.volume24h}</div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-xl font-bold font-mono">
                {ticker.volume.toFixed(2)} BTC
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 买卖盘 + 高低点 */}
      <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
        <div className="p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">{copy.bestBid}</div>
          <div className="text-green-500 font-mono font-medium">
            ${ticker.bid.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">{ticker.bidSize.toFixed(2)} BTC</div>
        </div>
        <div className="p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">{copy.bestAsk}</div>
          <div className="text-red-500 font-mono font-medium">
            ${ticker.ask.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">{ticker.askSize.toFixed(2)} BTC</div>
        </div>
        <div className="p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">{copy.high24h}</div>
          <div className="font-mono font-medium">${ticker.high.toLocaleString()}</div>
        </div>
        <div className="p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">{copy.low24h}</div>
          <div className="font-mono font-medium">${ticker.low.toLocaleString()}</div>
        </div>
      </div>

      {/* 价格位置指示 */}
      <div className="p-3 border-t border-border">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{copy.low} ${ticker.low.toLocaleString()}</span>
          <span>{copy.current}</span>
          <span>{copy.high} ${ticker.high.toLocaleString()}</span>
        </div>
        <div className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative">
          <div
            className="absolute w-3 h-3 bg-white rounded-full shadow-lg top-1/2 transition-all duration-500"
            style={{
              left: `${pricePosition}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
        <div className="text-center text-xs text-muted-foreground mt-1">
          {copy.fromHigh} -{((ticker.high - ticker.lastPrice) / ticker.high * 100).toFixed(2)}%
        </div>
      </div>
    </div>
  )
}

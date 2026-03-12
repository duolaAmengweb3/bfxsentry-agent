'use client'

import { useState, useEffect } from 'react'
import { Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

interface FundingCountdownProps {
  nextFundingTs: number
  currentRate: number
  predictedRate: number
}

export function FundingCountdown({
  nextFundingTs,
  currentRate,
  predictedRate,
}: FundingCountdownProps) {
  const { locale } = useI18n()

  const copy = {
    en: {
      title: 'Funding countdown',
      longsPay: 'Longs pay',
      shortsPay: 'Shorts pay',
      hours: 'h',
      minutes: 'm',
      seconds: 's',
      currentRate: 'Current rate',
      annualized: 'Annualized',
    },
    zh: {
      title: 'Funding 倒计时',
      longsPay: '多头付费',
      shortsPay: '空头付费',
      hours: '时',
      minutes: '分',
      seconds: '秒',
      currentRate: '当前费率',
      annualized: '年化率',
    },
    vi: {
      title: 'Đếm ngược Funding',
      longsPay: 'Long trả phí',
      shortsPay: 'Short trả phí',
      hours: 'h',
      minutes: 'm',
      seconds: 's',
      currentRate: 'Lãi suất hiện tại',
      annualized: 'Lãi suất năm',
    },
  }[locale]

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const diff = Math.max(0, nextFundingTs - now)
      const totalSeconds = Math.floor(diff / 1000)

      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      setTimeLeft({ hours, minutes, seconds })

      // 8 hour cycle
      const cycleMs = 8 * 60 * 60 * 1000
      const elapsed = cycleMs - diff
      const pct = (elapsed / cycleMs) * 100
      setProgress(Math.min(100, Math.max(0, pct)))
    }, 1000)

    return () => clearInterval(interval)
  }, [nextFundingTs])

  const rateAnnualized = (currentRate * 3 * 365 * 100).toFixed(0)
  const isPositive = currentRate > 0

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">{copy.title}</h3>
        </div>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            isPositive
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          )}
        >
          {isPositive ? copy.longsPay : copy.shortsPay}
        </span>
      </div>

      {/* 倒计时显示 */}
      <div className="flex justify-center gap-2 mb-4">
        <div className="text-center">
          <div className="text-3xl font-bold font-mono tabular-nums">
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div className="text-xs text-muted-foreground">{copy.hours}</div>
        </div>
        <div className="text-3xl font-bold">:</div>
        <div className="text-center">
          <div className="text-3xl font-bold font-mono tabular-nums">
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div className="text-xs text-muted-foreground">{copy.minutes}</div>
        </div>
        <div className="text-3xl font-bold">:</div>
        <div className="text-center">
          <div className="text-3xl font-bold font-mono tabular-nums animate-pulse">
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className="text-xs text-muted-foreground">{copy.seconds}</div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-4">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-1000 rounded-full',
              isPositive ? 'bg-green-500' : 'bg-red-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 费率信息 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">{copy.currentRate}</div>
          <div className="flex items-center justify-center gap-1">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span
              className={cn(
                'text-lg font-bold font-mono',
                isPositive ? 'text-green-500' : 'text-red-500'
              )}
            >
              {(currentRate * 100).toFixed(4)}%
            </span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">{copy.annualized}</div>
          <div className="text-lg font-bold font-mono text-yellow-500">~{rateAnnualized}%</div>
        </div>
      </div>
    </div>
  )
}

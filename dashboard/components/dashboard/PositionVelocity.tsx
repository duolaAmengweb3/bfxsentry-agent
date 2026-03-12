'use client'

import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface PositionVelocityProps {
  change1h: number
  change4h: number
  change24h: number
}

export function PositionVelocity({ change1h, change4h, change24h }: PositionVelocityProps) {
  const { locale } = useI18n()
  const labels = {
    en: {
      fastBuild: 'Fast build',
      slowBuild: 'Slow build',
      fastReduce: 'Fast reduce',
      slowReduce: 'Slow reduce',
      flat: 'Flat',
      title: 'Position Velocity',
      accumulating: 'Building across frames',
      distributing: 'Reducing across frames',
      mixed: 'Mixed direction',
      h1: '1h',
      h4: '4h',
      h24: '24h',
      reduce: 'Reducing',
      build: 'Building',
    },
    zh: {
      fastBuild: '快速增仓',
      slowBuild: '缓慢增仓',
      fastReduce: '快速减仓',
      slowReduce: '缓慢减仓',
      flat: '持平',
      title: '仓位变化速度',
      accumulating: '持续增仓',
      distributing: '持续减仓',
      mixed: '方向不明',
      h1: '1小时',
      h4: '4小时',
      h24: '24小时',
      reduce: '减仓',
      build: '增仓',
    },
    vi: {
      fastBuild: 'Tăng vị thế nhanh',
      slowBuild: 'Tăng vị thế chậm',
      fastReduce: 'Giảm vị thế nhanh',
      slowReduce: 'Giảm vị thế chậm',
      flat: 'Đi ngang',
      title: 'Tốc độ thay đổi vị thế',
      accumulating: 'Đang tăng vị thế liên tục',
      distributing: 'Đang giảm vị thế liên tục',
      mixed: 'Hướng chưa rõ',
      h1: '1 giờ',
      h4: '4 giờ',
      h24: '24 giờ',
      reduce: 'Giảm vị thế',
      build: 'Tăng vị thế',
    },
  }[locale]

  const getStatus = (change: number) => {
    if (change > 0.1) return { label: labels.fastBuild, color: 'text-green-500', bg: 'bg-green-500' }
    if (change > 0.02) return { label: labels.slowBuild, color: 'text-green-400', bg: 'bg-green-400' }
    if (change < -0.1) return { label: labels.fastReduce, color: 'text-red-500', bg: 'bg-red-500' }
    if (change < -0.02) return { label: labels.slowReduce, color: 'text-red-400', bg: 'bg-red-400' }
    return { label: labels.flat, color: 'text-muted-foreground', bg: 'bg-muted-foreground' }
  }

  const status1h = getStatus(change1h)
  const overallTrend =
    change1h > 0 && change4h > 0 && change24h > 0
      ? 'accumulating'
      : change1h < 0 && change4h < 0 && change24h < 0
      ? 'distributing'
      : 'mixed'

  const renderChange = (change: number, period: string) => {
    const isPositive = change >= 0
    return (
      <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
        <span className="text-sm text-muted-foreground">{period}</span>
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className={cn('w-4 h-4', change > 0.05 ? 'text-green-500' : 'text-green-400')} />
          ) : (
            <TrendingDown className={cn('w-4 h-4', change < -0.05 ? 'text-red-500' : 'text-red-400')} />
          )}
          <span
            className={cn(
              'font-mono font-medium',
              isPositive ? 'text-green-500' : 'text-red-500'
            )}
          >
            {isPositive ? '+' : ''}
            {change.toFixed(3)}%
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <h3 className="font-semibold text-sm">{labels.title}</h3>
        </div>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            overallTrend === 'accumulating'
              ? 'bg-green-500/10 text-green-500'
              : overallTrend === 'distributing'
              ? 'bg-red-500/10 text-red-500'
              : 'bg-yellow-500/10 text-yellow-500'
          )}
        >
          {overallTrend === 'accumulating' ? labels.accumulating : overallTrend === 'distributing' ? labels.distributing : labels.mixed}
        </span>
      </div>

      <div className="space-y-0">
        {renderChange(change1h, labels.h1)}
        {renderChange(change4h, labels.h4)}
        {renderChange(change24h, labels.h24)}
      </div>

      {/* 趋势强度条 */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{labels.reduce}</span>
          <span>{labels.build}</span>
        </div>
        <div className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative">
          <div
            className="absolute w-3 h-3 bg-white rounded-full shadow-lg top-1/2 -translate-y-1/2 transition-all duration-500"
            style={{
              left: `${Math.min(100, Math.max(0, 50 + change24h * 100))}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

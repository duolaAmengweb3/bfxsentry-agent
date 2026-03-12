'use client'

import { useEffect, useState, useRef } from 'react'
import { HelpCircle, TrendingUp, TrendingDown, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip'
import { MiniChart } from '@/components/charts/MiniChart'
import { cn } from '@/lib/utils'

interface MetricCardProProps {
  title: string
  value: number | string
  previousValue?: number
  unit?: string
  change?: {
    value: number
    period: string
  }
  status?: 'positive' | 'negative' | 'neutral' | 'warning' | 'danger'
  statusLabel?: string
  tooltip?: string
  history?: number[]
  showSparkle?: boolean
  precision?: number
}

export function MetricCardPro({
  title,
  value,
  previousValue,
  unit,
  change,
  status = 'neutral',
  statusLabel,
  tooltip,
  history = [],
  showSparkle = false,
  precision = 2,
}: MetricCardProProps) {
  const [displayValue, setDisplayValue] = useState(typeof value === 'number' ? value : 0)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const prevValueRef = useRef(typeof value === 'number' ? value : 0)

  useEffect(() => {
    if (typeof value === 'number' && value !== prevValueRef.current) {
      setFlash(value > prevValueRef.current ? 'up' : 'down')

      // 数值动画
      const start = prevValueRef.current
      const end = value
      const duration = 500
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayValue(start + (end - start) * eased)

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
      prevValueRef.current = value

      setTimeout(() => setFlash(null), 500)
    }
  }, [value])

  const statusColors = {
    positive: 'text-green-500',
    negative: 'text-red-500',
    neutral: 'text-muted-foreground',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
  }

  const statusBgColors = {
    positive: 'bg-green-500/10 text-green-500 border-green-500/30',
    negative: 'bg-red-500/10 text-red-500 border-red-500/30',
    neutral: 'bg-muted text-muted-foreground border-border',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    danger: 'bg-red-500/10 text-red-500 border-red-500/30',
  }

  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val
    if (val >= 1e9) return (val / 1e9).toFixed(precision) + 'B'
    if (val >= 1e6) return (val / 1e6).toFixed(precision) + 'M'
    if (val >= 1e3) return (val / 1e3).toFixed(precision) + 'K'
    return val.toFixed(precision)
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        flash === 'up' && 'ring-1 ring-green-500/50',
        flash === 'down' && 'ring-1 ring-red-500/50'
      )}
    >
      {/* 闪烁背景 */}
      {flash && (
        <div
          className={cn(
            'absolute inset-0 opacity-10 transition-opacity duration-300',
            flash === 'up' ? 'bg-green-500' : 'bg-red-500'
          )}
        />
      )}

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-1.5">
          {title}
          {tooltip && (
            <Tooltip content={tooltip}>
              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </Tooltip>
          )}
          {showSparkle && (
            <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
          )}
        </CardTitle>
        {statusLabel && (
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full border',
              statusBgColors[status]
            )}
          >
            {statusLabel}
          </span>
        )}
      </CardHeader>

      <CardContent>
        {/* 主数值 */}
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              'text-2xl font-bold font-mono transition-colors duration-300',
              flash === 'up' && 'text-green-500',
              flash === 'down' && 'text-red-500'
            )}
          >
            {typeof value === 'string' ? value : formatValue(displayValue)}
          </span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>

        {/* 变化 */}
        {change && (
          <div className="flex items-center gap-1 mt-1">
            {change.value >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                change.value >= 0 ? 'text-green-500' : 'text-red-500'
              )}
            >
              {change.value >= 0 ? '+' : ''}
              {(change.value * 100).toFixed(2)}%
            </span>
            <span className="text-xs text-muted-foreground">{change.period}</span>
          </div>
        )}

        {/* 迷你图表 */}
        {history.length > 0 && (
          <div className="mt-3">
            <MiniChart
              data={history}
              width={200}
              height={40}
              color={status === 'positive' ? 'green' : status === 'negative' ? 'red' : 'auto'}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

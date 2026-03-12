'use client'

import { HelpCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  change?: {
    value: number
    period: string
  }
  status?: 'positive' | 'negative' | 'neutral' | 'warning' | 'danger'
  statusLabel?: string
  tooltip?: string
  children?: React.ReactNode
}

const statusColors = {
  positive: 'text-green-500',
  negative: 'text-red-500',
  neutral: 'text-muted-foreground',
  warning: 'text-yellow-500',
  danger: 'text-red-500',
}

const statusBgColors = {
  positive: 'bg-green-500/10 text-green-500',
  negative: 'bg-red-500/10 text-red-500',
  neutral: 'bg-muted text-muted-foreground',
  warning: 'bg-yellow-500/10 text-yellow-500',
  danger: 'bg-red-500/10 text-red-500',
}

export function MetricCard({
  title,
  value,
  unit,
  change,
  status = 'neutral',
  statusLabel,
  tooltip,
  children,
}: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-1">
          {title}
          {tooltip && (
            <Tooltip content={tooltip}>
              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </Tooltip>
          )}
        </CardTitle>
        {statusLabel && (
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full',
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
          <span className="text-2xl font-bold">{value}</span>
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
                'text-sm',
                change.value >= 0 ? 'text-green-500' : 'text-red-500'
              )}
            >
              {change.value >= 0 ? '+' : ''}
              {(change.value * 100).toFixed(2)}%
            </span>
            <span className="text-xs text-muted-foreground">{change.period}</span>
          </div>
        )}

        {/* 自定义内容 (图表等) */}
        {children && <div className="mt-3">{children}</div>}
      </CardContent>
    </Card>
  )
}

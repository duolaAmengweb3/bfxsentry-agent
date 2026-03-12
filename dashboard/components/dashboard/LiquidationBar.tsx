'use client'

import { AlertTriangle } from 'lucide-react'
import { formatNumber, formatRelativeTime } from '@/lib/utils'
import type { LiquidationData } from '@/types'
import { useI18n } from '@/lib/i18n'

interface LiquidationBarProps {
  liquidations: LiquidationData[]
  total24h: number
}

export function LiquidationBar({ liquidations, total24h }: LiquidationBarProps) {
  const { locale } = useI18n()
  const latest = liquidations[0]
  const labels = {
    en: { title: 'Liquidations', total: '24h liquidations', latest: 'Latest' },
    zh: { title: '清算监控', total: '24h 清算', latest: '最近' },
    vi: { title: 'Thanh lý', total: 'Thanh lý 24h', latest: 'Mới nhất' },
  }[locale]

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium">{labels.title}</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{labels.total}: </span>
            <span className="font-medium">${formatNumber(total24h)}</span>
          </div>

          {latest && (
            <div className="text-muted-foreground">
              {labels.latest}:{' '}
              <span className="text-foreground">
                {latest.symbol.replace('F0:USTF0', '')} -$
                {formatNumber(latest.amount * latest.price)}
              </span>
              <span className="ml-1">@${latest.price.toFixed(2)}</span>
              <span className="ml-1 text-xs">({formatRelativeTime(latest.timestamp)})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

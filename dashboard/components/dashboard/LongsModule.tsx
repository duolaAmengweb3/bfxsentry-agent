'use client'

import { MetricCard } from './MetricCard'
import { useI18n } from '@/lib/i18n'
import { formatNumber } from '@/lib/utils'

interface LongsModuleProps {
  longs: number
  shorts: number
  change7d: number
  longShortRatio: number
}

export function LongsModule({ longs, shorts, change7d, longShortRatio }: LongsModuleProps) {
  const { locale } = useI18n()
  const status = change7d > 0.02 ? 'positive' : change7d < -0.02 ? 'negative' : 'neutral'
  const copy = {
    en: {
      statusLabel: change7d > 0.02 ? 'Building' : change7d < -0.02 ? 'Reducing' : 'Stable',
      title: 'BTC Long Positions',
      tooltip: 'Total BTC margin longs on Bitfinex. Adding on weakness can suggest accumulation by whales.',
      shorts: 'Short positions',
      ratio: 'Long/short ratio',
      long: 'long',
      short: 'short',
    },
    zh: {
      statusLabel: change7d > 0.02 ? '增仓中' : change7d < -0.02 ? '减仓中' : '平稳',
      title: 'BTC 多头仓位',
      tooltip: 'Bitfinex BTC 杠杆多头总仓位。巨鲸在下跌时加仓可能是吸筹信号。',
      shorts: '空头仓位',
      ratio: '多空比',
      long: '多',
      short: '空',
    },
    vi: {
      statusLabel: change7d > 0.02 ? 'Đang tăng vị thế' : change7d < -0.02 ? 'Đang giảm vị thế' : 'Ổn định',
      title: 'Vị thế long BTC',
      tooltip: 'Tổng vị thế margin long BTC trên Bitfinex. Việc tăng vị thế khi giá yếu có thể gợi ý tích lũy.',
      shorts: 'Vị thế short',
      ratio: 'Tỷ lệ long/short',
      long: 'long',
      short: 'short',
    },
  }[locale]

  return (
    <MetricCard
      title={copy.title}
      value={formatNumber(longs)}
      unit="BTC"
      change={{ value: change7d, period: '7D' }}
      status={status}
      statusLabel={copy.statusLabel}
      tooltip={copy.tooltip}
    >
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{copy.shorts}</span>
          <span>{formatNumber(shorts)} BTC</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{copy.ratio}</span>
          <span className="font-medium">
            {longShortRatio > 1000 ? '∞' : longShortRatio.toFixed(1)}:1
          </span>
        </div>

        {/* 多空比进度条 */}
        <div className="mt-3">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{
                width: `${Math.min((longs / (longs + shorts)) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span className="text-green-500">{((longs / (longs + shorts)) * 100).toFixed(1)}% {copy.long}</span>
            <span className="text-red-500">{((shorts / (longs + shorts)) * 100).toFixed(1)}% {copy.short}</span>
          </div>
        </div>
      </div>
    </MetricCard>
  )
}

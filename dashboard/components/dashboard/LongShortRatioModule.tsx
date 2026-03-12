'use client'

import { MetricCard } from './MetricCard'
import { useI18n } from '@/lib/i18n'

interface LongShortRatioModuleProps {
  ratio: number
  longs: number
  shorts: number
}

export function LongShortRatioModule({ ratio, longs, shorts }: LongShortRatioModuleProps) {
  const { locale } = useI18n()

  const copy = {
    en: {
      title: 'Long/Short ratio',
      balanced: 'Balanced',
      extremeLong: 'Extreme long',
      longDominant: 'Long dominant',
      shortDominant: 'Short dominant',
      tooltip: 'Ratio of BTC long vs short positions. Extreme values may signal reversal risk.',
    },
    zh: {
      title: '多空比',
      balanced: '平衡',
      extremeLong: '极度偏多',
      longDominant: '多头占优',
      shortDominant: '空头占优',
      tooltip: 'BTC 多头与空头仓位的比值。极端值可能预示反转风险。',
    },
    vi: {
      title: 'Tỷ lệ Long/Short',
      balanced: 'Cân bằng',
      extremeLong: 'Long cực đoan',
      longDominant: 'Long chiếm ưu thế',
      shortDominant: 'Short chiếm ưu thế',
      tooltip: 'Tỷ lệ vị thế long so với short BTC. Giá trị cực đoan có thể báo hiệu rủi ro đảo chiều.',
    },
  }[locale]

  // 判断状态
  let status: 'positive' | 'negative' | 'neutral' | 'warning' = 'neutral'
  let statusLabel = copy.balanced

  if (ratio > 100) {
    status = 'warning'
    statusLabel = copy.extremeLong
  } else if (ratio > 20) {
    status = 'positive'
    statusLabel = copy.longDominant
  } else if (ratio < 1) {
    status = 'negative'
    statusLabel = copy.shortDominant
  }

  const displayRatio = ratio > 1000 ? '∞' : ratio.toFixed(1)

  return (
    <MetricCard
      title={copy.title}
      value={`${displayRatio}:1`}
      status={status}
      statusLabel={statusLabel}
      tooltip={copy.tooltip}
    >
      <div className="mt-2">
        {/* 仪表盘样式 */}
        <div className="relative h-24 flex items-center justify-center">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            {/* 背景弧 */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            {/* 刻度 */}
            <path
              d="M 10 50 A 40 40 0 0 1 30 18"
              fill="none"
              stroke="#22c55e"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 30 18 A 40 40 0 0 1 70 18"
              fill="none"
              stroke="#eab308"
              strokeWidth="8"
            />
            <path
              d="M 70 18 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="#ef4444"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* 指针 */}
            <line
              x1="50"
              y1="50"
              x2={50 + 30 * Math.cos(Math.PI - Math.min(ratio / 300, 1) * Math.PI)}
              y2={50 - 30 * Math.sin(Math.PI - Math.min(ratio / 300, 1) * Math.PI)}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-foreground"
            />
            <circle cx="50" cy="50" r="4" className="fill-foreground" />
          </svg>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>1:1</span>
          <span className="font-medium">{displayRatio}:1</span>
          <span>300:1+</span>
        </div>
      </div>
    </MetricCard>
  )
}

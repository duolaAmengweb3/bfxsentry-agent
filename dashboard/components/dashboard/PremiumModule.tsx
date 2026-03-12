'use client'

import { MetricCard } from './MetricCard'
import type { PremiumData } from '@/types'
import { useI18n } from '@/lib/i18n'

interface PremiumModuleProps {
  data: PremiumData
}

export function PremiumModule({ data }: PremiumModuleProps) {
  const { locale } = useI18n()

  const copy = {
    en: {
      abnormal: 'Abnormal',
      normal: 'Normal',
      tooltip: 'Bitfinex price premium vs Coinbase. Sustained ±0.25% for 10 min is considered abnormal.',
    },
    zh: {
      abnormal: '异常',
      normal: '正常',
      tooltip: 'Bitfinex 相对 Coinbase 的价格溢价。超过 ±0.25% 持续 10 分钟视为异常。',
    },
    vi: {
      abnormal: 'Bất thường',
      normal: 'Bình thường',
      tooltip: 'Chênh lệch giá Bitfinex so với Coinbase. Vượt ±0.25% trong 10 phút được coi là bất thường.',
    },
  }[locale]

  const status = data.status === 'ALERT' ? 'danger' : 'positive'
  const statusLabel = data.status === 'ALERT' ? copy.abnormal : copy.normal

  return (
    <MetricCard
      title="Premium"
      value={data.premiumPct}
      status={status}
      statusLabel={statusLabel}
      tooltip={copy.tooltip}
    >
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Bitfinex</span>
          <span>${data.bfxPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Coinbase</span>
          <span>${data.cbPrice.toLocaleString()}</span>
        </div>

        {/* 进度条指示 */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>-0.5%</span>
            <span>0</span>
            <span>+0.5%</span>
          </div>
          <div className="h-2 bg-muted rounded-full relative">
            {/* 阈值区域 */}
            <div
              className="absolute inset-y-0 bg-green-500/20 rounded-full"
              style={{ left: '25%', right: '25%' }}
            />
            {/* 当前位置指示器 */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background"
              style={{
                left: `${Math.min(Math.max((data.premium + 0.005) / 0.01 * 100, 0), 100)}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
        </div>
      </div>
    </MetricCard>
  )
}

'use client'

import { MetricCard } from './MetricCard'
import { formatNumber } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

interface ConcentrationModuleProps {
  concentration: number
  totalUsd: number
  btcUsed: number
}

const copy = {
  en: {
    high: 'High',
    moderate: 'Moderate',
    dispersed: 'Dispersed',
    title: 'Loan concentration',
    tooltip: 'Ratio of BTC USD borrowing to total USD borrowing. High concentration means leverage risk is concentrated in BTC.',
    btcUsed: 'BTC used',
    totalUsd: 'Total USD',
  },
  zh: {
    high: '高集中',
    moderate: '较集中',
    dispersed: '分散',
    title: '借贷集中度',
    tooltip: 'BTC 交易使用的 USD 借贷占总 USD 借贷的比例。高集中度意味着杠杆风险集中在 BTC。',
    btcUsed: 'BTC 使用',
    totalUsd: 'USD 总量',
  },
  vi: {
    high: 'Cao',
    moderate: 'Trung bình',
    dispersed: 'Phân tán',
    title: 'Tập trung cho vay',
    tooltip: 'Tỷ lệ vay USD cho BTC so với tổng vay USD. Tập trung cao có nghĩa là rủi ro đòn bẩy tập trung vào BTC.',
    btcUsed: 'BTC sử dụng',
    totalUsd: 'Tổng USD',
  },
}

export function ConcentrationModule({
  concentration,
  totalUsd,
  btcUsed,
}: ConcentrationModuleProps) {
  const { locale } = useI18n()
  const t = copy[locale]
  const status = concentration > 0.95 ? 'warning' : concentration > 0.85 ? 'neutral' : 'positive'
  const statusLabel = concentration > 0.95 ? t.high : concentration > 0.85 ? t.moderate : t.dispersed

  return (
    <MetricCard
      title={t.title}
      value={`${(concentration * 100).toFixed(1)}%`}
      status={status}
      statusLabel={statusLabel}
      tooltip={t.tooltip}
    >
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.btcUsed}</span>
          <span>${formatNumber(btcUsed)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.totalUsd}</span>
          <span>${formatNumber(totalUsd)}</span>
        </div>

        {/* 饼图 */}
        <div className="mt-3 flex items-center justify-center">
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.91549430918954"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted"
              />
              <circle
                cx="18"
                cy="18"
                r="15.91549430918954"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${concentration * 100} ${100 - concentration * 100}`}
                className="text-primary"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold">{(concentration * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    </MetricCard>
  )
}

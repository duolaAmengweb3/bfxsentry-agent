'use client'

import { MetricCard } from './MetricCard'
import { formatNumber } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

interface EthBtcPhaseModuleProps {
  longs: number
  phase: 'BUILD' | 'UNWIND' | 'NEUTRAL'
  phaseDuration: number
}

const phaseStatusMap = {
  BUILD: 'positive' as const,
  UNWIND: 'warning' as const,
  NEUTRAL: 'neutral' as const,
}

const copy = {
  en: {
    BUILD: { label: 'Building', description: 'Whales are slowly building ETH/BTC long positions' },
    UNWIND: { label: 'Unwinding', description: 'Whales are rapidly reducing ETH/BTC long positions' },
    NEUTRAL: { label: 'No signal', description: 'ETH/BTC position changes are insignificant' },
    title: 'ETH/BTC Phase',
    caution: 'Caution',
    tooltip: 'Build/unwind rhythm of ETH/BTC long positions. Rapid unwinding often corresponds to local tops.',
    currentPosition: 'Current position',
    duration: 'Duration',
    days: 'days',
  },
  zh: {
    BUILD: { label: '建仓中', description: '巨鲸正在缓慢建立 ETH/BTC 多头仓位' },
    UNWIND: { label: '平仓中', description: '巨鲸正在快速减少 ETH/BTC 多头仓位' },
    NEUTRAL: { label: '无信号', description: 'ETH/BTC 仓位变化不明显' },
    title: 'ETH/BTC 节奏',
    caution: '注意',
    tooltip: 'ETH/BTC 多头仓位的建仓/平仓节奏。快速平仓往往对应阶段性顶部。',
    currentPosition: '当前仓位',
    duration: '持续时间',
    days: '天',
  },
  vi: {
    BUILD: { label: 'Đang xây vị thế', description: 'Cá voi đang từ từ xây dựng vị thế long ETH/BTC' },
    UNWIND: { label: 'Đang đóng vị thế', description: 'Cá voi đang nhanh chóng giảm vị thế long ETH/BTC' },
    NEUTRAL: { label: 'Không tín hiệu', description: 'Thay đổi vị thế ETH/BTC không đáng kể' },
    title: 'Nhịp ETH/BTC',
    caution: 'Chú ý',
    tooltip: 'Nhịp xây/đóng vị thế long ETH/BTC. Đóng nhanh thường tương ứng với đỉnh giai đoạn.',
    currentPosition: 'Vị thế hiện tại',
    duration: 'Thời gian',
    days: 'ngày',
  },
}

export function EthBtcPhaseModule({ longs, phase, phaseDuration }: EthBtcPhaseModuleProps) {
  const { locale } = useI18n()
  const t = copy[locale]
  const phaseConfig = t[phase]

  return (
    <MetricCard
      title={t.title}
      value={phaseConfig.label}
      status={phaseStatusMap[phase]}
      statusLabel={phase === 'UNWIND' ? t.caution : undefined}
      tooltip={t.tooltip}
    >
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.currentPosition}</span>
          <span>{formatNumber(longs)}</span>
        </div>
        {phaseDuration > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.duration}</span>
            <span>{phaseDuration} {t.days}</span>
          </div>
        )}

        {/* 节奏示意图 */}
        <div className="mt-3 h-12 flex items-end gap-0.5">
          {Array.from({ length: 20 }).map((_, i) => {
            const height = phase === 'BUILD'
              ? 30 + i * 2
              : phase === 'UNWIND'
              ? 70 - i * 3
              : 40 + Math.sin(i) * 10

            return (
              <div
                key={i}
                className="flex-1 rounded-t transition-all"
                style={{
                  height: `${Math.max(height, 10)}%`,
                  backgroundColor:
                    phase === 'BUILD'
                      ? '#22c55e'
                      : phase === 'UNWIND'
                      ? '#ef4444'
                      : '#6b7280',
                  opacity: 0.3 + (i / 20) * 0.7,
                }}
              />
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-2">{phaseConfig.description}</p>
      </div>
    </MetricCard>
  )
}

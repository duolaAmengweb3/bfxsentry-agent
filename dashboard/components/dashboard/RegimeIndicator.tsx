'use client'

import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import type { WhaleRegime } from '@/types'

interface RegimeIndicatorProps {
  regime: WhaleRegime
  explanation: string
}

const regimeConfig = {
  accumulation: {
    color: 'bg-green-500',
    textColor: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    pulseClass: 'pulse-green',
  },
  mixed: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    pulseClass: 'pulse-yellow',
  },
  distribution: {
    color: 'bg-red-500',
    textColor: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    pulseClass: 'pulse-red',
  },
}

const regimeLabels = {
  en: { accumulation: 'Accumulation', mixed: 'Mixed / Wait', distribution: 'Distribution' },
  zh: { accumulation: '吸筹阶段', mixed: '观望阶段', distribution: '派发/风险' },
  vi: { accumulation: 'Tích lũy', mixed: 'Quan sát', distribution: 'Phân phối' },
}

export function RegimeIndicator({ regime, explanation }: RegimeIndicatorProps) {
  const { locale } = useI18n()
  const config = regimeConfig[regime]
  const label = regimeLabels[locale][regime]

  return (
    <div
      className={cn(
        'rounded-xl border p-6',
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-center gap-4">
        {/* 状态指示灯 */}
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            config.color,
            config.pulseClass
          )}
        >
          <span className="text-2xl">
            {regime === 'accumulation' && '🐋'}
            {regime === 'mixed' && '⏳'}
            {regime === 'distribution' && '⚠️'}
          </span>
        </div>

        {/* 文字说明 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground">WHALE REGIME</span>
          </div>
          <h2 className={cn('text-2xl font-bold', config.textColor)}>
            {label}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{explanation}</p>
        </div>
      </div>
    </div>
  )
}

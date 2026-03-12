'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import type { WhaleRegime } from '@/types'

interface RegimeIndicatorProProps {
  regime: WhaleRegime
  explanation: string
  confidence?: number
  signals?: {
    name: string
    value: string
    status: 'positive' | 'negative' | 'neutral' | 'warning'
  }[]
}

const regimeIcons = {
  accumulation: TrendingUp,
  mixed: Activity,
  distribution: AlertTriangle,
}

const regimeStyles = {
  accumulation: {
    color: 'green',
    bgGradient: 'from-green-500/20 via-green-500/5 to-transparent',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-500',
    glowColor: 'shadow-green-500/20',
  },
  mixed: {
    color: 'yellow',
    bgGradient: 'from-yellow-500/20 via-yellow-500/5 to-transparent',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-500',
    glowColor: 'shadow-yellow-500/20',
  },
  distribution: {
    color: 'red',
    bgGradient: 'from-red-500/20 via-red-500/5 to-transparent',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-500',
    glowColor: 'shadow-red-500/20',
  },
}

export function RegimeIndicatorPro({
  regime,
  explanation,
  confidence = 75,
  signals = [],
}: RegimeIndicatorProProps) {
  const { locale } = useI18n()

  const copy = {
    en: {
      accumulation: 'Accumulation',
      mixed: 'Mixed / Wait',
      distribution: 'Distribution',
      accumulationDesc: 'Whales are building long positions',
      mixedDesc: 'Mixed signals, wait and observe',
      distributionDesc: 'Risk alert, whales may be distributing',
      live: 'Live',
      signalStrength: 'Signal strength',
    },
    zh: {
      accumulation: '吸筹阶段',
      mixed: '观望阶段',
      distribution: '派发/风险',
      accumulationDesc: '巨鲸正在建立多头仓位',
      mixedDesc: '市场信号混合，保持观望',
      distributionDesc: '注意风险，巨鲸可能在派发',
      live: '实时',
      signalStrength: '信号强度',
    },
    vi: {
      accumulation: 'Tích lũy',
      mixed: 'Quan sát',
      distribution: 'Phân phối',
      accumulationDesc: 'Cá voi đang xây dựng vị thế long',
      mixedDesc: 'Tín hiệu hỗn hợp, chờ quan sát',
      distributionDesc: 'Cảnh báo rủi ro, cá voi có thể đang phân phối',
      live: 'Trực tiếp',
      signalStrength: 'Cường độ tín hiệu',
    },
  }[locale]

  const regimeLabels: Record<WhaleRegime, string> = {
    accumulation: copy.accumulation,
    mixed: copy.mixed,
    distribution: copy.distribution,
  }

  const regimeDescriptions: Record<WhaleRegime, string> = {
    accumulation: copy.accumulationDesc,
    mixed: copy.mixedDesc,
    distribution: copy.distributionDesc,
  }

  const config = regimeStyles[regime]
  const Icon = regimeIcons[regime]
  const [animatedConfidence, setAnimatedConfidence] = useState(0)

  useEffect(() => {
    // 动画显示置信度
    const duration = 1000
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedConfidence(Math.round(confidence * eased))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [confidence])

  return (
    <div
      className={cn(
        'relative rounded-2xl border overflow-hidden',
        config.borderColor
      )}
    >
      {/* 背景渐变 */}
      <div className={cn('absolute inset-0 bg-gradient-to-r', config.bgGradient)} />

      {/* 动态光效 */}
      <div
        className={cn(
          'absolute inset-0 opacity-30',
          regime === 'accumulation' && 'animate-pulse'
        )}
      >
        <div
          className={cn(
            'absolute top-0 left-1/4 w-1/2 h-1/2 rounded-full blur-3xl',
            regime === 'accumulation' && 'bg-green-500/30',
            regime === 'mixed' && 'bg-yellow-500/30',
            regime === 'distribution' && 'bg-red-500/30'
          )}
        />
      </div>

      <div className="relative p-6">
        <div className="flex items-start gap-6">
          {/* 状态图标 */}
          <div
            className={cn(
              'relative w-20 h-20 rounded-2xl flex items-center justify-center',
              'bg-gradient-to-br shadow-lg',
              regime === 'accumulation' && 'from-green-500 to-green-600 shadow-green-500/30',
              regime === 'mixed' && 'from-yellow-500 to-yellow-600 shadow-yellow-500/30',
              regime === 'distribution' && 'from-red-500 to-red-600 shadow-red-500/30'
            )}
          >
            <Icon className="w-10 h-10 text-white" />

            {/* 脉冲环 */}
            <div
              className={cn(
                'absolute inset-0 rounded-2xl animate-ping opacity-30',
                regime === 'accumulation' && 'bg-green-500',
                regime === 'mixed' && 'bg-yellow-500',
                regime === 'distribution' && 'bg-red-500'
              )}
              style={{ animationDuration: '2s' }}
            />
          </div>

          {/* 内容 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Whale Regime
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                {copy.live}
              </span>
            </div>

            <h2 className={cn('text-3xl font-bold mb-2', config.textColor)}>
              {regimeLabels[regime]}
            </h2>

            <p className="text-sm text-muted-foreground mb-4">{explanation}</p>

            {/* 信号列表 */}
            {signals.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {signals.map((signal, index) => (
                  <div
                    key={index}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium border',
                      signal.status === 'positive' &&
                        'bg-green-500/10 border-green-500/30 text-green-500',
                      signal.status === 'negative' &&
                        'bg-red-500/10 border-red-500/30 text-red-500',
                      signal.status === 'warning' &&
                        'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
                      signal.status === 'neutral' &&
                        'bg-muted border-border text-muted-foreground'
                    )}
                  >
                    {signal.name}: {signal.value}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 置信度仪表 */}
          <div className="text-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* 背景圆 */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted"
                />
                {/* 进度圆 */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${animatedConfidence * 2.51} 251`}
                  className={config.textColor}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn('text-2xl font-bold', config.textColor)}>
                  {animatedConfidence}
                </span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{copy.signalStrength}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useI18n } from '@/lib/i18n'
import { formatNumber } from '@/lib/utils'
import { Radar, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SignalDimension {
  name: string
  score: number
  detail: string
}

interface Props {
  score: number
  direction: string
  dimensions: SignalDimension[]
  btcPrice: number
}

function DimensionCard({ dim }: { dim: SignalDimension }) {
  const pct = (dim.score / 25) * 100
  const color =
    dim.score >= 18
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : dim.score >= 12
      ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
      : 'text-red-400 border-red-500/30 bg-red-500/10'

  return (
    <div className={`rounded-xl border p-3 ${color}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium opacity-90">{dim.name}</span>
        <span className="text-xs font-mono font-bold">{dim.score}/25</span>
      </div>
      <div className="h-1 rounded-full bg-white/10 mb-2">
        <div
          className="h-full rounded-full bg-current transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] opacity-80 leading-relaxed">{dim.detail}</p>
    </div>
  )
}

export function SignalGauge({ score, direction, dimensions, btcPrice }: Props) {
  const { locale } = useI18n()
  const copy = {
    en: { title: 'Smart money composite signal', bearish: 'Bearish', bullish: 'Bullish' },
    zh: { title: '聪明钱综合信号', bearish: '看空', bullish: '看多' },
    vi: { title: 'Tín hiệu tổng hợp smart money', bearish: 'Giảm', bullish: 'Tăng' },
  }[locale]
  // Gauge position: score 0-100 maps to gauge width
  const gaugePos = score

  const dirColor =
    score >= 60
      ? 'text-emerald-400'
      : score >= 40
      ? 'text-yellow-400'
      : 'text-red-400'

  const DirIcon =
    score >= 60 ? TrendingUp : score <= 40 ? TrendingDown : Minus

  const bgGradient =
    score >= 60
      ? 'from-emerald-500/10 via-card/80 to-card/60'
      : score <= 40
      ? 'from-red-500/10 via-card/80 to-card/60'
      : 'from-yellow-500/10 via-card/80 to-card/60'

  return (
    <div
      className={`rounded-2xl border border-border/60 bg-gradient-to-br ${bgGradient} p-6 relative overflow-hidden`}
    >
      {/* Background glow */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 rounded-full blur-3xl opacity-20 ${
          score >= 60 ? 'bg-emerald-500' : score <= 40 ? 'bg-red-500' : 'bg-yellow-500'
        }`}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-primary" />
            <span className="font-semibold">{copy.title}</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            BTC ${formatNumber(btcPrice)}
          </span>
        </div>

        {/* Gauge bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>◀ {copy.bearish}</span>
            <span>{copy.bullish} ▶</span>
          </div>
          <div className="relative h-3 rounded-full bg-gradient-to-r from-red-500/30 via-yellow-500/30 to-emerald-500/30">
            {/* Center mark */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
            {/* Indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg transition-all duration-700"
              style={{
                left: `calc(${gaugePos}% - 10px)`,
                backgroundColor:
                  score >= 60
                    ? '#22c55e'
                    : score <= 40
                    ? '#ef4444'
                    : '#eab308',
                boxShadow: `0 0 12px ${
                  score >= 60
                    ? 'rgba(34,197,94,0.5)'
                    : score <= 40
                    ? 'rgba(239,68,68,0.5)'
                    : 'rgba(234,179,8,0.5)'
                }`,
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">0</span>
            <span className="text-xs text-muted-foreground">50</span>
            <span className="text-xs text-muted-foreground">100</span>
          </div>
        </div>

        {/* Direction & Score */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <DirIcon className={`w-6 h-6 ${dirColor}`} />
          <span className={`text-2xl font-bold ${dirColor}`}>{direction}</span>
          <span className="text-sm text-muted-foreground font-mono">
            {score}/100
          </span>
        </div>

        {/* 4 dimension cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {dimensions.map((dim) => (
            <DimensionCard key={dim.name} dim={dim} />
          ))}
        </div>
      </div>
    </div>
  )
}

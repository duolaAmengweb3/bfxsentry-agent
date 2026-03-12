'use client'

import { useI18n } from '@/lib/i18n'
import { formatNumber } from '@/lib/utils'
import { ChevronDown, ChevronUp, Minus } from 'lucide-react'

interface WhaleDirection {
  username: string
  currentPnl: number
  pnlChange3h: number
  correlation: number
  direction: 'long' | 'short' | 'hedge'
  confidence: number
  dataPoints: number
}

interface Props {
  whales: WhaleDirection[]
}

function DirectionBadge({ direction }: { direction: string }) {
  const { locale } = useI18n()
  const copy = {
    en: { long: 'Long', short: 'Short', hedge: 'Hedge' },
    zh: { long: '做多', short: '做空', hedge: '对冲' },
    vi: { long: 'Long', short: 'Short', hedge: 'Hedge' },
  }[locale]
  if (direction === 'long') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <ChevronUp className="w-3 h-3" />
        {copy.long}
      </span>
    )
  }
  if (direction === 'short') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30">
        <ChevronDown className="w-3 h-3" />
        {copy.short}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-muted/40 text-muted-foreground border border-border/60">
      <Minus className="w-3 h-3" />
      {copy.hedge}
    </span>
  )
}

function CorrelationBar({ value }: { value: number }) {
  // -1 to +1 → 0% to 100%
  const pos = ((value + 1) / 2) * 100
  const color =
    value > 0.4
      ? 'bg-emerald-400'
      : value < -0.4
      ? 'bg-red-400'
      : 'bg-yellow-400'

  return (
    <div className="w-16 h-1.5 rounded-full bg-muted/40 relative">
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
      <div
        className={`absolute top-0 h-full w-2 rounded-full ${color} transition-all duration-500`}
        style={{ left: `calc(${pos}% - 4px)` }}
      />
    </div>
  )
}

export function WhaleDirectionTable({ whales }: Props) {
  const { locale } = useI18n()
  const copy = {
    en: { title: 'Whale direction details', long: 'Long', short: 'Short', users: 'User', pnl: 'PnL size', change3h: '3h change', corr: 'Correlation', dir: 'Direction', disclaimer: 'Direction is inferred from the Pearson correlation between PnL changes and BTC price changes. It is not actual position data.' },
    zh: { title: '大户方向明细', long: '做多', short: '做空', users: '用户', pnl: '浮盈规模', change3h: '3h 变动', corr: '相关性', dir: '方向', disclaimer: '方向基于浮盈变动与 BTC 价格变动的皮尔逊相关系数推断（>0.4 做多 / <-0.4 做空），非实际持仓数据。对冲/套利仓位可能导致误判。' },
    vi: { title: 'Chi tiết hướng đi của cá voi', long: 'Long', short: 'Short', users: 'Người dùng', pnl: 'Quy mô PnL', change3h: 'Biến động 3h', corr: 'Tương quan', dir: 'Hướng', disclaimer: 'Hướng đi được suy ra từ tương quan Pearson giữa biến động PnL và biến động giá BTC, không phải dữ liệu vị thế thực.' },
  }[locale]
  const longWhales = whales.filter((w) => w.direction === 'long')
  const shortWhales = whales.filter((w) => w.direction === 'short')
  const totalLongPnl = longWhales.reduce(
    (s, w) => s + Math.abs(w.currentPnl),
    0
  )
  const totalShortPnl = shortWhales.reduce(
    (s, w) => s + Math.abs(w.currentPnl),
    0
  )

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <span className="text-sm font-semibold">{copy.title}</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-400">
            {copy.long} {longWhales.length} · ${formatNumber(totalLongPnl)}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-red-400">
            {copy.short} {shortWhales.length} · ${formatNumber(totalShortPnl)}
          </span>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_100px_110px_70px_60px] gap-2 px-4 py-2 border-b border-border/30 text-[11px] text-muted-foreground uppercase tracking-wider">
        <span>{copy.users}</span>
        <span className="text-right">{copy.pnl}</span>
        <span className="text-right">{copy.change3h}</span>
        <span className="text-center">{copy.corr}</span>
        <span className="text-center">{copy.dir}</span>
      </div>

      {/* Table body */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-border/20">
        {whales.map((whale) => (
          <div
            key={whale.username}
            className="grid grid-cols-[1fr_100px_110px_70px_60px] gap-2 px-4 py-2.5 hover:bg-muted/20 transition-colors items-center"
          >
            <div className="flex items-center gap-2 min-w-0">
              {Math.abs(whale.currentPnl) > 1000000 && (
                <span className="text-sm shrink-0">🐋</span>
              )}
              <span className="text-sm truncate">{whale.username}</span>
            </div>
            <span
              className={`text-sm font-mono text-right ${
                whale.currentPnl >= 0
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              ${formatNumber(Math.abs(whale.currentPnl))}
            </span>
            <span
              className={`text-sm font-mono text-right ${
                whale.pnlChange3h >= 0
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {whale.pnlChange3h >= 0 ? '+' : ''}${formatNumber(whale.pnlChange3h)}
            </span>
            <div className="flex justify-center">
              <CorrelationBar value={whale.correlation} />
            </div>
            <div className="flex justify-center">
              <DirectionBadge direction={whale.direction} />
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-2.5 border-t border-border/40 bg-muted/10">
        <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
          {copy.disclaimer}
        </p>
      </div>
    </div>
  )
}

'use client'

import { useI18n } from '@/lib/i18n'
import { formatNumber } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface TimelineEvent {
  timestamp: number
  btcPrice: number
  signal: number
  direction: string
  trigger: string
}

interface Props {
  events: TimelineEvent[]
}

export function SignalTimeline({ events }: Props) {
  const { locale } = useI18n()
  const copy = {
    en: { title: 'Signal timeline', refresh: 'Updated every 3h', change: 'Signal change', bullish: 'Bullish', bearish: 'Bearish', neutral: 'Neutral' },
    zh: { title: '信号时间线', refresh: '每 3h 更新', change: '信号变化', bullish: '偏多', bearish: '偏空', neutral: '中性' },
    vi: { title: 'Dòng thời gian tín hiệu', refresh: 'Cập nhật mỗi 3h', change: 'Thay đổi tín hiệu', bullish: 'Bullish', bearish: 'Bearish', neutral: 'Trung tính' },
  }[locale]
  if (events.length === 0) return null

  // Detect signal changes for highlighting
  const isSignalChange = (idx: number) => {
    if (idx >= events.length - 1) return false
    return events[idx].direction !== events[idx + 1].direction
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">{copy.title}</span>
        <span className="text-xs text-muted-foreground ml-auto">{copy.refresh}</span>
      </div>

      <div className="max-h-[380px] overflow-y-auto">
        {events.map((event, idx) => {
          const dt = new Date(event.timestamp)
          const timeStr = `${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
            dt.getDate()
          ).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(
            dt.getMinutes()
          ).padStart(2, '0')}`

          const changed = isSignalChange(idx)
          const prevDir = idx < events.length - 1 ? events[idx + 1].direction : ''

          const dotColor =
            event.direction === '偏多' || event.direction === 'Bullish'
              ? 'bg-emerald-400 shadow-emerald-400/50'
              : event.direction === '偏空' || event.direction === 'Bearish'
              ? 'bg-red-400 shadow-red-400/50'
              : 'bg-yellow-400 shadow-yellow-400/50'

          const signalColor =
            event.signal > 30
              ? 'text-emerald-400'
              : event.signal < -30
              ? 'text-red-400'
              : 'text-yellow-400'

          return (
            <div
              key={event.timestamp}
              className={`relative flex gap-3 px-4 py-3 ${
                changed ? 'bg-primary/5' : 'hover:bg-muted/20'
              } transition-colors`}
            >
              {/* Timeline line */}
              <div className="flex flex-col items-center shrink-0 w-4">
                <div
                  className={`w-3 h-3 rounded-full ${dotColor} ${
                    changed ? 'shadow-lg ring-2 ring-white/20' : ''
                  }`}
                />
                {idx < events.length - 1 && (
                  <div className="w-px flex-1 bg-border/40 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {timeStr}
                    </span>
                    {changed && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                        {copy.change}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    BTC ${formatNumber(event.btcPrice)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-semibold ${signalColor}`}>
                    {event.direction}
                  </span>
                  <span className={`text-xs font-mono ${signalColor}`}>
                    ({event.signal > 0 ? '+' : ''}
                    {event.signal})
                  </span>
                  {changed && prevDir && (
                    <span className="text-xs text-muted-foreground">
                      ← {prevDir}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {event.trigger}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface Signal {
  id: string
  name: string
  level: 'green' | 'yellow' | 'red'
  evidence: string[]
  action?: string
  actionTrader?: string
  actionFunder?: string
  ttlMinutes?: number
  ttlSeconds?: number
}

export function SignalCard({ signal }: { signal: Signal }) {
  const { locale } = useI18n()
  const borderColor =
    signal.level === 'red'
      ? 'border-red-500/40'
      : signal.level === 'yellow'
      ? 'border-yellow-500/40'
      : 'border-emerald-500/40'

  const bgColor =
    signal.level === 'red'
      ? 'bg-red-500/5'
      : signal.level === 'yellow'
      ? 'bg-yellow-500/5'
      : 'bg-emerald-500/5'

  const Icon =
    signal.level === 'red'
      ? AlertTriangle
      : signal.level === 'yellow'
      ? Info
      : CheckCircle

  const iconColor =
    signal.level === 'red'
      ? 'text-red-400'
      : signal.level === 'yellow'
      ? 'text-yellow-400'
      : 'text-emerald-400'

  const ttl = signal.ttlMinutes
    ? `${signal.ttlMinutes}min`
    : signal.ttlSeconds
    ? `${signal.ttlSeconds}s`
    : ''

  const labels = {
    en: { ttl: 'TTL', advice: 'Advice', trader: 'Trader', funder: 'Funding user' },
    zh: { ttl: 'TTL', advice: '建议', trader: '交易员', funder: '融资用户' },
    vi: { ttl: 'TTL', advice: 'Khuyến nghị', trader: 'Trader', funder: 'Người dùng funding' },
  }[locale]

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">{signal.name}</span>
            {ttl && (
              <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                {labels.ttl} {ttl}
              </span>
            )}
          </div>

          {/* Evidence */}
          <div className="space-y-1 mb-3">
            {signal.evidence.map((e, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <span className="shrink-0 mt-0.5">·</span>
                <span>{e}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          {signal.action && (
            <div className="rounded-lg bg-muted/30 px-3 py-2 text-xs">
              <span className="text-muted-foreground">{labels.advice}: </span>
              <span>{signal.action}</span>
            </div>
          )}
          {signal.actionTrader && (
            <div className="space-y-1.5">
              <div className="rounded-lg bg-muted/30 px-3 py-2 text-xs">
                <span className="text-muted-foreground">{labels.trader}: </span>
                <span>{signal.actionTrader}</span>
              </div>
              {signal.actionFunder && (
                <div className="rounded-lg bg-muted/30 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">{labels.funder}: </span>
                  <span>{signal.actionFunder}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function StatusLight({ level, label }: { level: 'green' | 'yellow' | 'red'; label: string }) {
  const color =
    level === 'red'
      ? 'bg-red-500 shadow-red-500/50'
      : level === 'yellow'
      ? 'bg-yellow-500 shadow-yellow-500/50'
      : 'bg-emerald-500 shadow-emerald-500/50'

  const text =
    level === 'red'
      ? 'text-red-400'
      : level === 'yellow'
      ? 'text-yellow-400'
      : 'text-emerald-400'

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color} shadow-lg animate-pulse`} />
      <span className={`text-sm font-medium ${text}`}>{label}</span>
    </div>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { useRef, useEffect } from 'react'
import { formatNumber } from '@/lib/utils'
import { SignalHero } from '@/components/trading/TradingWidgets'
import { Gauge, TrendingUp } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export function FundingRadar() {
  const { locale, localeTag } = useI18n()
  const { data, isLoading, error } = useQuery({
    queryKey: ['funding-radar', locale],
    queryFn: () => fetch(`/api/funding-radar?locale=${locale}`).then((r) => r.json()),
    refetchInterval: 60 * 1000,
  })
  const copy = {
    en: {
      loading: 'Loading funding data...',
      failed: 'Failed to load data',
      title: 'Funding market data',
      frr: 'FRR (daily)',
      annualized: 'Annualized',
      utilization: 'Utilization',
      percentile: '7d rate percentile',
      perp: 'Perp funding',
      longsPay: 'Longs pay',
      shortsPay: 'Shorts pay',
      totalSupply: 'Total supply',
      borrowed: 'Borrowed',
      avgPeriod: 'Average term',
      days: 'days',
      rateChange1h: '1h rate change',
      chart: 'Rates & utilization (3d)',
      utilLabel: 'Utilization',
    },
    zh: {
      loading: '加载融资数据...',
      failed: '数据加载失败',
      title: '融资市场数据',
      frr: 'FRR (日利率)',
      annualized: '年化',
      utilization: '资金利用率',
      percentile: '7天利率分位',
      perp: '永续资金费率',
      longsPay: '多头付费',
      shortsPay: '空头付费',
      totalSupply: '总供给',
      borrowed: '已借出',
      avgPeriod: '平均期限',
      days: '天',
      rateChange1h: '1h 利率变化',
      chart: '利率 & 利用率 (3天)',
      utilLabel: '利用率',
    },
    vi: {
      loading: 'Đang tải dữ liệu funding...',
      failed: 'Tải dữ liệu thất bại',
      title: 'Dữ liệu thị trường funding',
      frr: 'FRR (hàng ngày)',
      annualized: 'Thường niên',
      utilization: 'Mức sử dụng',
      percentile: 'Phân vị lãi suất 7 ngày',
      perp: 'Funding perp',
      longsPay: 'Long trả phí',
      shortsPay: 'Short trả phí',
      totalSupply: 'Tổng cung',
      borrowed: 'Đã vay',
      avgPeriod: 'Kỳ hạn trung bình',
      days: 'ngày',
      rateChange1h: 'Biến động 1h',
      chart: 'Lãi suất & mức sử dụng (3 ngày)',
      utilLabel: 'Mức sử dụng',
    },
  }[locale]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">{copy.loading}</span>
        </div>
      </div>
    )
  }

  if (error || !data?.success) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
        {copy.failed}: {data?.error || 'Network error'}
      </div>
    )
  }

  const { recommendation, current, percentiles, changes, derivFunding, history } = data.data

  return (
    <div className="space-y-4">
      {/* ── SIGNAL (the hero) ── */}
      <SignalHero
        action={recommendation.action}
        name={recommendation.name}
        confidence={recommendation.confidence}
        reasoning={recommendation.reasoning}
        conditions={recommendation.conditions}
        advice={recommendation.advice}
        operations={recommendation.operations}
      />

      {/* ── Supporting data ── */}
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-5">
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{copy.title}</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric label={copy.frr} value={`${(current.frr * 100).toFixed(6)}%`} sub={`${copy.annualized} ${current.frrAnnualized.toFixed(2)}%`} />
          <Metric
            label={copy.utilization}
            value={`${(current.utilization * 100).toFixed(1)}%`}
            color={current.utilization > 0.9 ? 'red' : current.utilization > 0.7 ? 'yellow' : 'green'}
            bar={current.utilization}
          />
          <Metric
            label={copy.percentile}
            value={`P${(percentiles.rate7d * 100).toFixed(0)}`}
            color={percentiles.rate7d > 0.9 ? 'red' : percentiles.rate7d > 0.5 ? 'yellow' : 'green'}
          />
          <Metric
            label={copy.perp}
            value={`${(derivFunding.rate * 100).toFixed(4)}%`}
            sub={`${copy.annualized} ${derivFunding.annualized.toFixed(1)}% · ${derivFunding.rate >= 0 ? copy.longsPay : copy.shortsPay}`}
          />
        </div>

        <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">{copy.totalSupply}</span>
            <div className="font-mono">${formatNumber(current.totalAmount)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">{copy.borrowed}</span>
            <div className="font-mono">${formatNumber(current.usedAmount)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">{copy.avgPeriod}</span>
            <div className="font-mono">{current.avgPeriod.toFixed(0)} {copy.days}</div>
          </div>
          <div>
            <span className="text-muted-foreground">{copy.rateChange1h}</span>
            <div className="font-mono">{(changes.rateChange1h * 100).toFixed(2)}%</div>
          </div>
        </div>
      </div>

      {/* ── Trend chart ── */}
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{copy.chart}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary rounded" />FRR</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-400 rounded" />{copy.utilLabel}</span>
          </div>
        </div>
        <div className="p-4">
          <FundingChart data={history} localeTag={localeTag} />
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, sub, color, bar }: {
  label: string; value: string; sub?: string; color?: 'red' | 'yellow' | 'green'; bar?: number
}) {
  const c = color === 'red' ? 'text-red-400' : color === 'yellow' ? 'text-yellow-400' : color === 'green' ? 'text-emerald-400' : ''
  const bc = color === 'red' ? 'bg-red-500' : color === 'yellow' ? 'bg-yellow-500' : 'bg-emerald-500'
  return (
    <div className="rounded-lg border border-border/40 p-3">
      <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
      <div className={`text-lg font-bold font-mono ${c}`}>{value}</div>
      {bar !== undefined && (
        <div className="h-1 rounded-full bg-muted/40 mt-1.5 overflow-hidden">
          <div className={`h-full rounded-full ${bc}`} style={{ width: `${bar * 100}%` }} />
        </div>
      )}
      {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  )
}

function FundingChart({ data, localeTag }: { data: { ts: number; frr: number; util: number }[]; localeTag: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const W = rect.width, H = rect.height
    const P = { l: 50, r: 50, t: 10, b: 25 }
    const cW = W - P.l - P.r, cH = H - P.t - P.b
    ctx.clearRect(0, 0, W, H)
    const rates = data.map((d) => d.frr), utils = data.map((d) => d.util)
    const rMin = Math.min(...rates) * 0.95, rMax = Math.max(...rates) * 1.05
    const uMin = Math.min(...utils) * 0.98, uMax = Math.min(1, Math.max(...utils) * 1.02)
    const x = (i: number) => P.l + (i / (data.length - 1)) * cW
    const yR = (v: number) => P.t + (1 - (v - rMin) / (rMax - rMin || 1)) * cH
    const yU = (v: number) => P.t + (1 - (v - uMin) / (uMax - uMin || 1)) * cH
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    for (let i = 0; i <= 4; i++) { const y = P.t + (cH / 4) * i; ctx.beginPath(); ctx.moveTo(P.l, y); ctx.lineTo(W - P.r, y); ctx.stroke() }
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.beginPath()
    data.forEach((d, i) => { i === 0 ? ctx.moveTo(x(i), yU(d.util)) : ctx.lineTo(x(i), yU(d.util)) }); ctx.stroke()
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.shadowColor = '#3b82f6'; ctx.shadowBlur = 4; ctx.beginPath()
    data.forEach((d, i) => { i === 0 ? ctx.moveTo(x(i), yR(d.frr)) : ctx.lineTo(x(i), yR(d.frr)) }); ctx.stroke(); ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '10px monospace'
    ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) { const v = rMax - ((rMax - rMin) / 4) * i; ctx.fillText((v * 100).toFixed(5) + '%', P.l - 4, P.t + (cH / 4) * i + 3) }
    ctx.textAlign = 'left'
    for (let i = 0; i <= 4; i++) { const v = uMax - ((uMax - uMin) / 4) * i; ctx.fillText((v * 100).toFixed(0) + '%', W - P.r + 4, P.t + (cH / 4) * i + 3) }
    ctx.textAlign = 'center'; const step = Math.max(1, Math.floor(data.length / 6))
    for (let i = 0; i < data.length; i += step) { const dt = new Date(data[i].ts); ctx.fillText(new Intl.DateTimeFormat(localeTag, { month: '2-digit', day: '2-digit', hour: '2-digit' }).format(dt), x(i), H - 6) }
  }, [data])
  return <canvas ref={canvasRef} className="w-full" style={{ height: 180 }} />
}

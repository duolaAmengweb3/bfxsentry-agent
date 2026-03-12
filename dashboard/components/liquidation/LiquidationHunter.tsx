'use client'

import { useQuery } from '@tanstack/react-query'
import { useRef, useEffect } from 'react'
import { formatNumber } from '@/lib/utils'
import { SignalHero } from '@/components/trading/TradingWidgets'
import { Crosshair, Clock } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export function LiquidationHunter() {
  const { locale } = useI18n()
  const { data, isLoading, error } = useQuery({
    queryKey: ['liquidation-hunter', locale],
    queryFn: () => fetch(`/api/liquidation-hunter?locale=${locale}`).then((r) => r.json()),
    refetchInterval: 30 * 1000,
  })
  const copy = {
    en: { loading: 'Loading liquidation data...', failed: 'Failed to load data', title: 'Liquidation data', intensity: 'Intensity', longLiq: 'Long liquidations', shortLiq: 'Short liquidations', reaction: 'Price reaction after major liquidation', after: 'after', timeline: '24h liquidation timeline', recent: 'Recent liquidations', entries: 'entries' },
    zh: { loading: '加载爆仓数据...', failed: '数据加载失败', title: '爆仓数据', intensity: '强度', longLiq: '多头清算', shortLiq: '空头清算', reaction: '大额爆仓后价格反应', after: '后', timeline: '24h 爆仓时间线', recent: '最近爆仓', entries: '笔' },
    vi: { loading: 'Đang tải dữ liệu thanh lý...', failed: 'Tải dữ liệu thất bại', title: 'Dữ liệu thanh lý', intensity: 'Cường độ', longLiq: 'Thanh lý long', shortLiq: 'Thanh lý short', reaction: 'Phản ứng giá sau thanh lý lớn', after: 'sau', timeline: 'Dòng thời gian thanh lý 24h', recent: 'Thanh lý gần đây', entries: 'mục' },
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

  const { recommendation, windows, intensity, priceReaction, btcPrice, timeline, recentLiqs, totalCount24h } = data.data
  const { w5m, w15m, w1h, w24h } = windows

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{copy.title}</span>
            <span className="text-xs text-muted-foreground font-mono">BTC ${formatNumber(btcPrice)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{copy.intensity}</span>
            <span className={`text-xs font-mono font-bold ${intensity.percentile > 0.90 ? 'text-red-400' : intensity.percentile > 0.70 ? 'text-yellow-400' : 'text-emerald-400'}`}>
              P{(intensity.percentile * 100).toFixed(0)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
            <div className="text-[10px] text-red-400 mb-2">{copy.longLiq} (Long)</div>
            <div className="grid grid-cols-2 gap-2">
              {[{ l: '5m', v: w5m.longUsd }, { l: '15m', v: w15m.longUsd }, { l: '1h', v: w1h.longUsd }, { l: '24h', v: w24h.longUsd }].map((d) => (
                <div key={d.l}>
                  <div className="text-[10px] text-muted-foreground">{d.l}</div>
                  <div className="text-xs font-mono font-bold text-red-400">${formatNumber(d.v)}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="text-[10px] text-emerald-400 mb-2">{copy.shortLiq} (Short)</div>
            <div className="grid grid-cols-2 gap-2">
              {[{ l: '5m', v: w5m.shortUsd }, { l: '15m', v: w15m.shortUsd }, { l: '1h', v: w1h.shortUsd }, { l: '24h', v: w24h.shortUsd }].map((d) => (
                <div key={d.l}>
                  <div className="text-[10px] text-muted-foreground">{d.l}</div>
                  <div className="text-xs font-mono font-bold text-emerald-400">${formatNumber(d.v)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {priceReaction && (
          <div className="rounded-lg border border-border/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{copy.reaction}</span>
              <span className={`text-sm font-mono font-bold ${priceReaction.reaction >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(priceReaction.reaction * 100).toFixed(2)}%
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {priceReaction.liqSide === 'long' ? 'Long' : 'Short'} ${formatNumber(priceReaction.liqValue)} {copy.after}
            </div>
          </div>
        )}
      </div>

      {/* ── Timeline chart ── */}
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{copy.timeline}</span>
          </div>
          <span className="text-xs text-muted-foreground">{totalCount24h} {copy.entries}</span>
        </div>
        <div className="p-4">
          <LiqTimeline data={timeline} />
        </div>
      </div>

      {/* ── Recent liquidations ── */}
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40">
          <span className="text-sm font-semibold">{copy.recent}</span>
        </div>
        <div className="divide-y divide-border/20 max-h-[200px] overflow-y-auto">
          {recentLiqs.map((l: any, i: number) => {
            const dt = new Date(l.timestamp)
            return (
              <div key={i} className="grid grid-cols-[70px_1fr_70px_70px] gap-2 px-4 py-1.5 text-xs hover:bg-muted/20">
                <span className="text-muted-foreground font-mono">
                  {String(dt.getHours()).padStart(2, '0')}:{String(dt.getMinutes()).padStart(2, '0')}:{String(dt.getSeconds()).padStart(2, '0')}
                </span>
                <span className="truncate">{l.symbol}</span>
                <span className={l.side === 'long' ? 'text-red-400' : 'text-emerald-400'}>
                  {l.side === 'long' ? 'Long' : 'Short'}
                </span>
                <span className="text-right font-mono">${formatNumber(l.usdValue)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LiqTimeline({ data }: { data: { ts: number; longUsd: number; shortUsd: number }[] }) {
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
    const P = { l: 50, r: 10, t: 10, b: 25 }
    const cW = W - P.l - P.r, cH = H - P.t - P.b
    ctx.clearRect(0, 0, W, H)
    const maxVal = Math.max(...data.map((d) => Math.max(d.longUsd, d.shortUsd)), 1)
    const barW = Math.max(1, cW / data.length - 1)
    data.forEach((d, i) => {
      const x = P.l + (i / data.length) * cW
      if (d.longUsd > 0) { const h = (d.longUsd / maxVal) * (cH / 2); ctx.fillStyle = 'rgba(239,68,68,0.7)'; ctx.fillRect(x, P.t + cH / 2, barW, h) }
      if (d.shortUsd > 0) { const h = (d.shortUsd / maxVal) * (cH / 2); ctx.fillStyle = 'rgba(34,197,94,0.7)'; ctx.fillRect(x, P.t + cH / 2 - h, barW, h) }
    })
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.moveTo(P.l, P.t + cH / 2); ctx.lineTo(W - P.r, P.t + cH / 2); ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '10px monospace'
    ctx.textAlign = 'right'; ctx.fillText('Short↑', P.l - 4, P.t + 10); ctx.fillText('Long↓', P.l - 4, H - P.b - 2)
    ctx.textAlign = 'center'; const step = Math.max(1, Math.floor(data.length / 6))
    for (let i = 0; i < data.length; i += step) { const dt = new Date(data[i].ts); ctx.fillText(`${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`, P.l + (i / data.length) * cW + barW / 2, H - 6) }
  }, [data])
  return <canvas ref={canvasRef} className="w-full" style={{ height: 160 }} />
}

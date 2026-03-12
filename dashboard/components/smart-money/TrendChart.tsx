'use client'

import { useI18n } from '@/lib/i18n'
import { useRef, useEffect } from 'react'
import { formatNumber } from '@/lib/utils'

interface TrendPoint {
  timestamp: number
  btcPrice: number
  longPnl: number
  shortPnl: number
  whaleCount: number
}

interface Props {
  data: TrendPoint[]
}

export function TrendChart({ data }: Props) {
  const { locale } = useI18n()
  const copy = {
    en: { title: 'Long/short strength trend', long: 'Long-side PnL', short: 'Short-side PnL', price: 'BTC price', latest: 'Latest snapshot', whales: 'traders' },
    zh: { title: '多空力量趋势', long: '做多阵营浮盈', short: '做空阵营浮盈', price: 'BTC 价格', latest: '最新快照', whales: '位交易者' },
    vi: { title: 'Xu hướng sức mạnh long/short', long: 'PnL phe long', short: 'PnL phe short', price: 'Giá BTC', latest: 'Ảnh chụp mới nhất', whales: 'trader' },
  }[locale]
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const W = rect.width
    const H = rect.height
    const PAD_L = 60
    const PAD_R = 60
    const PAD_T = 20
    const PAD_B = 30
    const chartW = W - PAD_L - PAD_R
    const chartH = H - PAD_T - PAD_B

    // Clear
    ctx.clearRect(0, 0, W, H)

    // Compute ranges
    const btcPrices = data.map((d) => d.btcPrice).filter((p) => p > 0)
    const longPnls = data.map((d) => d.longPnl)
    const shortPnls = data.map((d) => d.shortPnl)
    const allPnl = [...longPnls, ...shortPnls]

    const btcMin = Math.min(...btcPrices) * 0.999
    const btcMax = Math.max(...btcPrices) * 1.001
    const pnlMin = Math.min(...allPnl)
    const pnlMax = Math.max(...allPnl)
    const pnlRange = Math.max(Math.abs(pnlMin), Math.abs(pnlMax)) * 1.1

    const xScale = (i: number) => PAD_L + (i / (data.length - 1)) * chartW
    const btcY = (v: number) =>
      PAD_T + (1 - (v - btcMin) / (btcMax - btcMin)) * chartH
    const pnlY = (v: number) =>
      PAD_T + (1 - (v + pnlRange) / (2 * pnlRange)) * chartH

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = PAD_T + (chartH / 4) * i
      ctx.beginPath()
      ctx.moveTo(PAD_L, y)
      ctx.lineTo(W - PAD_R, y)
      ctx.stroke()
    }

    // BTC price line (gray, background)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    for (let i = 0; i < data.length; i++) {
      if (data[i].btcPrice <= 0) continue
      const x = xScale(i)
      const y = btcY(data[i].btcPrice)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])

    // Long PnL line (green)
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2
    ctx.shadowColor = '#22c55e'
    ctx.shadowBlur = 6
    ctx.beginPath()
    for (let i = 0; i < data.length; i++) {
      const x = xScale(i)
      const y = pnlY(data[i].longPnl)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Green fill
    ctx.shadowBlur = 0
    const longGrad = ctx.createLinearGradient(0, PAD_T, 0, PAD_T + chartH)
    longGrad.addColorStop(0, 'rgba(34,197,94,0.15)')
    longGrad.addColorStop(1, 'rgba(34,197,94,0)')
    ctx.fillStyle = longGrad
    ctx.beginPath()
    for (let i = 0; i < data.length; i++) {
      const x = xScale(i)
      const y = pnlY(data[i].longPnl)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.lineTo(xScale(data.length - 1), pnlY(0))
    ctx.lineTo(xScale(0), pnlY(0))
    ctx.closePath()
    ctx.fill()

    // Short PnL line (red)
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    ctx.shadowColor = '#ef4444'
    ctx.shadowBlur = 6
    ctx.beginPath()
    for (let i = 0; i < data.length; i++) {
      const x = xScale(i)
      const y = pnlY(data[i].shortPnl)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Red fill
    ctx.shadowBlur = 0
    const shortGrad = ctx.createLinearGradient(0, PAD_T, 0, PAD_T + chartH)
    shortGrad.addColorStop(0, 'rgba(239,68,68,0)')
    shortGrad.addColorStop(1, 'rgba(239,68,68,0.15)')
    ctx.fillStyle = shortGrad
    ctx.beginPath()
    for (let i = 0; i < data.length; i++) {
      const x = xScale(i)
      const y = pnlY(data[i].shortPnl)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.lineTo(xScale(data.length - 1), pnlY(0))
    ctx.lineTo(xScale(0), pnlY(0))
    ctx.closePath()
    ctx.fill()

    // Latest points
    const lastIdx = data.length - 1
    // Long dot
    ctx.fillStyle = '#22c55e'
    ctx.shadowColor = '#22c55e'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(xScale(lastIdx), pnlY(data[lastIdx].longPnl), 4, 0, Math.PI * 2)
    ctx.fill()
    // Short dot
    ctx.fillStyle = '#ef4444'
    ctx.shadowColor = '#ef4444'
    ctx.beginPath()
    ctx.arc(xScale(lastIdx), pnlY(data[lastIdx].shortPnl), 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // X-axis time labels
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    const step = Math.max(1, Math.floor(data.length / 6))
    for (let i = 0; i < data.length; i += step) {
      const dt = new Date(data[i].timestamp)
      const label = `${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
        dt.getDate()
      ).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:00`
      ctx.fillText(label, xScale(i), H - 8)
    }

    // Y-axis labels — left: PnL, right: BTC
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    for (let i = 0; i <= 4; i++) {
      const y = PAD_T + (chartH / 4) * i
      const pnlVal = pnlRange - (2 * pnlRange * i) / 4
      ctx.fillText(`$${formatNum(pnlVal)}`, PAD_L - 6, y + 3)
    }

    ctx.textAlign = 'left'
    for (let i = 0; i <= 4; i++) {
      const y = PAD_T + (chartH / 4) * i
      const btcVal = btcMax - ((btcMax - btcMin) * i) / 4
      ctx.fillText(`$${Math.round(btcVal).toLocaleString()}`, W - PAD_R + 6, y + 3)
    }
  }, [data])

  const lastPoint = data[data.length - 1]

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <span className="text-sm font-semibold">{copy.title}</span>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 rounded" />
            {copy.long}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-red-400 rounded" />
            {copy.short}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-white/30" />
            {copy.price}
          </span>
        </div>
      </div>

      <div className="p-4">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: 220 }}
        />
      </div>

      {lastPoint && (
        <div className="px-4 py-2.5 border-t border-border/40 bg-muted/10 flex items-center gap-6 text-xs">
          <span className="text-muted-foreground">{copy.latest}</span>
          <span className="text-emerald-400 font-mono">
            {copy.long} ${formatNumber(lastPoint.longPnl)}
          </span>
          <span className="text-red-400 font-mono">
            {copy.short} ${formatNumber(Math.abs(lastPoint.shortPnl))}
          </span>
          <span className="text-muted-foreground font-mono">
            {lastPoint.whaleCount} {copy.whales}
          </span>
        </div>
      )}
    </div>
  )
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return n.toFixed(0)
}

'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface DataPoint {
  timestamp: number
  value: number
}

interface PositionChartProps {
  data: DataPoint[]
  title: string
  color?: 'green' | 'red' | 'blue'
  height?: number
  showGrid?: boolean
  unit?: string
}

export function PositionChart({
  data,
  title,
  color = 'green',
  height = 120,
  showGrid = true,
  unit = 'BTC',
}: PositionChartProps) {
  const { locale } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labels = {
    en: { ago24h: '24h ago', high: 'High', low: 'Low', now: 'Now' },
    zh: { ago24h: '24h前', high: '最高', low: '最低', now: '现在' },
    vi: { ago24h: '24 giờ trước', high: 'Cao', low: 'Thấp', now: 'Hiện tại' },
  }[locale]

  const { min, max, change, changePerc } = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 0, change: 0, changePerc: 0 }
    const values = data.map((d) => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const first = values[0]
    const last = values[values.length - 1]
    const change = last - first
    const changePerc = (change / first) * 100
    return { min, max, change, changePerc }
  }, [data])

  const colors = {
    green: { line: '#22c55e', fill: 'rgba(34, 197, 94, 0.1)', glow: 'rgba(34, 197, 94, 0.5)' },
    red: { line: '#ef4444', fill: 'rgba(239, 68, 68, 0.1)', glow: 'rgba(239, 68, 68, 0.5)' },
    blue: { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.1)', glow: 'rgba(59, 130, 246, 0.5)' },
  }

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

    const width = rect.width
    const chartHeight = rect.height
    const padding = { top: 10, right: 10, bottom: 20, left: 10 }
    const chartWidth = width - padding.left - padding.right
    const drawHeight = chartHeight - padding.top - padding.bottom

    // Clear
    ctx.clearRect(0, 0, width, chartHeight)

    // Grid lines
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (drawHeight / 4) * i
        ctx.beginPath()
        ctx.moveTo(padding.left, y)
        ctx.lineTo(width - padding.right, y)
        ctx.stroke()
      }
    }

    // Calculate points
    const range = max - min || 1
    const points = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1)) * chartWidth,
      y: padding.top + drawHeight - ((d.value - min) / range) * drawHeight,
    }))

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, chartHeight - padding.bottom)
    gradient.addColorStop(0, colors[color].fill)
    gradient.addColorStop(1, 'transparent')

    ctx.beginPath()
    ctx.moveTo(points[0].x, chartHeight - padding.bottom)
    points.forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.lineTo(points[points.length - 1].x, chartHeight - padding.bottom)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw line with glow
    ctx.shadowColor = colors[color].glow
    ctx.shadowBlur = 8
    ctx.strokeStyle = colors[color].line
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    // Draw last point dot
    ctx.shadowBlur = 0
    const lastPoint = points[points.length - 1]
    ctx.fillStyle = colors[color].line
    ctx.beginPath()
    ctx.arc(lastPoint.x, lastPoint.y, 4, 0, Math.PI * 2)
    ctx.fill()

    // Pulsing outer ring
    ctx.strokeStyle = colors[color].line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(lastPoint.x, lastPoint.y, 8, 0, Math.PI * 2)
    ctx.stroke()

    // Time labels
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'

    // First and last time
    if (data.length > 0) {
      const formatTime = (ts: number) => {
        const d = new Date(ts)
        return `${d.getHours().toString().padStart(2, '0')}:00`
      }
      ctx.fillText(formatTime(data[0].timestamp), padding.left + 20, chartHeight - 4)
      ctx.fillText(
        formatTime(data[data.length - 1].timestamp),
        width - padding.right - 20,
        chartHeight - 4
      )
    }
  }, [data, color, showGrid, min, max])

  const formatValue = (v: number) => {
    if (v >= 1000) return (v / 1000).toFixed(2) + 'K'
    return v.toFixed(2)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold font-mono">
            {formatValue(data[data.length - 1]?.value || 0)}
          </span>
          <span className="text-xs text-muted-foreground">{unit}</span>
          <span
            className={cn(
              'text-xs font-medium',
              changePerc >= 0 ? 'text-green-500' : 'text-red-500'
            )}
          >
            {changePerc >= 0 ? '+' : ''}
            {changePerc.toFixed(2)}%
          </span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height }}
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{labels.ago24h}</span>
        <span>{labels.high}: {formatValue(max)} | {labels.low}: {formatValue(min)}</span>
        <span>{labels.now}</span>
      </div>
    </div>
  )
}

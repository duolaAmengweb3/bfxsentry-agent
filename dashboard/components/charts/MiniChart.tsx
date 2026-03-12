'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface MiniChartProps {
  data: number[]
  width?: number
  height?: number
  color?: 'green' | 'red' | 'blue' | 'auto'
  showGradient?: boolean
  className?: string
}

export function MiniChart({
  data,
  width = 100,
  height = 40,
  color = 'auto',
  showGradient = true,
  className,
}: MiniChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布大小
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // 清除画布
    ctx.clearRect(0, 0, width, height)

    // 计算数据范围
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    // 确定颜色
    let lineColor: string
    let gradientColor: string

    if (color === 'auto') {
      const isUp = data[data.length - 1] >= data[0]
      lineColor = isUp ? '#22c55e' : '#ef4444'
      gradientColor = isUp ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
    } else {
      const colors = {
        green: { line: '#22c55e', gradient: 'rgba(34, 197, 94, 0.2)' },
        red: { line: '#ef4444', gradient: 'rgba(239, 68, 68, 0.2)' },
        blue: { line: '#3b82f6', gradient: 'rgba(59, 130, 246, 0.2)' },
      }
      lineColor = colors[color].line
      gradientColor = colors[color].gradient
    }

    // 计算点位置
    const points = data.map((value, index) => ({
      x: (index / (data.length - 1)) * width,
      y: height - ((value - min) / range) * (height - 4) - 2,
    }))

    // 绘制渐变填充
    if (showGradient) {
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, gradientColor)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.beginPath()
      ctx.moveTo(points[0].x, height)
      points.forEach((point) => ctx.lineTo(point.x, point.y))
      ctx.lineTo(points[points.length - 1].x, height)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()
    }

    // 绘制线条
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y))
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    // 绘制当前点
    const lastPoint = points[points.length - 1]
    ctx.beginPath()
    ctx.arc(lastPoint.x, lastPoint.y, 3, 0, Math.PI * 2)
    ctx.fillStyle = lineColor
    ctx.fill()

    // 绘制光晕效果
    ctx.beginPath()
    ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2)
    ctx.fillStyle = gradientColor
    ctx.fill()
  }, [data, width, height, color, showGradient])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn('block', className)}
      style={{ width, height }}
    />
  )
}

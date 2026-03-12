import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化数字
export function formatNumber(num: number, decimals = 2): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B'
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M'
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K'
  }
  return num.toFixed(decimals)
}

// 格式化价格
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

// 格式化百分比
export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(decimals)}%`
}

// 格式化百分比 (已经是百分比值)
export function formatPercentValue(value: number, decimals = 2): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

// 格式化时间
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化日期时间
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化相对时间
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) {
    return '刚刚'
  }
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  }
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  }
  return `${Math.floor(diff / 86400000)} 天前`
}

// 计算年化收益率
export function annualizeRate(rate: number, periodsPerYear = 3 * 365): number {
  return rate * periodsPerYear
}

// 获取 Regime 颜色
export function getRegimeColor(regime: string): string {
  switch (regime) {
    case 'accumulation':
      return '#22c55e' // green
    case 'mixed':
      return '#eab308' // yellow
    case 'distribution':
      return '#ef4444' // red
    default:
      return '#6b7280' // gray
  }
}

// 获取 Regime 文本
export function getRegimeText(regime: string): string {
  switch (regime) {
    case 'accumulation':
      return '吸筹阶段'
    case 'mixed':
      return '观望阶段'
    case 'distribution':
      return '派发/风险'
    default:
      return '未知'
  }
}

// 获取状态颜色类名
export function getStatusClass(status: 'positive' | 'negative' | 'neutral' | 'warning'): string {
  switch (status) {
    case 'positive':
      return 'text-green-500'
    case 'negative':
      return 'text-red-500'
    case 'warning':
      return 'text-yellow-500'
    default:
      return 'text-muted-foreground'
  }
}

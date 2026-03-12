'use client'

import { useQuery } from '@tanstack/react-query'
import { useI18n } from '@/lib/i18n'
import { SignalGauge } from './SignalGauge'
import { WhaleDirectionTable } from './WhaleDirectionTable'
import { SignalTimeline } from './SignalTimeline'
import { TrendChart } from './TrendChart'
import { formatNumber } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

export function SmartMoneyDashboard() {
  const { locale, localeTag } = useI18n()
  const { data, isLoading, error } = useQuery({
    queryKey: ['smart-money', locale],
    queryFn: () =>
      fetch(`/api/smart-money?locale=${locale}`).then((r) => r.json()),
    refetchInterval: 3 * 60 * 1000, // 3 min
  })
  const copy = {
    en: { loading: 'Analyzing smart money data...', failed: 'Failed to load data', refresh: 'Please check your connection and refresh', notes: 'Data notes', range: 'Data range', disclaimer: 'Signals are based on unrealized P&L snapshots (every 3h) of Bitfinex public leaderboard Top {count} traders, statistically correlated with BTC price movements, reflecting smart money directional bias. There is a 3-hour lag; hedging/arbitrage positions may cause misreadings. This data does not constitute investment advice — for research only · Bitfinex.' },
    zh: { loading: '正在分析聪明钱数据...', failed: '数据加载失败', refresh: '请检查网络连接后刷新', notes: '数据说明', range: '数据范围', disclaimer: '信号基于 Bitfinex 公开排行榜 Top {count} 位交易者的浮盈快照（每 3 小时）与 BTC 价格变动的统计相关性推断，反映聪明钱群体的持仓方向倾向。方向推断存在 3 小时滞后性，对冲/套利仓位可能导致误判。此数据不构成任何投资建议，仅供研究参考 · Bitfinex。' },
    vi: { loading: 'Đang phân tích dữ liệu smart money...', failed: 'Tải dữ liệu thất bại', refresh: 'Hãy kiểm tra kết nối và tải lại', notes: 'Ghi chú dữ liệu', range: 'Phạm vi dữ liệu', disclaimer: 'Tín hiệu dựa trên ảnh chụp lãi chưa thực hiện (mỗi 3 giờ) của Top {count} trader trên bảng xếp hạng công khai Bitfinex, tương quan thống kê với biến động giá BTC. Có độ trễ 3 giờ; vị thế hedge/arbitrage có thể gây sai lệch. Dữ liệu không phải lời khuyên đầu tư — chỉ để nghiên cứu · Bitfinex.' },
  }[locale]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">
            {copy.loading}
          </span>
        </div>
      </div>
    )
  }

  if (error || !data?.success) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-400">
          {copy.failed}: {data?.error || 'Network error'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{copy.refresh}</p>
      </div>
    )
  }

  const {
    signal,
    whales,
    timeline,
    trendData,
    positionSummary,
    fundingRate,
    btcPrice,
    meta,
  } = data.data

  return (
    <div className="space-y-6">
      {/* 区域 1: 信号仪表盘 */}
      <SignalGauge
        score={signal.score}
        direction={signal.direction}
        dimensions={signal.dimensions}
        btcPrice={btcPrice}
      />

      {/* 区域 2 + 3: 大户明细 + 时间线 并列 */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <WhaleDirectionTable whales={whales} />
        </div>
        <div className="xl:col-span-2">
          <SignalTimeline events={timeline} />
        </div>
      </div>

      {/* 区域 4: 趋势图 */}
      <TrendChart data={trendData} />

      {/* 底部声明 */}
      <div className="rounded-xl border border-border/40 bg-muted/10 px-4 py-3">
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
          <span className="font-medium text-muted-foreground">{copy.notes}</span>
          {' · '}
          {copy.disclaimer.replace('{count}', String(meta.whaleCount))}
          {' · '}
          {copy.range}: {meta.snapshotCount} ·
          {new Date(meta.dataRange.from).toLocaleDateString(localeTag)} ~{' '}
          {new Date(meta.dataRange.to).toLocaleDateString(localeTag)}
        </p>
      </div>
    </div>
  )
}

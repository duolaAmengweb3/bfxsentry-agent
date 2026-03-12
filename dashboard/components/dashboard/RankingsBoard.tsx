'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { formatNumber } from '@/lib/utils'
import { useI18n, type Locale } from '@/lib/i18n'
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  Crown,
  Medal,
  Clock,
  Users,
  DollarSign,
  BarChart3,
  Activity,
  Crosshair,
  Zap,
  Gem,
  Flame,
  Target,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────
interface RankingEntry {
  timestamp: number
  username: string
  rank: number
  value: number
  flag: number
}

interface Summary {
  totalValue: number
  topValue: number
  count: number
}

interface RankingsResponse {
  rankings: RankingEntry[]
  summary: Summary
  prevSummary?: Summary
  prevRankings?: RankingEntry[]
  meta: { type: string; timeframe: string }
}

type TabKey = 'plr' | 'plu' | 'plu_diff' | 'vol' | 'efficiency'

// 鲸鱼画像标签
interface WhaleTag {
  label: string
  color: string // tailwind text color
  bg: string // tailwind bg color
  icon: typeof Trophy
}

// ─── Locale-aware Constants ─────────────────────────────────────

function getTabs(locale: Locale): { key: TabKey; label: string; icon: typeof Trophy }[] {
  const labels: Record<Locale, Record<TabKey, string>> = {
    en: { plr: 'Realized P&L', plu: 'Unrealized P&L', plu_diff: 'P&L Surge', efficiency: 'Efficiency', vol: 'Volume' },
    zh: { plr: '已实现利润', plu: '浮盈榜', plu_diff: '浮盈飙升', efficiency: '利润效率', vol: '交易量' },
    vi: { plr: 'Lãi thực hiện', plu: 'Lãi chưa thực hiện', plu_diff: 'Lãi tăng vọt', efficiency: 'Hiệu quả', vol: 'Khối lượng' },
  }
  const l = labels[locale]
  return [
    { key: 'plr', label: l.plr, icon: Wallet },
    { key: 'plu', label: l.plu, icon: TrendingUp },
    { key: 'plu_diff', label: l.plu_diff, icon: ArrowUpRight },
    { key: 'efficiency', label: l.efficiency, icon: Target },
    { key: 'vol', label: l.vol, icon: Activity },
  ]
}

function getTimeframeOptions(locale: Locale): Record<TabKey, { value: string; label: string }[]> {
  const l = {
    en: { weekly: 'Weekly', monthly: 'Monthly', snap3h: '3h snap' },
    zh: { weekly: '周榜', monthly: '月榜', snap3h: '3h 快照' },
    vi: { weekly: 'Tuần', monthly: 'Tháng', snap3h: '3h snap' },
  }[locale]
  return {
    plr: [
      { value: '1w', label: l.weekly },
      { value: '1M', label: l.monthly },
    ],
    plu: [
      { value: '1w', label: l.weekly },
      { value: '3h', label: l.snap3h },
    ],
    plu_diff: [
      { value: '1w', label: l.weekly },
      { value: '3h', label: l.snap3h },
    ],
    vol: [
      { value: '1w', label: l.weekly },
      { value: '1M', label: l.monthly },
    ],
    efficiency: [{ value: '1w', label: l.weekly }],
  }
}

function getTimeframeLabel(locale: Locale): Record<string, string> {
  return {
    en: { '1w': 'This week', '1M': 'This month', '3h': 'Last 3h' },
    zh: { '1w': '本周', '1M': '本月', '3h': '近 3 小时' },
    vi: { '1w': 'Tuần này', '1M': 'Tháng này', '3h': '3h gần đây' },
  }[locale]
}

function getTagDefs(locale: Locale): Record<string, WhaleTag> {
  const l = {
    en: { profit_volume: 'Profit+Volume', long_whale: 'Long Whale', trend_pioneer: 'Trend Pioneer', sharpshooter: 'Sharpshooter', consistent: 'Consistent' },
    zh: { profit_volume: '量利双收', long_whale: '长线巨鲸', trend_pioneer: '趋势先锋', sharpshooter: '精准狙击', consistent: '常驻赢家' },
    vi: { profit_volume: 'Lãi+Khối lượng', long_whale: 'Cá voi dài hạn', trend_pioneer: 'Tiên phong xu hướng', sharpshooter: 'Bắn tỉa chính xác', consistent: 'Chiến thắng liên tục' },
  }[locale]
  return {
    profit_volume: {
      label: l.profit_volume,
      color: 'text-amber-300',
      bg: 'bg-amber-500/15 border-amber-500/30',
      icon: Flame,
    },
    long_whale: {
      label: l.long_whale,
      color: 'text-sky-300',
      bg: 'bg-sky-500/15 border-sky-500/30',
      icon: Gem,
    },
    trend_pioneer: {
      label: l.trend_pioneer,
      color: 'text-violet-300',
      bg: 'bg-violet-500/15 border-violet-500/30',
      icon: Zap,
    },
    sharpshooter: {
      label: l.sharpshooter,
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/15 border-emerald-500/30',
      icon: Crosshair,
    },
    consistent: {
      label: l.consistent,
      color: 'text-rose-300',
      bg: 'bg-rose-500/15 border-rose-500/30',
      icon: Crown,
    },
  }
}

// ─── Hooks ─────────────────────────────────────────────────────
function useRankings(type: string, timeframe: string, withPrev = false) {
  return useQuery<{ success: boolean; data: RankingsResponse }>({
    queryKey: ['rankings', type, timeframe, withPrev],
    queryFn: () =>
      fetch(
        `/api/rankings?type=${type}&timeframe=${timeframe}&limit=25${withPrev ? '&withPrev=1' : ''}`
      ).then((r) => r.json()),
    refetchInterval: 60 * 1000,
  })
}

// ─── Tag computation ───────────────────────────────────────────
function computeWhaleTags(
  plrMap: Map<string, number>,
  pluMap: Map<string, number>,
  diffMap: Map<string, number>,
  volMap: Map<string, number>,
  prevPlrUsers: Set<string>
): Map<string, string[]> {
  const tags = new Map<string, string[]>()
  const allUsers = new Set([
    ...plrMap.keys(),
    ...pluMap.keys(),
    ...diffMap.keys(),
    ...volMap.keys(),
  ])

  for (const user of allUsers) {
    const t: string[] = []
    const inPlr = plrMap.has(user)
    const inPlu = pluMap.has(user)
    const inDiff = diffMap.has(user)
    const inVol = volMap.has(user)

    if (inPlr && inVol) t.push('profit_volume')
    if (inPlr && inPlu) t.push('long_whale')
    if (inPlu && inDiff) t.push('trend_pioneer')
    if (inPlr && inVol) {
      const eff = (plrMap.get(user)! / volMap.get(user)!) * 100
      if (eff > 1) t.push('sharpshooter')
    }
    if (inPlr && prevPlrUsers.has(user)) t.push('consistent')

    if (t.length > 0) tags.set(user, t)
  }

  return tags
}

// ─── 效率数据计算 ──────────────────────────────────────────────
interface EfficiencyEntry extends RankingEntry {
  profit: number
  volume: number
  efficiency: number
}

function computeEfficiency(
  plrRankings: RankingEntry[],
  volRankings: RankingEntry[]
): EfficiencyEntry[] {
  const volMap = new Map(volRankings.map((r) => [r.username, r.value]))

  return plrRankings
    .filter((r) => volMap.has(r.username) && volMap.get(r.username)! > 0)
    .map((r, i) => {
      const vol = volMap.get(r.username)!
      return {
        ...r,
        rank: i + 1,
        profit: r.value,
        volume: vol,
        efficiency: (r.value / vol) * 100,
        value: (r.value / vol) * 100,
      }
    })
    .sort((a, b) => b.efficiency - a.efficiency)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

// ─── 区域 1: 盈利总览横幅 ──────────────────────────────────────
function ProfitBanner({
  plrData,
  pluData,
}: {
  plrData?: RankingsResponse
  pluData?: RankingsResponse
}) {
  const { locale } = useI18n()

  const copy = {
    en: {
      bannerTitle: (n: number) => `This week Top ${n} traders realized total`,
      vsLastWeek: 'vs last week',
      topIndividual: 'Top individual',
      profitable: 'Profitable',
      newFaces: (n: number) => `(${n} new faces)`,
      totalUnrealized: 'Total unrealized',
      lastWeekTotal: (n: number) => `Last week Top ${n} total:`,
      lastWeekTop: 'Last week top:',
      repeat: (n: number) => `Repeat: ${n}`,
      newEntrants: (n: number) => `New: ${n}`,
      updated: 'Updated',
      source: 'Source: Bitfinex API',
      justNow: 'just now',
      minAgo: (n: number) => `${n} min ago`,
      hAgo: (n: number) => `${n}h ago`,
      dAgo: (n: number) => `${n}d ago`,
    },
    zh: {
      bannerTitle: (n: number) => `本周 Top ${n} 交易者已实现利润总计`,
      vsLastWeek: 'vs 上周',
      topIndividual: '最高单人盈利',
      profitable: '盈利人数',
      newFaces: (n: number) => `(${n} 位新面孔)`,
      totalUnrealized: '总持仓浮盈',
      lastWeekTotal: (n: number) => `上周 Top ${n} 总利润:`,
      lastWeekTop: '上周最高:',
      repeat: (n: number) => `连续上榜: ${n} 人`,
      newEntrants: (n: number) => `新上榜: ${n} 人`,
      updated: '数据更新于',
      source: '来源 Bitfinex 官方 API',
      justNow: '刚刚',
      minAgo: (n: number) => `${n} 分钟前`,
      hAgo: (n: number) => `${n} 小时前`,
      dAgo: (n: number) => `${n} 天前`,
    },
    vi: {
      bannerTitle: (n: number) => `Tuần này Top ${n} trader tổng lãi thực hiện`,
      vsLastWeek: 'vs tuần trước',
      topIndividual: 'Lãi cá nhân cao nhất',
      profitable: 'Số người có lãi',
      newFaces: (n: number) => `(${n} gương mặt mới)`,
      totalUnrealized: 'Tổng lãi chưa thực hiện',
      lastWeekTotal: (n: number) => `Tuần trước Top ${n} tổng:`,
      lastWeekTop: 'Tuần trước cao nhất:',
      repeat: (n: number) => `Lặp lại: ${n}`,
      newEntrants: (n: number) => `Mới: ${n}`,
      updated: 'Cập nhật',
      source: 'Nguồn: Bitfinex API',
      justNow: 'Vừa xong',
      minAgo: (n: number) => `${n} phút trước`,
      hAgo: (n: number) => `${n} giờ trước`,
      dAgo: (n: number) => `${n} ngày trước`,
    },
  }[locale]

  const totalRealized = plrData?.summary.totalValue || 0
  const topRealized = plrData?.summary.topValue || 0
  const profitCount = plrData?.summary.count || 0
  const totalUnrealized = pluData?.summary.totalValue || 0
  const updatedAt = plrData?.rankings[0]?.timestamp

  // 周对比
  const prevTotal = plrData?.prevSummary?.totalValue
  const prevTop = plrData?.prevSummary?.topValue
  const prevCount = plrData?.prevSummary?.count
  const totalChange =
    prevTotal && prevTotal > 0
      ? ((totalRealized - prevTotal) / prevTotal) * 100
      : undefined
  const topChange =
    prevTop && prevTop > 0 ? ((topRealized - prevTop) / prevTop) * 100 : undefined

  // 新上榜人数
  const curUsers = new Set(plrData?.rankings.map((r) => r.username) || [])
  const prevUsers = new Set(plrData?.prevRankings?.map((r) => r.username) || [])
  const newFaces = prevUsers.size > 0 ? [...curUsers].filter((u) => !prevUsers.has(u)).length : undefined

  const timeAgo = useMemo(() => {
    if (!updatedAt) return ''
    const diffMin = Math.floor((Date.now() - updatedAt) / 60000)
    if (diffMin < 1) return copy.justNow
    if (diffMin < 60) return copy.minAgo(diffMin)
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return copy.hAgo(diffHour)
    return copy.dAgo(Math.floor(diffHour / 24))
  }, [updatedAt, copy])

  function TrendBadge({ value, suffix = '' }: { value?: number; suffix?: string }) {
    if (value === undefined) return null
    const up = value >= 0
    const Icon = up ? TrendingUp : TrendingDown
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-xs font-mono font-bold ${
          up ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        <Icon className="w-3 h-3" />
        {up ? '+' : ''}
        {value.toFixed(0)}%{suffix}
      </span>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card/80 to-primary/10 p-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <span className="text-sm text-muted-foreground">
            {copy.bannerTitle(profitCount)}
          </span>
        </div>

        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-4xl font-bold font-mono text-emerald-400 tracking-tight">
            ${formatNumber(totalRealized)}
          </span>
          <TrendBadge value={totalChange} suffix={` ${copy.vsLastWeek}`} />
        </div>

        {/* 关键指标行 */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-muted-foreground">{copy.topIndividual}</span>
            <span className="font-bold font-mono text-amber-400">
              ${formatNumber(topRealized)}
            </span>
            <TrendBadge value={topChange} />
          </div>
          <div className="w-px h-4 bg-border/60 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">{copy.profitable}</span>
            <span className="font-bold font-mono">{profitCount}+</span>
            {newFaces !== undefined && newFaces > 0 && (
              <span className="text-xs text-sky-400 font-medium">{copy.newFaces(newFaces)}</span>
            )}
          </div>
          <div className="w-px h-4 bg-border/60 hidden sm:block" />
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span className="text-muted-foreground">{copy.totalUnrealized}</span>
            <span className="font-bold font-mono text-sky-400">
              ${formatNumber(totalUnrealized)}
            </span>
          </div>
        </div>

        {/* 上周对比条 */}
        {prevTotal !== undefined && (
          <div className="mt-4 pt-3 border-t border-border/30 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground/80">
            <span>
              {copy.lastWeekTotal(prevCount || 0)}{' '}
              <span className="font-mono font-medium text-muted-foreground">
                ${formatNumber(prevTotal)}
              </span>
            </span>
            <span>
              {copy.lastWeekTop}{' '}
              <span className="font-mono font-medium text-muted-foreground">
                ${formatNumber(prevTop || 0)}
              </span>
            </span>
            {newFaces !== undefined && (
              <span>
                {copy.repeat(profitCount - newFaces)} · {copy.newEntrants(newFaces)}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground/70">
          <Clock className="w-3 h-3" />
          <span>{copy.updated} {timeAgo}</span>
          <span className="mx-1">·</span>
          <span>{copy.source}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Whale Tag Badge ───────────────────────────────────────────
function TagBadge({ tagKey }: { tagKey: string }) {
  const { locale } = useI18n()
  const tagDefs = getTagDefs(locale)
  const tag = tagDefs[tagKey]
  if (!tag) return null
  const Icon = tag.icon
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${tag.bg} ${tag.color}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {tag.label}
    </span>
  )
}

// ─── Rank Badge ────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
        <Crown className="w-4 h-4 text-white" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-lg shadow-slate-400/20 shrink-0">
        <Medal className="w-4 h-4 text-white" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-700/20 shrink-0">
        <Medal className="w-4 h-4 text-white" />
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
      <span className="text-xs font-mono font-bold text-muted-foreground">#{rank}</span>
    </div>
  )
}

// ─── Ranking Row ───────────────────────────────────────────────
function RankingRow({
  entry,
  maxValue,
  tags,
  activeTab,
}: {
  entry: RankingEntry & { profit?: number; volume?: number; efficiency?: number }
  maxValue: number
  tags?: string[]
  activeTab: TabKey
}) {
  const { locale } = useI18n()

  const copy = {
    en: { profit: 'Profit', volume: 'Volume' },
    zh: { profit: '利润', volume: '交易量' },
    vi: { profit: 'Lợi nhuận', volume: 'Khối lượng' },
  }[locale]

  const barWidth = maxValue > 0 ? (Math.abs(entry.value) / maxValue) * 100 : 0
  const isTop3 = entry.rank <= 3
  const isEfficiency = activeTab === 'efficiency'
  const isVolume = activeTab === 'vol'

  // 显示值
  let displayValue: string
  if (isEfficiency) {
    displayValue = `${(entry as EfficiencyEntry).efficiency.toFixed(4)}%`
  } else if (isVolume) {
    displayValue = `$${formatNumber(entry.value)}`
  } else {
    displayValue = `${entry.value >= 0 ? '+' : ''}$${formatNumber(entry.value)}`
  }

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 transition-colors ${
        isTop3 ? 'bg-muted/20' : 'hover:bg-muted/20'
      }`}
    >
      <RankBadge rank={entry.rank} />

      <div className="flex-1 min-w-0">
        {/* 第一行：名字 + 金额 */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            {isTop3 && <span className="text-base shrink-0">🐋</span>}
            <span
              className={`text-sm font-medium truncate ${
                isTop3 ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
              }`}
            >
              {entry.username}
            </span>
          </div>
          <span
            className={`text-sm font-bold font-mono shrink-0 ml-3 ${
              isVolume
                ? 'text-foreground'
                : isEfficiency
                ? 'text-emerald-400'
                : entry.value >= 0
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}
          >
            {displayValue}
          </span>
        </div>

        {/* 效率 Tab 额外信息 */}
        {isEfficiency && (entry as EfficiencyEntry).profit !== undefined && (
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-1.5">
            <span>
              {copy.profit}{' '}
              <span className="font-mono text-emerald-400/80">
                ${formatNumber((entry as EfficiencyEntry).profit)}
              </span>
            </span>
            <span>
              {copy.volume}{' '}
              <span className="font-mono">
                ${formatNumber((entry as EfficiencyEntry).volume)}
              </span>
            </span>
          </div>
        )}

        {/* 标签行 */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {tags.map((t) => (
              <TagBadge key={t} tagKey={t} />
            ))}
          </div>
        )}

        {/* 条形图 */}
        <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              entry.rank === 1
                ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                : entry.rank <= 3
                ? 'bg-gradient-to-r from-primary to-sky-400'
                : 'bg-primary/40'
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── 区域 2: 排行榜 ───────────────────────────────────────────
function Leaderboard({
  activeTab,
  timeframe,
  onTabChange,
  onTimeframeChange,
  whaleTags,
  efficiencyData,
}: {
  activeTab: TabKey
  timeframe: string
  onTabChange: (key: TabKey) => void
  onTimeframeChange: (tf: string) => void
  whaleTags: Map<string, string[]>
  efficiencyData: EfficiencyEntry[]
}) {
  const { locale } = useI18n()

  const tabs = getTabs(locale)
  const timeframeOptions = getTimeframeOptions(locale)
  const timeframeLabel = getTimeframeLabel(locale)

  const copy = {
    en: {
      loadFailed: 'Failed to load. Check network.',
      loadingCross: 'Loading, cross-calculating...',
      tradersData: (n: number, tf: string) => `${n} traders · ${tf} data`,
    },
    zh: {
      loadFailed: '数据加载失败，请检查网络后重试',
      loadingCross: '加载中，需要利润 + 交易量数据交叉计算...',
      tradersData: (n: number, tf: string) => `共 ${n} 位交易者 · ${tf}数据`,
    },
    vi: {
      loadFailed: 'Tải thất bại. Kiểm tra mạng.',
      loadingCross: 'Đang tải, đang tính chéo...',
      tradersData: (n: number, tf: string) => `${n} trader · dữ liệu ${tf}`,
    },
  }[locale]

  // 效率 Tab 不需要 fetch，用计算数据
  const isEfficiency = activeTab === 'efficiency'
  const apiType = isEfficiency ? 'plr' : activeTab
  const apiTimeframe = isEfficiency ? '1w' : timeframe

  const { data, isLoading, error } = useRankings(apiType, apiTimeframe)

  const rankingsData = isEfficiency ? undefined : data?.data
  const displayRankings: (RankingEntry & {
    profit?: number
    volume?: number
    efficiency?: number
  })[] = isEfficiency ? efficiencyData : rankingsData?.rankings || []

  const maxValue = useMemo(() => {
    if (!displayRankings.length) return 0
    return Math.max(...displayRankings.map((r) => Math.abs(r.value)))
  }, [displayRankings])

  // 洞察文案
  const insight = useMemo(() => {
    if (!displayRankings.length) return ''
    const top = displayRankings[0]

    if (activeTab === 'plr' && rankingsData) {
      const topPerc = rankingsData.summary.totalValue > 0
        ? ((top.value / rankingsData.summary.totalValue) * 100).toFixed(0)
        : 0
      const median = displayRankings[Math.floor(displayRankings.length / 2)]?.value || 0
      return {
        en: `#1 ${top.username} holds ${topPerc}% of total profit, median profit $${formatNumber(median)}. Top ${displayRankings.length} all positive.`,
        zh: `#1 ${top.username} 独占 ${topPerc}% 总利润，中位数盈利 $${formatNumber(median)}。Top ${displayRankings.length} 均为正收益。`,
        vi: `#1 ${top.username} chiếm ${topPerc}% tổng lợi nhuận, trung vị $${formatNumber(median)}. Top ${displayRankings.length} đều dương.`,
      }[locale]
    }
    if (activeTab === 'plu' && rankingsData) {
      return {
        en: `Top ${displayRankings.length} total unrealized $${formatNumber(rankingsData.summary.totalValue)}, ${top.username} leads with $${formatNumber(top.value)}, showing strong trend conviction.`,
        zh: `Top ${displayRankings.length} 合计持仓浮盈 $${formatNumber(rankingsData.summary.totalValue)}，${top.username} 以 $${formatNumber(top.value)} 位居第一，显示强烈的趋势信心。`,
        vi: `Top ${displayRankings.length} tổng lãi chưa thực hiện $${formatNumber(rankingsData.summary.totalValue)}, ${top.username} dẫn đầu với $${formatNumber(top.value)}, cho thấy niềm tin xu hướng mạnh.`,
      }[locale]
    }
    if (activeTab === 'plu_diff') {
      const bigWinners = displayRankings.filter((r) => r.value > 100000).length
      const tfLabel = timeframeLabel[timeframe] || timeframe
      return {
        en: `${top.username} ${tfLabel} P&L growth $${formatNumber(top.value)}, ${bigWinners} surged over $100K.`,
        zh: `${top.username} ${tfLabel}浮盈增长 $${formatNumber(top.value)}，${bigWinners} 人增幅超 $100K。`,
        vi: `${top.username} ${tfLabel} tăng trưởng P&L $${formatNumber(top.value)}, ${bigWinners} người tăng hơn $100K.`,
      }[locale]
    }
    if (activeTab === 'efficiency') {
      return {
        en: `${top.username} leads with ${(top as EfficiencyEntry).efficiency.toFixed(2)}% efficiency — earning $${((top as EfficiencyEntry).efficiency).toFixed(2)} per $100 traded. High efficiency means precision, not frequency.`,
        zh: `${top.username} 以 ${(top as EfficiencyEntry).efficiency.toFixed(2)}% 的效率领跑 — 每交易 $100 赚 $${((top as EfficiencyEntry).efficiency).toFixed(2)}。高效率意味着精准判断而非频繁交易。`,
        vi: `${top.username} dẫn đầu với hiệu quả ${(top as EfficiencyEntry).efficiency.toFixed(2)}% — kiếm $${((top as EfficiencyEntry).efficiency).toFixed(2)} mỗi $100 giao dịch. Hiệu quả cao nghĩa là chính xác, không phải giao dịch nhiều.`,
      }[locale]
    }
    if (activeTab === 'vol' && rankingsData) {
      const institutional = displayRankings.filter((r) => r.value > 100_000_000).length
      return {
        en: `${institutional} institutional-grade traders with weekly volume over $100M. ${top.username} leads with $${formatNumber(top.value)}, providing top-tier liquidity depth.`,
        zh: `${institutional} 位机构级交易者周交易量超 $1 亿。${top.username} 以 $${formatNumber(top.value)} 领跑，提供顶级流动性深度。`,
        vi: `${institutional} trader cấp tổ chức với khối lượng tuần hơn $100M. ${top.username} dẫn đầu với $${formatNumber(top.value)}, cung cấp thanh khoản hàng đầu.`,
      }[locale]
    }
    return ''
  }, [displayRankings, rankingsData, activeTab, timeframe, locale, timeframeLabel])

  const showLoading = isLoading && !isEfficiency

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden">
      {/* 标签页 + 时间切换 */}
      <div className="px-4 py-3 border-b border-border/40">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
            {timeframeOptions[activeTab].map((opt) => (
              <button
                key={opt.value}
                onClick={() => onTimeframeChange(opt.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  timeframe === opt.value
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {insight && (
          <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">{insight}</p>
        )}
      </div>

      {/* 加载 / 错误 */}
      {showLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {error && !isEfficiency && (
        <div className="p-4 text-sm text-red-400">{copy.loadFailed}</div>
      )}

      {/* 效率 Tab 无数据提示 */}
      {isEfficiency && efficiencyData.length === 0 && (
        <div className="p-8 text-center text-sm text-muted-foreground">
          {copy.loadingCross}
        </div>
      )}

      {/* 排行列表 */}
      {displayRankings.length > 0 && (
        <div className="divide-y divide-border/20 max-h-[520px] overflow-y-auto">
          {displayRankings.map((entry) => (
            <RankingRow
              key={`${activeTab}-${entry.rank}`}
              entry={entry}
              maxValue={maxValue}
              tags={whaleTags.get(entry.username)}
              activeTab={activeTab}
            />
          ))}
        </div>
      )}

      {/* 底部统计 */}
      {displayRankings.length > 0 && (
        <div className="px-4 py-3 border-t border-border/40 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {copy.tradersData(
              displayRankings.length,
              timeframeLabel[isEfficiency ? '1w' : timeframe]
            )}
          </span>
          <span>
            {displayRankings[0]?.timestamp
              ? new Date(displayRankings[0].timestamp).toLocaleDateString(
                  locale === 'zh' ? 'zh-CN' : locale === 'vi' ? 'vi-VN' : 'en-US'
                )
              : ''}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── 区域 3: 底部跑马灯 ───────────────────────────────────────
function ProfitTicker({
  pluDiffData,
  pluData,
}: {
  pluDiffData?: RankingsResponse
  pluData?: RankingsResponse
}) {
  const { locale } = useI18n()

  const copy = {
    en: { weeklyGrowth: 'Weekly P&L growth', totalUnrealized: 'Total unrealized' },
    zh: { weeklyGrowth: '本周浮盈增长', totalUnrealized: '总浮盈' },
    vi: { weeklyGrowth: 'Tăng trưởng P&L tuần', totalUnrealized: 'Tổng lãi chưa thực hiện' },
  }[locale]

  const items = useMemo(() => {
    const result: { username: string; text: string; value: string }[] = []
    const diffs = pluDiffData?.rankings.slice(0, 8) || []
    const totals = pluData?.rankings.slice(0, 8) || []

    const maxLen = Math.max(diffs.length, totals.length)
    for (let i = 0; i < maxLen; i++) {
      if (i < diffs.length) {
        result.push({
          username: diffs[i].username,
          text: copy.weeklyGrowth,
          value: `+$${formatNumber(diffs[i].value)}`,
        })
      }
      if (i < totals.length) {
        result.push({
          username: totals[i].username,
          text: copy.totalUnrealized,
          value: `$${formatNumber(totals[i].value)}`,
        })
      }
    }
    return result
  }, [pluDiffData, pluData, copy])

  if (items.length === 0) return null

  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-muted/15">
      <div className="flex animate-scroll whitespace-nowrap py-3 px-4">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-medium text-foreground">{item.username}</span>
            <span className="text-muted-foreground">{item.text}</span>
            <span className="font-bold font-mono text-emerald-400">{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── 主组件 ────────────────────────────────────────────────────
export function RankingsBoard() {
  const { locale } = useI18n()
  const [activeTab, setActiveTab] = useState<TabKey>('plr')
  const [timeframe, setTimeframe] = useState('1w')

  const timeframeOptions = getTimeframeOptions(locale)

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key)
    setTimeframe(timeframeOptions[key][0].value)
  }

  // 始终拉取 4 个榜单的 1w 数据（用于标签交叉 + Banner + 效率计算）
  const { data: plrRes } = useRankings('plr', '1w', true) // withPrev=1
  const { data: pluRes } = useRankings('plu', '1w')
  const { data: pluDiffRes } = useRankings('plu_diff', '1w')
  const { data: volRes } = useRankings('vol', '1w')

  // 计算鲸鱼标签
  const whaleTags = useMemo(() => {
    const plrMap = new Map(
      (plrRes?.data?.rankings || []).map((r) => [r.username, r.value])
    )
    const pluMap = new Map(
      (pluRes?.data?.rankings || []).map((r) => [r.username, r.value])
    )
    const diffMap = new Map(
      (pluDiffRes?.data?.rankings || []).map((r) => [r.username, r.value])
    )
    const volMap = new Map(
      (volRes?.data?.rankings || []).map((r) => [r.username, r.value])
    )
    const prevPlrUsers = new Set(
      (plrRes?.data?.prevRankings || []).map((r) => r.username)
    )

    return computeWhaleTags(plrMap, pluMap, diffMap, volMap, prevPlrUsers)
  }, [plrRes, pluRes, pluDiffRes, volRes])

  // 计算利润效率
  const efficiencyData = useMemo(() => {
    if (!plrRes?.data?.rankings?.length || !volRes?.data?.rankings?.length) return []
    return computeEfficiency(plrRes.data.rankings, volRes.data.rankings)
  }, [plrRes, volRes])

  return (
    <div className="space-y-6">
      {/* 区域 1: 盈利总览横幅 */}
      <ProfitBanner plrData={plrRes?.data} pluData={pluRes?.data} />

      {/* 区域 2: 排行榜 */}
      <Leaderboard
        activeTab={activeTab}
        timeframe={timeframe}
        onTabChange={handleTabChange}
        onTimeframeChange={setTimeframe}
        whaleTags={whaleTags}
        efficiencyData={efficiencyData}
      />

      {/* 区域 3: 底部跑马灯 */}
      <ProfitTicker pluDiffData={pluDiffRes?.data} pluData={pluRes?.data} />
    </div>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { formatNumber } from '@/lib/utils'
import { SignalCard, StatusLight } from '@/components/signals/SignalCard'
import { ModuleActionHeader, type Condition, type ActionSuggestion } from '@/components/trading/TradingWidgets'
import { BookOpen, ArrowUpDown, Layers, Zap } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export function OrderbookSniper() {
  const { locale } = useI18n()
  const { data, isLoading, error } = useQuery({
    queryKey: ['orderbook-sniper', locale],
    queryFn: () => fetch(`/api/orderbook-sniper?locale=${locale}`).then((r) => r.json()),
    refetchInterval: 15 * 1000,
  })
  const copy = {
    en: { loading: 'Loading order book...', failed: 'Failed to load data', title: 'Order book data', red: 'Imbalance', yellow: 'Offset', green: 'Balanced', aggressive: 'Aggressive flow', depthTop: 'Order book depth (Top 15)', bids: 'Bids', asks: 'Asks', wallDetect: 'Wall detection', walls: 'walls', wallEvents: 'Wall events', active: 'Active signals', none: 'Order book is balanced with no active imbalance signal' },
    zh: { loading: '加载盘口数据...', failed: '数据加载失败', title: '盘口数据', red: '失衡', yellow: '偏移', green: '均衡', aggressive: '主动成交', depthTop: '盘口深度 (Top 15)', bids: 'Bids', asks: 'Asks', wallDetect: '大单墙检测', walls: '面墙', wallEvents: '墙变动事件', active: '活跃信号', none: '当前盘口均衡 · 无失衡信号' },
    vi: { loading: 'Đang tải sổ lệnh...', failed: 'Tải dữ liệu thất bại', title: 'Dữ liệu sổ lệnh', red: 'Mất cân bằng', yellow: 'Lệch nhẹ', green: 'Cân bằng', aggressive: 'Khớp lệnh chủ động', depthTop: 'Độ sâu sổ lệnh (Top 15)', bids: 'Bids', asks: 'Asks', wallDetect: 'Phát hiện tường lệnh', walls: 'tường', wallEvents: 'Sự kiện tường lệnh', active: 'Tín hiệu hoạt động', none: 'Sổ lệnh đang cân bằng, chưa có tín hiệu rõ ràng' },
  }[locale]
  const eventLabels = {
    en: { askRemoved: 'Ask wall removed', bidRemoved: 'Bid wall removed', newWall: 'New wall appeared' },
    zh: { askRemoved: 'Ask墙消失', bidRemoved: 'Bid墙消失', newWall: '新墙出现' },
    vi: { askRemoved: 'Tuong ask bi rut', bidRemoved: 'Tuong bid bi rut', newWall: 'Xuat hien tuong moi' },
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

  const { mid, spread, spreadPct, depth, flow, walls, wallEvents, topBids, topAsks, signals, overallLevel, btcPrice } = data.data

  const maxBookAmount = Math.max(
    ...topBids.map((b: any) => b.amount),
    ...topAsks.map((a: any) => a.amount),
    1
  )

  return (
    <div className="space-y-4">
      <ObActionPanel data={data.data} />

      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{copy.title}</span>
            <span className="text-xs text-muted-foreground font-mono">BTC ${formatNumber(btcPrice)}</span>
          </div>
          <StatusLight
            level={overallLevel}
            label={overallLevel === 'red' ? copy.red : overallLevel === 'yellow' ? copy.yellow : copy.green}
          />
        </div>

        {/* Spread + Depth */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div className="rounded-lg border border-border/40 p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Spread</div>
            <div className="text-lg font-bold font-mono">${(spread || 0).toFixed(1)}</div>
            <div className="text-[10px] text-muted-foreground">{(spreadPct || 0).toFixed(4)}%</div>
          </div>
          {(['0.2%', '0.5%', '1%'] as const).map((range) => {
            const d = depth[range]
            const imb = d.imbalance
            const color = imb >= 1.5 ? 'text-emerald-400' : imb <= 0.67 ? 'text-red-400' : 'text-muted-foreground'
            return (
              <div key={range} className="rounded-lg border border-border/40 p-3">
                <div className="text-[10px] text-muted-foreground mb-1">{range} Bid/Ask</div>
                <div className={`text-lg font-bold font-mono ${color}`}>{imb.toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground">B:{d.bidDepth.toFixed(2)} / A:{d.askDepth.toFixed(2)}</div>
              </div>
            )
          })}
        </div>

        {/* Flow */}
        <div className="grid grid-cols-3 gap-3">
          {(['30s', '60s', '5m'] as const).map((window) => {
            const f = flow[window]
            const net = f.netFlow
            const color = net > 0 ? 'text-emerald-400' : net < 0 ? 'text-red-400' : 'text-muted-foreground'
            return (
              <div key={window} className="rounded-lg border border-border/40 p-3">
                <div className="text-[10px] text-muted-foreground mb-1">{window} {copy.aggressive}</div>
                <div className={`text-sm font-bold font-mono ${color}`}>
                  {net >= 0 ? '+' : ''}{net.toFixed(3)} BTC
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span className="text-emerald-400">B {f.buyCount}</span>
                  <span className="text-red-400">S {f.sellCount}</span>
                </div>
                <div className="h-1 rounded-full bg-muted/40 mt-1 overflow-hidden flex">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${f.buyRatio * 100}%` }} />
                  <div className="h-full bg-red-500 transition-all" style={{ width: `${(1 - f.buyRatio) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{copy.depthTop}</span>
          <span className="text-xs text-muted-foreground ml-auto">Mid: ${mid.toFixed(1)}</span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border/30">
          <div className="p-3">
            <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-2 px-1">{copy.bids}</div>
            <div className="space-y-0.5">
              {topBids.map((b: any, i: number) => (
                <div key={i} className={`relative grid grid-cols-[1fr_80px_70px] gap-1 px-2 py-1 text-xs rounded ${b.isWall ? 'bg-emerald-500/10 border border-emerald-500/30' : ''}`}>
                  <div className="absolute inset-y-0 right-0 bg-emerald-500/10 rounded" style={{ width: `${(b.amount / maxBookAmount) * 100}%` }} />
                  <span className="font-mono text-emerald-400 relative z-10">${formatNumber(b.price)}</span>
                  <span className="font-mono text-right relative z-10">{b.amount.toFixed(4)}</span>
                  <span className="font-mono text-right text-muted-foreground relative z-10">${(b.usdValue / 1000).toFixed(0)}K</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3">
            <div className="text-[10px] uppercase tracking-wider text-red-400 mb-2 px-1">{copy.asks}</div>
            <div className="space-y-0.5">
              {topAsks.map((a: any, i: number) => (
                <div key={i} className={`relative grid grid-cols-[1fr_80px_70px] gap-1 px-2 py-1 text-xs rounded ${a.isWall ? 'bg-red-500/10 border border-red-500/30' : ''}`}>
                  <div className="absolute inset-y-0 left-0 bg-red-500/10 rounded" style={{ width: `${(a.amount / maxBookAmount) * 100}%` }} />
                  <span className="font-mono text-red-400 relative z-10">${formatNumber(a.price)}</span>
                  <span className="font-mono text-right relative z-10">{a.amount.toFixed(4)}</span>
                  <span className="font-mono text-right text-muted-foreground relative z-10">${(a.usdValue / 1000).toFixed(0)}K</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {walls.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{copy.wallDetect}</span>
            <span className="text-xs text-muted-foreground ml-auto">{walls.length} {copy.walls}</span>
          </div>
          <div className="divide-y divide-border/20">
            {walls.map((w: any, i: number) => (
              <div key={i} className="grid grid-cols-[50px_1fr_90px_70px_55px] gap-2 px-4 py-2 text-xs items-center hover:bg-muted/20">
                <span className={w.side === 'bid' ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                  {w.side === 'bid' ? 'BID' : 'ASK'}
                </span>
                <span className="font-mono">${formatNumber(w.price)}</span>
                <span className="font-mono">{w.amount.toFixed(4)} BTC</span>
                <span className="font-mono text-muted-foreground">${(w.usdValue / 1000).toFixed(0)}K</span>
                <span className="text-right text-muted-foreground">{w.distFromMid.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {wallEvents.length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="text-xs font-semibold text-yellow-400 mb-2">{copy.wallEvents}</div>
          <div className="space-y-1.5">
            {wallEvents.map((ev: any, i: number) => (
              <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                <span className={ev.type.includes('removed') ? 'text-red-400' : 'text-emerald-400'}>
                  {ev.type === 'ask_wall_removed' ? eventLabels.askRemoved : ev.type === 'bid_wall_removed' ? eventLabels.bidRemoved : eventLabels.newWall}
                </span>
                <span className="font-mono">${formatNumber(ev.wall.price)}</span>
                <span className="font-mono">{ev.wall.amount.toFixed(4)} BTC</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {signals.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {copy.active}
          </h3>
          {signals.map((s: any) => (
            <SignalCard key={s.id} signal={s} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-400 text-center">
          {copy.none}
        </div>
      )}
    </div>
  )
}

// ─── Trading Action Panel (盘口狙击专用) ──────────────────────────
function ObActionPanel({ data }: { data: any }) {
  const { locale } = useI18n()
  const { depth, flow, walls, wallEvents, signals, mid } = data
  const copy = {
    en: {
      moduleName: 'Orderbook sniper',
      buyDepth: '0.5% depth imbalance (Bid/Ask >= 1.5 bid-heavy)',
      sellDepth: '0.5% depth imbalance (Bid/Ask <= 0.67 ask-heavy)',
      buyFlow: '60s aggressive buys dominate (> 60%)',
      sellFlow: '60s aggressive sells dominate (< 40%)',
      bidWall: 'Nearby bid wall support (< 0.3%)',
      askWall: 'Nearby ask wall resistance (< 0.3%)',
      none: 'None',
      near: 'near',
      belowWall: 'below wall',
      aboveWall: 'above wall',
      target: 'Target',
      support: 'Support',
      resistance: 'Resistance',
      mildlyBullish: 'mildly bullish',
      mildlyBearish: 'mildly bearish',
      longReason: 'Bids clearly lead the book: 0.5% Bid/Ask {imbalance}, 60s buy ratio {ratio}. Aggressive buys are absorbing sells and favor an upside break. {wall}',
      longWall: 'Watch the ask wall at {price} as resistance.',
      longNoWall: 'No obvious overhead resistance.',
      shortReason: 'Asks clearly lead the book: 0.5% Bid/Ask {imbalance}, 60s sell ratio {ratio}. Aggressive sells are overwhelming buys and favor a downside break. {wall}',
      shortWall: 'Watch the bid wall at {price} as support.',
      shortNoWall: 'No obvious support below.',
      waitReason: 'The order book is {direction} (Bid/Ask {imbalance}), but the setup is not strong enough yet. Wait for deeper imbalance or more aggressive flow before entering.',
      flatReason: 'The order book is balanced with no directional edge. Wait for imbalance or confirmation from other modules.',
    },
    zh: {
      moduleName: '盘口狙击',
      buyDepth: '0.5% 深度失衡 (Bid/Ask >= 1.5 买盘强)',
      sellDepth: '0.5% 深度失衡 (Bid/Ask <= 0.67 卖盘强)',
      buyFlow: '60s 主动买入占优 (> 60%)',
      sellFlow: '60s 主动卖出占优 (< 40%)',
      bidWall: '近距离 Bid 墙支撑 (< 0.3%)',
      askWall: '近距离 Ask 墙阻力 (< 0.3%)',
      none: '无',
      near: '附近',
      belowWall: '墙下方',
      aboveWall: '墙上方',
      target: '目标',
      support: '支撑',
      resistance: '阻力',
      mildlyBullish: '偏多',
      mildlyBearish: '偏空',
      longReason: '盘口买盘明显占优：0.5% Bid/Ask {imbalance}，60s 买入占比 {ratio}。主动买入压倒卖出，短线偏向上方突破。{wall}',
      longWall: '关注 {price} Ask 墙阻力。',
      longNoWall: '无明显上方阻力。',
      shortReason: '盘口卖盘明显占优：0.5% Bid/Ask {imbalance}，60s 卖出占比 {ratio}。主动卖出压倒买入，短线偏向下方突破。{wall}',
      shortWall: '关注 {price} Bid 墙支撑。',
      shortNoWall: '无明显下方支撑。',
      waitReason: '盘口轻微{direction} (Bid/Ask {imbalance})，但信号不够强烈。等待深度失衡加剧或主动成交确认后再入场。',
      flatReason: '盘口多空均衡，无方向性信号。等待失衡出现或结合其他模块信号判断。',
    },
    vi: {
      moduleName: 'Ban tia so lenh',
      buyDepth: 'Mat can bang do sau 0.5% (Bid/Ask >= 1.5 nghieng mua)',
      sellDepth: 'Mat can bang do sau 0.5% (Bid/Ask <= 0.67 nghieng ban)',
      buyFlow: '60s lenh mua chu dong chiem uu the (> 60%)',
      sellFlow: '60s lenh ban chu dong chiem uu the (< 40%)',
      bidWall: 'Tuong bid gan ho tro (< 0.3%)',
      askWall: 'Tuong ask gan khang cu (< 0.3%)',
      none: 'Khong co',
      near: 'gan',
      belowWall: 'duoi tuong',
      aboveWall: 'tren tuong',
      target: 'Muc tieu',
      support: 'Ho tro',
      resistance: 'Khang cu',
      mildlyBullish: 'hơi bullish',
      mildlyBearish: 'hơi bearish',
      longReason: 'Luc mua dang chiem uu the ro rang: Bid/Ask 0.5% = {imbalance}, ti le mua 60s = {ratio}. Lenh mua chu dong dang hap thu ben ban va ung ho kha nang breakout len tren. {wall}',
      longWall: 'Canh bao tuong ask tai {price} la khang cu.',
      longNoWall: 'Khong co khang cu ro o phia tren.',
      shortReason: 'Luc ban dang chiem uu the ro rang: Bid/Ask 0.5% = {imbalance}, ti le ban 60s = {ratio}. Lenh ban chu dong dang ap dao ben mua va ung ho kha nang breakout xuong duoi. {wall}',
      shortWall: 'Canh bao tuong bid tai {price} la ho tro.',
      shortNoWall: 'Khong co ho tro ro o phia duoi.',
      waitReason: 'So lenh dang {direction} (Bid/Ask {imbalance}) nhung chua du manh. Cho mat can bang sau hon hoac dong lenh chu dong xac nhan roi moi vao.',
      flatReason: 'So lenh dang can bang, chua co loi the huong di. Cho mat can bang ro hon hoac xac nhan tu module khac.',
    },
  }[locale]
  const fill = (template: string, values: Record<string, string>) =>
    template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '')

  const conditions: Condition[] = useMemo(() => {
    const d05 = depth['0.5%']
    const f60 = flow['60s']
    const bidWalls = walls.filter((w: any) => w.side === 'bid')
    const askWalls = walls.filter((w: any) => w.side === 'ask')
    const nearBidWall = bidWalls.find((w: any) => w.distFromMid < 0.3)
    const nearAskWall = askWalls.find((w: any) => w.distFromMid < 0.3)

    return [
      {
        label: copy.buyDepth,
        met: d05.imbalance >= 1.5,
        value: d05.imbalance.toFixed(2),
      },
      {
        label: copy.sellDepth,
        met: d05.imbalance <= 0.67,
        value: d05.imbalance.toFixed(2),
      },
      {
        label: copy.buyFlow,
        met: f60.buyRatio > 0.60,
        value: `${(f60.buyRatio * 100).toFixed(0)}%`,
      },
      {
        label: copy.sellFlow,
        met: f60.buyRatio < 0.40,
        value: `${(f60.buyRatio * 100).toFixed(0)}%`,
      },
      {
        label: copy.bidWall,
        met: !!nearBidWall,
        value: nearBidWall ? `$${nearBidWall.price.toFixed(0)}` : copy.none,
      },
      {
        label: copy.askWall,
        met: !!nearAskWall,
        value: nearAskWall ? `$${nearAskWall.price.toFixed(0)}` : copy.none,
      },
    ]
  }, [copy.askWall, copy.bidWall, copy.buyDepth, copy.buyFlow, copy.none, copy.sellDepth, copy.sellFlow, depth, flow, walls])

  const { biasScore, action } = useMemo(() => {
    const d02 = depth['0.2%']
    const d05 = depth['0.5%']
    const d10 = depth['1%']
    const f30 = flow['30s']
    const f60 = flow['60s']

    let score = 0

    const imbScore = (imb: number, weight: number) => {
      if (imb >= 2.0) return weight * 1.0
      if (imb >= 1.5) return weight * 0.6
      if (imb <= 0.5) return -weight * 1.0
      if (imb <= 0.67) return -weight * 0.6
      return 0
    }
    score += imbScore(d02.imbalance, 15)
    score += imbScore(d05.imbalance, 25)
    score += imbScore(d10.imbalance, 10)

    if (f30.netFlow > 0) score += Math.min(15, f30.buyRatio * 20)
    if (f30.netFlow < 0) score -= Math.min(15, (1 - f30.buyRatio) * 20)
    if (f60.netFlow > 0) score += Math.min(10, f60.buyRatio * 15)
    if (f60.netFlow < 0) score -= Math.min(10, (1 - f60.buyRatio) * 15)

    const bidWallsNear = walls.filter((w: any) => w.side === 'bid' && w.distFromMid < 0.5)
    const askWallsNear = walls.filter((w: any) => w.side === 'ask' && w.distFromMid < 0.5)
    if (bidWallsNear.length > 0 && askWallsNear.length === 0) score += 10
    if (askWallsNear.length > 0 && bidWallsNear.length === 0) score -= 10

    for (const ev of wallEvents) {
      if (ev.type === 'ask_wall_removed') score += 15
      if (ev.type === 'bid_wall_removed') score -= 15
    }

    score = Math.max(-100, Math.min(100, Math.round(score)))

    const nearestBidWall = walls.filter((w: any) => w.side === 'bid').sort((a: any, b: any) => a.distFromMid - b.distFromMid)[0]
    const nearestAskWall = walls.filter((w: any) => w.side === 'ask').sort((a: any, b: any) => a.distFromMid - b.distFromMid)[0]

    let action: ActionSuggestion

    if (score >= 40) {
      const wallText = nearestAskWall
        ? fill(copy.longWall, { price: `$${nearestAskWall.price.toFixed(0)}` })
        : copy.longNoWall
      action = {
        type: 'long',
        confidence: Math.min(80, 50 + Math.abs(score) / 2),
        reasoning: fill(copy.longReason, {
          imbalance: d05.imbalance.toFixed(2),
          ratio: `${(f60.buyRatio * 100).toFixed(0)}%`,
          wall: wallText,
        }),
        levels: {
          entry: `$${mid.toFixed(0)} ${copy.near}`,
          stop: nearestBidWall ? `$${(nearestBidWall.price * 0.999).toFixed(0)} (${copy.belowWall})` : undefined,
          note: nearestAskWall ? `${copy.target}: $${nearestAskWall.price.toFixed(0)}` : undefined,
        },
      }
    } else if (score <= -40) {
      const wallText = nearestBidWall
        ? fill(copy.shortWall, { price: `$${nearestBidWall.price.toFixed(0)}` })
        : copy.shortNoWall
      action = {
        type: 'short',
        confidence: Math.min(80, 50 + Math.abs(score) / 2),
        reasoning: fill(copy.shortReason, {
          imbalance: d05.imbalance.toFixed(2),
          ratio: `${((1 - f60.buyRatio) * 100).toFixed(0)}%`,
          wall: wallText,
        }),
        levels: {
          entry: `$${mid.toFixed(0)} ${copy.near}`,
          stop: nearestAskWall ? `$${(nearestAskWall.price * 1.001).toFixed(0)} (${copy.aboveWall})` : undefined,
          note: nearestBidWall ? `${copy.target}: $${nearestBidWall.price.toFixed(0)}` : undefined,
        },
      }
    } else if (Math.abs(score) >= 15) {
      const direction = score > 0 ? copy.mildlyBullish : copy.mildlyBearish
      action = {
        type: 'wait',
        confidence: 40 + Math.abs(score) / 3,
        reasoning: fill(copy.waitReason, {
          direction,
          imbalance: d05.imbalance.toFixed(2),
        }),
        levels: {
          note: nearestBidWall ? `${copy.support}: $${nearestBidWall.price.toFixed(0)}` : nearestAskWall ? `${copy.resistance}: $${nearestAskWall.price.toFixed(0)}` : undefined,
        },
      }
    } else {
      action = {
        type: 'wait',
        confidence: 30,
        reasoning: copy.flatReason,
      }
    }

    return { biasScore: score, action }
  }, [copy.aboveWall, copy.belowWall, copy.flatReason, copy.longNoWall, copy.longReason, copy.longWall, copy.mildlyBearish, copy.mildlyBullish, copy.near, copy.resistance, copy.shortNoWall, copy.shortReason, copy.shortWall, copy.support, copy.target, copy.waitReason, depth, flow, mid, wallEvents, walls])

  return (
    <ModuleActionHeader
      moduleName={copy.moduleName}
      biasScore={biasScore}
      conditions={conditions}
      action={action}
    />
  )
}

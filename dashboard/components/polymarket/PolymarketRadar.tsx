'use client'

import { useQuery } from '@tanstack/react-query'
import { formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Timer,
  ArrowUpDown,
  Zap,
  BarChart3,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export function PolymarketRadar() {
  const { locale } = useI18n()
  const { data, isLoading, error } = useQuery({
    queryKey: ['polymarket-radar'],
    queryFn: () => fetch('/api/polymarket-radar').then((r) => r.json()),
    refetchInterval: 30 * 1000,
  })
  const copy = {
    en: {
      failed: 'Failed to load Polymarket data',
      network: 'Network error',
      activeMarkets: 'Active Polymarket markets',
      settlement: 'Settlement',
      noMarket: 'No active BTC Up/Down market right now',
      strategy: 'Strategy 1: Signal-driven entries',
      strategyDesc: 'Use Bitfinex order book, liquidation, and funding signals to infer short-term direction and buy the matching Up or Down side on Polymarket.',
      backtest: 'Backtest validation (30d)',
      backtestDesc: 'Historical accuracy of aggregated Bitfinex signals for BTC 4h direction. Higher confidence has produced better hit rates.',
      confidenceAtLeast: 'Confidence >=',
      signals: 'signals',
      accuracy: 'accuracy',
      defaultThreshold: 'Default threshold: 35% (best balance of frequency and accuracy). Adjust with',
      why: 'Why signal-based betting can work',
      multiModule: 'Multi-module consensus',
      multiModuleDesc: 'Smart money, liquidation flow, order-book depth, and funding each score direction independently. Confidence only clears the threshold when multiple modules agree.',
      infoEdge: 'Information edge',
      infoEdgeDesc: 'Bitfinex depth, liquidation flow, and tape signals often move before Polymarket repricing, creating a short timing edge.',
      transparent: 'Transparent settlement',
      transparentDesc: 'These markets settle via external rules. In 4h windows, Bitfinex signals have posted roughly 55-67% hit rates when confidence is above 35%.',
      autoBet: 'Auto-bet settings',
      configHint: 'Adjust with sentry config',
      minConfidence: 'Minimum confidence',
      singleBet: 'Single bet size',
      predictionWindow: 'Prediction window',
      settlementType: 'Settlement type',
      binary: 'Binary ($0/$1)',
      autoBetDesc: 'When Bitfinex aggregate confidence clears the threshold, the bot can buy the matching BTC Up/Down side on Polymarket. Single-module signals do not trigger entries.',
      aggregate: 'Bitfinex aggregate signal',
      funding: 'Funding rate',
      confidence: 'Confidence',
      ended: 'Ended',
      arbGap: 'Arbitrage gap',
      signalEdge: 'Signal edge',
      maybeUndervalued: 'may be undervalued',
      weakSignal: 'Signal strength is still too low. Wait until confidence is above 15% before taking a directional market.',
      buy: 'Buy',
      noMaterialEdge: 'No material edge',
      edge: 'edge',
      signal: 'Signal',
      market: 'Market',
      payout: 'Potential payout per share',
    },
    zh: {
      failed: 'Polymarket 数据加载失败',
      network: '网络错误',
      activeMarkets: 'Polymarket 活跃市场',
      settlement: '结算',
      noMarket: '当前无活跃 BTC Up/Down 市场（可能处于窗口切换间隙）',
      strategy: '策略1: 信号驱动下注',
      strategyDesc: '利用 Bitfinex 盘口、爆仓和资金费率信号判断短周期方向，在 Polymarket 买入对应 Up/Down 份额。',
      backtest: '回测验证 (30天)',
      backtestDesc: 'Bitfinex 信号聚合预测 BTC 4h 方向的历史准确率。置信度越高，预测越准。',
      confidenceAtLeast: '置信度 >=',
      signals: '信号',
      accuracy: '准确率',
      defaultThreshold: '默认阈值: 35% (频率与准确率最佳平衡) · 可通过',
      why: '为什么信号下注可行',
      multiModule: '多模块聚合',
      multiModuleDesc: '聪明钱、爆仓流、盘口深度、资金费率四大信号模块独立判断，多模块共识时置信度才超过阈值，有效过滤噪声。',
      infoEdge: '信息差优势',
      infoEdgeDesc: 'Bitfinex 盘口、爆仓流和成交流信号传导速度快于 Polymarket 定价反应，往往领先数十秒到数分钟，提供时间窗口优势。',
      transparent: '结算透明',
      transparentDesc: '这些市场依赖外部规则结算。4h 窗口下，Bitfinex 信号在置信度高于 35% 时命中率约 55-67%。',
      autoBet: '自动下注配置',
      configHint: '通过 sentry config 调整',
      minConfidence: '最低置信度',
      singleBet: '单次下注',
      predictionWindow: '预测窗口',
      settlementType: '结算方式',
      binary: '二元 ($0/$1)',
      autoBetDesc: '当 Bitfinex 聚合信号置信度超过阈值时，机器人会在 Polymarket 买入对应 BTC Up/Down 份额。单模块信号不会触发下注。',
      aggregate: 'Bitfinex 综合信号',
      funding: '资金费率',
      confidence: '信心度',
      ended: '已结束',
      arbGap: '套利缺口',
      signalEdge: '信号偏差',
      maybeUndervalued: '可能低估',
      weakSignal: '当前信号强度不足，建议观望。信心度需 > 15% 方可触发方向建议。',
      buy: '买',
      noMaterialEdge: '无显著偏差',
      edge: '偏差',
      signal: '信号',
      market: '市场',
      payout: '每份潜在收益',
    },
    vi: {
      failed: 'Tai du lieu Polymarket that bai',
      network: 'Loi mang',
      activeMarkets: 'Thi truong Polymarket dang hoat dong',
      settlement: 'Thanh toan',
      noMarket: 'Hien khong co thi truong BTC Up/Down dang mo',
      strategy: 'Chien luoc 1: vao lenh theo tin hieu',
      strategyDesc: 'Dung tin hieu so lenh, thanh ly va funding tu Bitfinex de suy ra huong ngan han roi mua ben Up hoac Down tren Polymarket.',
      backtest: 'Kiem dinh backtest (30 ngay)',
      backtestDesc: 'Do chinh xac lich su cua tin hieu tong hop Bitfinex cho huong BTC 4h. Do tin cay cao hon thuong cho ket qua tot hon.',
      confidenceAtLeast: 'Do tin cay >=',
      signals: 'tin hieu',
      accuracy: 'do chinh xac',
      defaultThreshold: 'Nguong mac dinh: 35% (can bang tot giua tan suat va do chinh xac). Dieu chinh bang',
      why: 'Vi sao cuoc dat theo tin hieu co the hieu qua',
      multiModule: 'Dong thuan da module',
      multiModuleDesc: 'Smart money, liquidation flow, order-book depth va funding deu danh gia huong rieng. Chi khi nhieu module dong thuan thi confidence moi vuot nguong.',
      infoEdge: 'Loi the thong tin',
      infoEdgeDesc: 'Do sau so lenh, liquidation flow va tape cua Bitfinex thuong di truoc Polymarket, tao ra mot cua so thoi gian nho.',
      transparent: 'Thanh toan minh bach',
      transparentDesc: 'Thi truong nay thanh toan theo quy tac ben ngoai. Trong khung 4h, tin hieu Bitfinex dat ty le dung khoang 55-67% khi confidence > 35%.',
      autoBet: 'Cau hinh auto-bet',
      configHint: 'Dieu chinh bang sentry config',
      minConfidence: 'Do tin cay toi thieu',
      singleBet: 'Kich thuoc moi lenh',
      predictionWindow: 'Khung du bao',
      settlementType: 'Kieu thanh toan',
      binary: 'Nhi phan ($0/$1)',
      autoBetDesc: 'Khi confidence tong hop cua Bitfinex vuot nguong, bot co the mua ben BTC Up/Down tuong ung tren Polymarket. Tin hieu don le se khong kich hoat vao lenh.',
      aggregate: 'Tin hieu tong hop Bitfinex',
      funding: 'Funding rate',
      confidence: 'Do tin cay',
      ended: 'Da ket thuc',
      arbGap: 'Chen lech arbitrage',
      signalEdge: 'Lech tin hieu',
      maybeUndervalued: 'co the dang bi dinh gia thap',
      weakSignal: 'Tin hieu hien chua du manh. Cho den khi confidence > 15% roi moi xet vao lenh theo huong.',
      buy: 'Mua',
      noMaterialEdge: 'Khong co lech dang ke',
      edge: 'lech',
      signal: 'Tin hieu',
      market: 'Thi truong',
      payout: 'Loi nhuan toi da moi co phan',
    },
  }[locale]

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card/60 h-32 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error || !data?.success) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-400">
        {copy.failed}: {data?.error || copy.network}
      </div>
    )
  }

  const { btcPrice, markets, signals, aggregate, derivStatus, meta } = data.data

  return (
    <div className="space-y-4">
      <SignalAggregatePanel
        aggregate={aggregate}
        signals={signals}
        btcPrice={btcPrice}
        fundingRate={derivStatus.fundingRate}
        copy={copy}
      />

      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{copy.activeMarkets}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {copy.settlement}: {meta.settlementSource}
          </span>
        </div>
        <div className="p-4 space-y-3">
          {markets.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              {copy.noMarket}
            </div>
          ) : (
            markets.map((m: any) => (
              <MarketCard key={m.slug} market={m} aggregate={aggregate} copy={copy} />
            ))
          )}
        </div>
      </div>

      {/* ── Strategy Panels (2 columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Strategy 1: Signal-Driven */}
        <div className="rounded-2xl border border-emerald-500/20 bg-card/60 backdrop-blur overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold">{copy.strategy}</span>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {copy.strategyDesc}
            </p>
            <SignalDirectionPanel aggregate={aggregate} markets={markets} copy={copy} />
          </div>
        </div>

        {/* Strategy 2: Backtest Accuracy */}
        <div className="rounded-2xl border border-blue-500/20 bg-card/60 backdrop-blur overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold">{copy.backtest}</span>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {copy.backtestDesc}
            </p>
            <div className="space-y-1.5">
              {[
                { threshold: '30%', signals: 17, accuracy: 52.9, ev: '+3.9%' },
                { threshold: '35%', signals: 9, accuracy: 55.6, ev: '+9.1%' },
                { threshold: '40%', signals: 6, accuracy: 66.7, ev: '+31.3%' },
                { threshold: '45%', signals: 3, accuracy: 100, ev: '+98.0%' },
              ].map((row) => (
                <div key={row.threshold} className={cn(
                  'rounded-lg border p-2 text-xs flex items-center justify-between',
                  row.accuracy >= 55 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/40'
                )}>
                  <span className="font-medium">{copy.confidenceAtLeast} {row.threshold}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{row.signals} {copy.signals}</span>
                    <span className={cn('font-mono', row.accuracy >= 55 ? 'text-emerald-400' : 'text-muted-foreground')}>
                      {row.accuracy.toFixed(1)}% {copy.accuracy}
                    </span>
                    <span className={cn('font-mono text-[10px]', row.ev.startsWith('+') ? 'text-emerald-400' : 'text-red-400')}>
                      EV {row.ev}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {copy.defaultThreshold} <code className="text-primary">sentry config set pm_hedge.signal_driven.min_confidence 40</code>
            </div>
          </div>
        </div>
      </div>

      {/* ── Why this works ── */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-primary/5 via-card/80 to-card/60 backdrop-blur overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{copy.why}</span>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-emerald-400">{copy.multiModule}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {copy.multiModuleDesc}
            </p>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-xs font-semibold text-blue-400">{copy.infoEdge}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {copy.infoEdgeDesc}
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-xs font-semibold text-amber-400">{copy.transparent}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {copy.transparentDesc}
            </p>
          </div>
        </div>
      </div>

      {/* ── Auto-bet Status ── */}
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{copy.autoBet}</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{copy.configHint}</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-lg bg-muted/20 p-2.5">
              <div className="text-[10px] text-muted-foreground mb-1">{copy.minConfidence}</div>
              <div className="font-mono font-medium text-primary">35%</div>
            </div>
            <div className="rounded-lg bg-muted/20 p-2.5">
              <div className="text-[10px] text-muted-foreground mb-1">{copy.singleBet}</div>
              <div className="font-mono font-medium">$100 USDC</div>
            </div>
            <div className="rounded-lg bg-muted/20 p-2.5">
              <div className="text-[10px] text-muted-foreground mb-1">{copy.predictionWindow}</div>
              <div className="font-mono font-medium">4h</div>
            </div>
            <div className="rounded-lg bg-muted/20 p-2.5">
              <div className="text-[10px] text-muted-foreground mb-1">{copy.settlementType}</div>
              <div className="font-mono font-medium">{copy.binary}</div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            {copy.autoBetDesc}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub Components ──────────────────────────────────────────────

function SignalAggregatePanel({
  aggregate,
  signals,
  btcPrice,
  fundingRate,
  copy,
}: {
  aggregate: any
  signals: any[]
  btcPrice: number
  fundingRate: number
  copy: Record<string, string>
}) {
  const isUp = aggregate.upProb > 0.52
  const isDown = aggregate.downProb > 0.52
  const color = isUp ? 'emerald' : isDown ? 'red' : 'yellow'
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus

  return (
    <div className={cn(
      'rounded-2xl border-2 overflow-hidden',
      `border-${color}-500/30`
    )}>
      <div className={cn(
        'bg-gradient-to-r to-transparent px-5 py-4',
        isUp ? 'from-emerald-500/10' : isDown ? 'from-red-500/10' : 'from-yellow-500/10'
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
            `bg-${color}-500/20`
          )}>
            <Icon className={cn('w-6 h-6', `text-${color}-400`)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-lg font-bold', `text-${color}-400`)}>
                {aggregate.bias}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{copy.aggregate}</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="font-mono">BTC ${formatNumber(btcPrice)}</span>
              <span className="text-muted-foreground">|</span>
              <span className="font-mono text-emerald-400">Up {(aggregate.upProb * 100).toFixed(0)}%</span>
              <span className="font-mono text-red-400">Down {(aggregate.downProb * 100).toFixed(0)}%</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">{copy.funding} {(fundingRate * 100).toFixed(4)}%</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">{copy.confidence}</div>
            <div className={cn('text-xl font-bold font-mono', `text-${color}-400`)}>{aggregate.confidence}%</div>
          </div>
        </div>
      </div>

      {/* Signal sources */}
      <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {signals.map((sig: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {sig.direction === 'up' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : sig.direction === 'down' ? (
              <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="text-muted-foreground">{sig.source}</span>
            <span className={cn(
              'ml-auto font-mono text-[10px]',
              sig.direction === 'up' ? 'text-emerald-400' : sig.direction === 'down' ? 'text-red-400' : 'text-muted-foreground'
            )}>
              {sig.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MarketCard({ market, aggregate, copy }: { market: any; aggregate: any; copy: Record<string, string> }) {
  const timeLeft = market.timeRemainingMs
  const minutes = Math.floor(timeLeft / 60000)
  const seconds = Math.floor((timeLeft % 60000) / 1000)
  const timeStr = timeLeft > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : copy.ended
  const isExpired = timeLeft <= 0

  // Edge detection
  const upEdge = aggregate.upProb - market.upPrice
  const downEdge = aggregate.downProb - market.downPrice
  const hasEdge = Math.abs(upEdge) > 0.05 || Math.abs(downEdge) > 0.05
  const edgeSide = upEdge > downEdge ? 'Up' : 'Down'
  const edgeValue = Math.max(upEdge, downEdge)

  return (
    <div className={cn(
      'rounded-xl border p-3 transition-all',
      isExpired ? 'border-border/30 opacity-50' : hasEdge ? 'border-primary/40 bg-primary/5' : 'border-border/40'
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/15 text-primary">{market.windowLabel}</span>
          <span className="text-xs text-muted-foreground truncate">{market.question}</span>
        </div>
        <div className={cn('text-xs font-mono', isExpired ? 'text-muted-foreground' : 'text-amber-400')}>
          {timeStr}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 font-medium">UP</span>
            <span className="text-sm font-bold font-mono text-emerald-400">${market.upPrice.toFixed(2)}</span>
          </div>
          {market.up && (
            <div className="text-[10px] text-muted-foreground mt-1">
              Bid ${market.up.bestBid.toFixed(2)} · Ask ${market.up.bestAsk.toFixed(2)} · Spread {(market.up.spread * 100).toFixed(1)}c
            </div>
          )}
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-red-400 font-medium">DOWN</span>
            <span className="text-sm font-bold font-mono text-red-400">${market.downPrice.toFixed(2)}</span>
          </div>
          {market.down && (
            <div className="text-[10px] text-muted-foreground mt-1">
              Bid ${market.down.bestBid.toFixed(2)} · Ask ${market.down.bestAsk.toFixed(2)} · Spread {(market.down.spread * 100).toFixed(1)}c
            </div>
          )}
        </div>
      </div>

      {/* Edge / Arb indicators */}
      <div className="flex items-center gap-3 text-[10px]">
        <span className="text-muted-foreground">
          Up+Down = ${market.sumPrice.toFixed(3)}
        </span>
        {market.arbGap > 0.005 && (
          <span className="text-amber-400 font-medium">
            {copy.arbGap} {(market.arbGap * 100).toFixed(1)}%
          </span>
        )}
        {hasEdge && !isExpired && (
          <span className="text-primary font-medium ml-auto">
            {copy.signalEdge}: {edgeSide} {copy.maybeUndervalued} {(edgeValue * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  )
}

function SignalDirectionPanel({ aggregate, markets, copy }: { aggregate: any; markets: any[]; copy: Record<string, string> }) {
  const side = aggregate.upProb > 0.52 ? 'Up' : aggregate.downProb > 0.52 ? 'Down' : null
  const activeMarkets = markets.filter((m: any) => m.timeRemainingMs > 30000)

  if (!side || aggregate.confidence < 15) {
    return (
      <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-xs text-muted-foreground text-center">
        {copy.weakSignal}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {activeMarkets.map((m: any) => {
        const price = side === 'Up' ? m.upPrice : m.downPrice
        const ourProb = side === 'Up' ? aggregate.upProb : aggregate.downProb
        const edge = ourProb - price
        const worthIt = edge > 0.03

        return (
          <div key={m.slug} className={cn(
            'rounded-lg border p-2.5 text-xs',
            worthIt ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/40'
          )}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{m.windowLabel} · {copy.buy} {side}</span>
              <span className={cn('font-mono', worthIt ? 'text-emerald-400' : 'text-muted-foreground')}>
                ${price.toFixed(2)} → $1.00 ({worthIt ? `+${(edge * 100).toFixed(0)}% ${copy.edge}` : copy.noMaterialEdge})
              </span>
            </div>
            {worthIt && (
              <div className="text-[10px] text-emerald-400/70 mt-1">
                {copy.signal} {(ourProb * 100).toFixed(0)}% vs {copy.market} {(price * 100).toFixed(0)}% · {copy.payout} ${(1 - price).toFixed(2)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Wifi, WifiOff, Activity } from 'lucide-react'
import { RegimeIndicatorPro } from './RegimeIndicatorPro'
import { MetricCardPro } from './MetricCardPro'
import { OrderFlow } from './OrderFlow'
import { LiveTicker } from './LiveTicker'
import { LiquidationBar } from './LiquidationBar'
import { OrderBookDepth } from './OrderBookDepth'
import { FundingCountdown } from './FundingCountdown'
import { PositionVelocity } from './PositionVelocity'
import { RealtimeStats } from './RealtimeStats'
import { PositionChart } from '@/components/charts/PositionChart'
import { formatNumber } from '@/lib/utils'
import { fetchMetrics, fetchRealtime, fetchTrades } from '@/lib/client/dashboard'
import { useI18n } from '@/lib/i18n'

export function DashboardPro() {
  const { t, locale, localeTag } = useI18n()
  const tooltips = {
    en: { longs: 'Bitfinex BTC leverage longs total', ratio: 'Long/short position ratio', premium: 'Bitfinex vs Coinbase price spread', concentration: 'BTC USD borrowing ratio' },
    zh: { longs: 'Bitfinex BTC 杠杆多头总仓位', ratio: '多头与空头仓位比值', premium: 'Bitfinex vs Coinbase 价格差', concentration: 'BTC 使用的 USD 借贷占比' },
    vi: { longs: 'Tổng vị thế long BTC Bitfinex', ratio: 'Tỷ lệ long/short', premium: 'Chênh lệch giá Bitfinex vs Coinbase', concentration: 'Tỷ lệ vay USD cho BTC' },
  }[locale]
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    refetchInterval: 10000,
  })

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: fetchTrades,
    refetchInterval: 10000,
  })

  const {
    data: realtime,
    isLoading: realtimeLoading,
    error: realtimeError,
  } = useQuery({
    queryKey: ['realtime'],
    queryFn: fetchRealtime,
    refetchInterval: 10000,
  })

  const isLoading = metricsLoading || realtimeLoading
  const error = metricsError || realtimeError

  // 构建信号列表
  const getSignals = () => {
    if (!metrics || !realtime) return []
    const signals = []

    // 仓位变化信号
    if (realtime.positionVelocity.change24h > 0.5) {
      signals.push({ name: t('dashboard.signalNames.position24h'), value: '+' + realtime.positionVelocity.change24h.toFixed(2) + '%', status: 'positive' as const })
    } else if (realtime.positionVelocity.change24h < -0.5) {
      signals.push({ name: t('dashboard.signalNames.position24h'), value: realtime.positionVelocity.change24h.toFixed(2) + '%', status: 'negative' as const })
    }

    // 买卖压力
    if (realtime.orderBook.bidAskRatio > 1.2) {
      signals.push({ name: t('dashboard.signalNames.orderbook'), value: t('dashboard.signalNames.buyPressure'), status: 'positive' as const })
    } else if (realtime.orderBook.bidAskRatio < 0.8) {
      signals.push({ name: t('dashboard.signalNames.orderbook'), value: t('dashboard.signalNames.sellPressure'), status: 'negative' as const })
    }

    if (Math.abs(metrics.premium.premium) > 0.002) {
      signals.push({
        name: 'Premium',
        value: metrics.premium.premiumPct,
        status: metrics.premium.premium > 0 ? 'positive' as const : 'negative' as const,
      })
    }

    if (metrics.fundingBtc.annualizedRate > 30) {
      signals.push({ name: 'Funding', value: t('dashboard.signalNames.overheating'), status: 'warning' as const })
    }

    return signals
  }

  // 构建 Ticker 数据
  const tickerItems = realtime
    ? [
        {
          symbol: 'BTC/USD',
          price: realtime.ticker.lastPrice,
          change: realtime.ticker.dailyChangePerc * 100,
          volume: formatNumber(realtime.ticker.volume),
        },
        {
          symbol: t('dashboard.signalNames.bidAskRatio'),
          price: realtime.orderBook.bidAskRatio,
          change: realtime.orderBook.bidAskRatio > 1 ? (realtime.orderBook.bidAskRatio - 1) * 100 : -(1 - realtime.orderBook.bidAskRatio) * 100,
          volume: `${realtime.orderBook.bidTotal.toFixed(0)}/${realtime.orderBook.askTotal.toFixed(0)}`,
        },
        {
          symbol: 'Spread',
          price: realtime.orderBook.spread,
          change: 0,
          volume: `${realtime.orderBook.spreadPerc.toFixed(3)}%`,
        },
        {
          symbol: t('dashboard.signalNames.highLow24h'),
          price: realtime.ticker.high,
          change: 0,
          volume: `$${realtime.ticker.low.toLocaleString()}`,
        },
      ]
    : []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-muted-foreground">{t('dashboard.connectingSource')}</span>
        </div>
      </div>
    )
  }

  if (error || !metrics || !realtime) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <WifiOff className="w-16 h-16 text-red-500" />
        <p className="text-red-500 text-lg">{t('dashboard.connectionFailed')}</p>
        <p className="text-muted-foreground text-sm">{(error as Error)?.message}</p>
        <button
          onClick={() => refetchMetrics()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          {t('common.reconnect')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 实时 Ticker 条 */}
      <LiveTicker items={tickerItems} />

      {/* 实时价格统计 */}
      <RealtimeStats ticker={realtime.ticker} />

      {/* 头部状态栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">{t('dashboard.autoRefresh')}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="text-green-500 font-medium">{t('dashboard.realtimeConnected')}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(dataUpdatedAt).toLocaleTimeString(localeTag)}
          </div>
          <button
            onClick={() => refetchMetrics()}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Regime 指示器 */}
      <RegimeIndicatorPro
        regime={metrics.regime}
        explanation={metrics.regimeExplanation}
        confidence={metrics.regime === 'accumulation' ? 80 : metrics.regime === 'distribution' ? 85 : 60}
        signals={getSignals()}
      />

      {/* 24小时仓位变化图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PositionChart
          data={realtime.longHistory24h}
          title={`${t('dashboard.metricCards.btcLongs')} 24h`}
          color="green"
          height={150}
        />
        <PositionChart
          data={realtime.shortHistory24h}
          title="BTC Shorts 24h"
          color="red"
          height={150}
        />
      </div>

      {/* 主内容区域 - 3列布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：指标卡片 */}
        <div className="space-y-4">
          <MetricCardPro
            title={t('dashboard.metricCards.btcLongs')}
            value={metrics.btcLongs}
            unit="BTC"
            change={{ value: metrics.btcLongsChange7d, period: '7D' }}
            status={metrics.btcLongsChange7d > 0 ? 'positive' : 'negative'}
            statusLabel={realtime.positionVelocity.change1h > 0.01 ? t('dashboard.metricCards.increasing') : realtime.positionVelocity.change1h < -0.01 ? t('dashboard.metricCards.decreasing') : t('dashboard.metricCards.steady')}
            tooltip={tooltips.longs}
            showSparkle={realtime.positionVelocity.change1h > 0.05}
          />

          <MetricCardPro
            title={t('dashboard.metricCards.ratio')}
            value={`${metrics.longShortRatio > 1000 ? '∞' : metrics.longShortRatio.toFixed(0)}:1`}
            status={metrics.longShortRatio > 100 ? 'warning' : 'neutral'}
            statusLabel={metrics.longShortRatio > 100 ? t('dashboard.metricCards.extremelyBullish') : t('dashboard.metricCards.normal')}
            tooltip={tooltips.ratio}
          />

          <MetricCardPro
            title="Premium"
            value={metrics.premium.premiumPct}
            status={metrics.premium.status === 'ALERT' ? 'danger' : 'positive'}
            statusLabel={metrics.premium.status === 'ALERT' ? t('dashboard.metricCards.abnormal') : t('dashboard.metricCards.normal')}
            tooltip={tooltips.premium}
          />

          <MetricCardPro
            title={t('dashboard.metricCards.concentration')}
            value={`${(metrics.loanConcentration * 100).toFixed(1)}%`}
            status={metrics.loanConcentration > 0.95 ? 'warning' : 'neutral'}
            statusLabel={metrics.loanConcentration > 0.95 ? t('dashboard.metricCards.highlyConcentrated') : t('dashboard.metricCards.normal')}
            tooltip={tooltips.concentration}
          />
        </div>

        {/* 中间：订单簿深度 + 速度指标 */}
        <div className="space-y-4">
          <OrderBookDepth {...realtime.orderBook} />
          <PositionVelocity {...realtime.positionVelocity} />
        </div>

        {/* 右侧：Funding + 订单流 */}
        <div className="space-y-4">
          <FundingCountdown
            nextFundingTs={realtime.fundingCountdown.nextFundingTs}
            currentRate={realtime.fundingCountdown.currentRate}
            predictedRate={realtime.fundingCountdown.predictedRate}
          />
          <OrderFlow trades={trades} maxItems={15} />
        </div>
      </div>

      {/* 清算监控 */}
      <LiquidationBar
        liquidations={metrics.recentLiquidations}
        total24h={metrics.liquidation24hTotal}
      />

      {/* 底部统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-muted/50 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-2xl font-bold font-mono relative">${formatNumber(metrics.totalUsdFunding)}</div>
          <div className="text-sm text-muted-foreground relative">{t('dashboard.bottomStats.totalUsdFunding')}</div>
        </div>
        <div className="p-4 rounded-xl bg-muted/50 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-2xl font-bold font-mono relative">${formatNumber(metrics.btcUsdFunding)}</div>
          <div className="text-sm text-muted-foreground relative">{t('dashboard.bottomStats.btcUsed')}</div>
        </div>
        <div className="p-4 rounded-xl bg-muted/50 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-2xl font-bold font-mono relative">{formatNumber(metrics.btcShorts)}</div>
          <div className="text-sm text-muted-foreground relative">{t('dashboard.bottomStats.btcShorts')}</div>
        </div>
        <div className="p-4 rounded-xl bg-muted/50 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-2xl font-bold font-mono relative">{formatNumber(metrics.ethBtcLongs)}</div>
          <div className="text-sm text-muted-foreground relative">{t('dashboard.bottomStats.ethBtcLongs')}</div>
        </div>
      </div>
    </div>
  )
}

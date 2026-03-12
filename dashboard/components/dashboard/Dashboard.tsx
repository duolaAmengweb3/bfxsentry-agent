'use client'

import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { RegimeIndicator } from './RegimeIndicator'
import { PremiumModule } from './PremiumModule'
import { LongsModule } from './LongsModule'
import { FundingModule } from './FundingModule'
import { LongShortRatioModule } from './LongShortRatioModule'
import { ConcentrationModule } from './ConcentrationModule'
import { EthBtcPhaseModule } from './EthBtcPhaseModule'
import { LiquidationBar } from './LiquidationBar'
import type { DashboardMetrics, ApiResponse } from '@/types'
import { useI18n } from '@/lib/i18n'

async function fetchMetrics(): Promise<DashboardMetrics> {
  const res = await fetch('/api/metrics')
  const data: ApiResponse<DashboardMetrics> = await res.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to fetch metrics')
  }

  return data.data
}

export function Dashboard() {
  const { localeTag } = useI18n()
  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    refetchInterval: 15000,
  })
  const copy = localeTag === 'zh-CN'
    ? {
        loading: '加载数据中...',
        failed: '加载失败',
        retry: '重试',
        updatedAt: '最后更新',
        refresh: '刷新',
        events: '事件流',
        filter: '筛选',
        empty: '暂无事件记录',
      }
    : localeTag === 'vi-VN'
    ? {
        loading: 'Dang tai du lieu...',
        failed: 'Tai du lieu that bai',
        retry: 'Thu lai',
        updatedAt: 'Cap nhat luc',
        refresh: 'Lam moi',
        events: 'Dong su kien',
        filter: 'Loc',
        empty: 'Chua co su kien',
      }
    : {
        loading: 'Loading data...',
        failed: 'Failed to load data',
        retry: 'Retry',
        updatedAt: 'Updated',
        refresh: 'Refresh',
        events: 'Event feed',
        filter: 'Filter',
        empty: 'No events yet',
      }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>{copy.loading}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500">{copy.failed}: {(error as Error).message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          {copy.retry}
        </button>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {copy.updatedAt}: {new Date(dataUpdatedAt).toLocaleTimeString(localeTag)}
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {copy.refresh}
        </button>
      </div>

      <RegimeIndicator regime={data.regime} explanation={data.regimeExplanation} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <LongsModule
          longs={data.btcLongs}
          shorts={data.btcShorts}
          change7d={data.btcLongsChange7d}
          longShortRatio={data.longShortRatio}
        />

        <PremiumModule data={data.premium} />

        <LongShortRatioModule
          ratio={data.longShortRatio}
          longs={data.btcLongs}
          shorts={data.btcShorts}
        />

        <FundingModule btc={data.fundingBtc} eth={data.fundingEth} />

        <ConcentrationModule
          concentration={data.loanConcentration}
          totalUsd={data.totalUsdFunding}
          btcUsed={data.btcUsdFunding}
        />

        <EthBtcPhaseModule
          longs={data.ethBtcLongs}
          phase={data.ethBtcPhase}
          phaseDuration={data.ethBtcPhaseDuration}
        />
      </div>

      <LiquidationBar
        liquidations={data.recentLiquidations}
        total24h={data.liquidation24hTotal}
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{copy.events}</h3>
          <button className="text-sm text-muted-foreground hover:text-foreground">
            {copy.filter}
          </button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          {copy.empty}
        </div>
      </div>
    </div>
  )
}

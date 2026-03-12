'use client'

import { MetricCard } from './MetricCard'
import type { FundingData } from '@/types'
import { useI18n } from '@/lib/i18n'

interface FundingModuleProps {
  btc: FundingData
  eth: FundingData
}

export function FundingModule({ btc, eth }: FundingModuleProps) {
  const { locale } = useI18n()
  // 年化超过 50% 视为过热
  const status = btc.annualizedRate > 50 ? 'warning' : btc.annualizedRate < 0 ? 'negative' : 'positive'
  const copy = {
    en: {
      statusLabel: btc.annualizedRate > 50 ? 'Crowded longs' : btc.annualizedRate < 0 ? 'Crowded shorts' : 'Healthy',
      tooltip: 'Perpetual funding rate. High rates imply crowded longs, negative rates imply crowded shorts.',
      btcAnnualized: 'BTC annualized',
      ethAnnualized: 'ETH annualized',
      cold: 'Cold',
      normal: 'Normal',
      hot: 'Hot',
    },
    zh: {
      statusLabel: btc.annualizedRate > 50 ? '多头拥挤' : btc.annualizedRate < 0 ? '空头拥挤' : '健康',
      tooltip: '永续合约资金费率。高费率表示多头拥挤，负费率表示空头拥挤。',
      btcAnnualized: 'BTC 年化',
      ethAnnualized: 'ETH 年化',
      cold: '冷',
      normal: '正常',
      hot: '过热',
    },
    vi: {
      statusLabel: btc.annualizedRate > 50 ? 'Long quá đông' : btc.annualizedRate < 0 ? 'Short quá đông' : 'Bình thường',
      tooltip: 'Funding rate của hợp đồng vĩnh cửu. Funding cao cho thấy long crowded, funding âm cho thấy short crowded.',
      btcAnnualized: 'BTC thường niên',
      ethAnnualized: 'ETH thường niên',
      cold: 'Lạnh',
      normal: 'Bình thường',
      hot: 'Quá nóng',
    },
  }[locale]

  return (
    <MetricCard
      title="Funding Rate"
      value={`${(btc.fundingRate * 100).toFixed(4)}%`}
      status={status}
      statusLabel={copy.statusLabel}
      tooltip={copy.tooltip}
    >
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{copy.btcAnnualized}</span>
          <span className={btc.annualizedRate > 30 ? 'text-yellow-500' : ''}>
            ~{btc.annualizedRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{copy.ethAnnualized}</span>
          <span className={eth.annualizedRate > 30 ? 'text-yellow-500' : ''}>
            ~{eth.annualizedRate.toFixed(1)}%
          </span>
        </div>

        {/* 温度计样式 */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{copy.cold}</span>
            <span>{copy.normal}</span>
            <span>{copy.hot}</span>
          </div>
          <div className="h-2 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-full relative">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-gray-800"
              style={{
                left: `${Math.min(Math.max(btc.annualizedRate / 100 * 100, 0), 100)}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
        </div>
      </div>
    </MetricCard>
  )
}

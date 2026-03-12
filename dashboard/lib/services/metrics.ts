import * as bitfinex from '@/lib/api/bitfinex'
import * as coinbase from '@/lib/api/coinbase'
import type {
  DashboardMetrics,
  WhaleRegime,
  PremiumData,
  FundingData,
  LiquidationData,
} from '@/types'

// Premium 阈值
const PREMIUM_THRESHOLD = 0.0025 // 0.25%

// 计算 Premium
export function calculatePremium(bfxPrice: number, cbPrice: number): PremiumData {
  const premium = (bfxPrice - cbPrice) / cbPrice
  const status = Math.abs(premium) >= PREMIUM_THRESHOLD ? 'ALERT' : 'NORMAL'

  return {
    bfxPrice,
    cbPrice,
    premium,
    premiumPct: (premium * 100).toFixed(4) + '%',
    status,
    timestamp: Date.now(),
  }
}

// 计算多空比
export function calculateLongShortRatio(longs: number, shorts: number): number {
  if (shorts === 0) return Infinity
  return longs / shorts
}

// 计算年化 Funding Rate
export function annualizeFundingRate(rate: number): number {
  // Bitfinex funding 每 8 小时结算一次，一年 = 3 * 365 次
  return rate * 3 * 365 * 100 // 返回百分比
}

// 判断 ETH/BTC 阶段
export function detectEthBtcPhase(
  history: { timestamp: number; value: number }[]
): 'BUILD' | 'UNWIND' | 'NEUTRAL' {
  if (history.length < 2) return 'NEUTRAL'

  // 计算最近 24 小时的斜率
  const recent = history.slice(0, 24)
  const first = recent[recent.length - 1]?.value || 0
  const last = recent[0]?.value || 0
  const change = (last - first) / first

  if (change > 0.02) return 'BUILD' // 增长 > 2%
  if (change < -0.03) return 'UNWIND' // 下降 > 3%
  return 'NEUTRAL'
}

// 计算 Regime
export function calculateRegime(params: {
  premium: number
  longShortRatio: number
  fundingRate: number
  loanConcentration: number
  longsChange7d: number
}): { regime: WhaleRegime; explanation: string } {
  const { premium, longShortRatio, fundingRate, loanConcentration, longsChange7d } = params

  let score = 0
  const reasons: string[] = []

  // Premium 分析
  if (premium < -0.003) {
    score -= 2
    reasons.push('Premium 异常负值')
  } else if (premium > 0.003) {
    score += 1
    reasons.push('Premium 正溢价')
  }

  // 多空比分析
  if (longShortRatio > 200) {
    score -= 1 // 极度拥挤可能是风险
    reasons.push('多空比极端偏多')
  } else if (longShortRatio > 50) {
    score += 1
    reasons.push('多头占优')
  }

  // Funding Rate 分析
  const annualizedFunding = annualizeFundingRate(fundingRate)
  if (annualizedFunding > 50) {
    score -= 1
    reasons.push('Funding 过热')
  } else if (annualizedFunding < 10) {
    score += 1
    reasons.push('Funding 健康')
  }

  // 借贷集中度
  if (loanConcentration > 0.95) {
    score -= 1
    reasons.push('杠杆高度集中')
  }

  // Longs 变化趋势
  if (longsChange7d > 0.03) {
    score += 1
    reasons.push('巨鲸增仓中')
  } else if (longsChange7d < -0.03) {
    score -= 1
    reasons.push('巨鲸减仓中')
  }

  // 判断 Regime
  let regime: WhaleRegime
  let explanation: string

  if (score >= 2) {
    regime = 'accumulation'
    explanation = '巨鲸吸筹信号明显：' + reasons.filter(r => !r.includes('风险') && !r.includes('过热')).join('、')
  } else if (score <= -2) {
    regime = 'distribution'
    explanation = '风险信号偏多：' + reasons.filter(r => r.includes('风险') || r.includes('过热') || r.includes('减仓') || r.includes('负值')).join('、')
  } else {
    regime = 'mixed'
    explanation = '市场信号混合，建议观望'
  }

  return { regime, explanation }
}

// 获取完整的 Dashboard 指标
export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    // 并行获取所有数据
    const [
      bfxBtcTicker,
      cbBtcPrice,
      btcLongs,
      btcShorts,
      ethBtcLongs,
      btcLongsHistory,
      ethBtcLongsHistory,
      usdFunding,
      btcUsdFunding,
      derivStatus,
      liquidations,
    ] = await Promise.all([
      bitfinex.getTicker('BTCUSD'),
      coinbase.getSpotPrice('BTC-USD'),
      bitfinex.getPositionLast('BTCUSD', 'long'),
      bitfinex.getPositionLast('BTCUSD', 'short'),
      bitfinex.getPositionLast('ETHBTC', 'long'),
      bitfinex.getPositionHistory('BTCUSD', 'long', '1h', 168), // 7 days
      bitfinex.getPositionHistory('ETHBTC', 'long', '1h', 72),
      bitfinex.getCreditSize('USD'),
      bitfinex.getCreditSizeBySymbol('USD', 'BTCUSD'),
      bitfinex.getDerivStatus(['tBTCF0:USTF0', 'tETHF0:USTF0']),
      bitfinex.getLiquidations(10),
    ])

    // 计算各项指标
    const premium = calculatePremium(bfxBtcTicker.lastPrice, cbBtcPrice.amount)
    const longShortRatio = calculateLongShortRatio(btcLongs.value, btcShorts.value)

    // 计算 7d 和 30d 变化
    const longs7dAgo = btcLongsHistory[167]?.value || btcLongsHistory[btcLongsHistory.length - 1]?.value || btcLongs.value
    const btcLongsChange7d = (btcLongs.value - longs7dAgo) / longs7dAgo

    // 借贷集中度
    const loanConcentration = btcUsdFunding.value / usdFunding.value

    // Funding 数据
    const btcDeriv = derivStatus.find(d => d.symbol.includes('BTC'))
    const ethDeriv = derivStatus.find(d => d.symbol.includes('ETH'))

    const fundingBtc: FundingData = {
      symbol: 'BTCUSD',
      fundingRate: btcDeriv?.fundingRate || 0,
      annualizedRate: annualizeFundingRate(btcDeriv?.fundingRate || 0),
      nextFundingTs: btcDeriv?.nextFundingTs || 0,
      derivPrice: btcDeriv?.derivPrice || 0,
      spotPrice: btcDeriv?.spotPrice || 0,
      timestamp: Date.now(),
    }

    const fundingEth: FundingData = {
      symbol: 'ETHUSD',
      fundingRate: ethDeriv?.fundingRate || 0,
      annualizedRate: annualizeFundingRate(ethDeriv?.fundingRate || 0),
      nextFundingTs: ethDeriv?.nextFundingTs || 0,
      derivPrice: ethDeriv?.derivPrice || 0,
      spotPrice: ethDeriv?.spotPrice || 0,
      timestamp: Date.now(),
    }

    // ETH/BTC 阶段检测
    const ethBtcPhase = detectEthBtcPhase(ethBtcLongsHistory)

    // Regime 计算
    const { regime, explanation: regimeExplanation } = calculateRegime({
      premium: premium.premium,
      longShortRatio,
      fundingRate: btcDeriv?.fundingRate || 0,
      loanConcentration,
      longsChange7d: btcLongsChange7d,
    })

    // 处理清算数据
    const recentLiquidations: LiquidationData[] = liquidations.map(l => ({
      id: l.posId,
      symbol: l.symbol,
      side: l.amount > 0 ? 'long' : 'short',
      amount: l.amount,
      price: l.actualPrice || l.basePrice,
      timestamp: l.timestamp,
    }))

    // 计算 24h 清算总量 (简化：使用最近 10 条估算)
    const liquidation24hTotal = recentLiquidations.reduce(
      (sum, l) => sum + l.amount * l.price,
      0
    )

    return {
      regime,
      regimeExplanation,

      btcPrice: bfxBtcTicker.lastPrice,
      btcLongs: btcLongs.value,
      btcShorts: btcShorts.value,
      btcLongsChange7d,
      btcLongsChange30d: btcLongsChange7d * 4, // 估算
      longShortRatio,

      premium,

      ethBtcLongs: ethBtcLongs.value,
      ethBtcPhase,
      ethBtcPhaseDuration: 0, // TODO: 计算持续时间

      fundingBtc,
      fundingEth,

      loanConcentration,
      totalUsdFunding: usdFunding.value,
      btcUsdFunding: btcUsdFunding.value,

      recentLiquidations,
      liquidation24hTotal,

      lastUpdate: Date.now(),
    }
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error)
    throw error
  }
}

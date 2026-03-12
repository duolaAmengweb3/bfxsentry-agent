import { NextResponse } from 'next/server'
import {
  fetchFundingStats,
  fetchDerivStatus,
  percentile,
} from '@/lib/api/market-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ─── Signal types ────────────────────────────────────────────────
interface OperationStep {
  step: number
  title: string
  detail?: string
}

interface Recommendation {
  action: 'lend' | 'dont_lever' | 'rate_drop' | 'wait'
  name: string
  confidence: number
  reasoning: string
  conditions: { label: string; met: boolean; value: string }[]
  advice?: string
  operations?: OperationStep[]
}

export async function GET() {
  try {
    const [stats, deriv] = await Promise.all([
      fetchFundingStats('fUSD', 168),
      fetchDerivStatus(),
    ])

    if (stats.length === 0) throw new Error('No funding stats data')

    const current = stats[0]
    const prev1h = stats[1] || current
    const prev24h = stats[23] || stats[stats.length - 1]

    // ── Core metrics ─────────────────────────────────────────
    const utilization = current.utilization
    const sortedRates = stats.map((s) => s.frr).sort((a, b) => a - b)
    const ratePercentile7d = percentile(current.frr, sortedRates)

    const rateChange1h = prev1h.frr > 0 ? (current.frr - prev1h.frr) / prev1h.frr : 0
    const supplyDelta24h = prev24h.totalAmount > 0 ? (current.totalAmount - prev24h.totalAmount) / prev24h.totalAmount : 0
    const utilChange1h = current.utilization - prev1h.utilization
    const annualizedFRR = current.frr * 365 * 100
    const derivAnnualized = deriv.fundingRate * 3 * 365 * 100

    // Supply tightness: how much spare capacity
    const spareCapacity = 1 - utilization
    const supplyRecovering = supplyDelta24h > 0.02 && utilChange1h < 0

    // ── Recommendation logic ─────────────────────────────────
    // Priority: lend > dont_lever > rate_drop > wait
    const conditions = {
      frrHigh: ratePercentile7d >= 0.75,
      frrVeryHigh: ratePercentile7d >= 0.90,
      usageHigh: utilization >= 0.80,
      usageVeryHigh: utilization >= 0.90,
      supplyTight: spareCapacity < 0.15,
      rateSpiking: rateChange1h > 0.05,
      supplyRecovering,
      rateLow: ratePercentile7d <= 0.30,
      usageLow: utilization <= 0.50,
    }

    let recommendation: Recommendation

    // Signal 1: Good for lending
    if (conditions.frrHigh && conditions.usageHigh && conditions.supplyTight) {
      const condList = [
        { label: 'FRR at 7-day high (>=P75)', met: conditions.frrHigh, value: `P${(ratePercentile7d * 100).toFixed(0)}` },
        { label: 'High utilization (>=80%)', met: conditions.usageHigh, value: `${(utilization * 100).toFixed(1)}%` },
        { label: 'Tight supply (remaining <15%)', met: conditions.supplyTight, value: `${(spareCapacity * 100).toFixed(1)}% remaining` },
        { label: 'FRR extremely high (>=P90)', met: conditions.frrVeryHigh, value: `P${(ratePercentile7d * 100).toFixed(0)}` },
      ]
      const suggestedRate = current.frr * 100
      const suggestedPeriod = conditions.frrVeryHigh ? 30 : 7
      recommendation = {
        action: 'lend',
        name: 'Good for Lending',
        confidence: conditions.frrVeryHigh ? 85 : 70,
        reasoning: `Funding market supply shortage: rate P${(ratePercentile7d * 100).toFixed(0)} (7-day), utilization ${(utilization * 100).toFixed(1)}%, only ${(spareCapacity * 100).toFixed(1)}% supply remaining. Borrowers are willing to pay high rates for leverage — lending now locks in high yields.`,
        conditions: condList,
        advice: `Current daily rate ${suggestedRate.toFixed(4)}%, annualized ~${annualizedFRR.toFixed(1)}%. Consider providing fUSD funding with a longer term to lock in returns.`,
        operations: [
          { step: 1, title: 'Go to Bitfinex Funding page', detail: 'Log in to Bitfinex -> select "Funding" in the top nav -> choose USD (fUSD) on the left' },
          { step: 2, title: 'Set lending rate', detail: `Suggested offer rate: ${suggestedRate.toFixed(4)}%/day (current FRR). For faster fills, set ${(suggestedRate * 0.95).toFixed(4)}%/day (slightly below FRR). When rates are extremely high, use FRR or higher` },
          { step: 3, title: 'Set lending amount', detail: 'Recommend splitting into batches, each no more than 20-30% of total available funds. Batching lets you capture better average returns across different rate tiers while reducing single-order risk' },
          { step: 4, title: 'Set duration', detail: `Suggested ${suggestedPeriod} days. ${conditions.frrVeryHigh ? 'Rates are extremely high — use a longer term to lock in high yields' : 'Rates are elevated but not extreme — a medium term balances yield and flexibility'}. Minimum 2 days, maximum 120 days` },
          { step: 5, title: 'Select Offer type and submit', detail: 'Choose "Offer" (not Bid). Verify rate, amount, and duration are correct, then click "Submit". Your order will enter the Funding Order Book awaiting a match' },
          { step: 6, title: 'Monitor and manage', detail: 'Check Funding -> Credits/Offers for active loans. Watch for rate changes — if rates keep declining, consider canceling unfilled offers and adjusting your rate' },
        ],
      }
    }
    // Signal 2: Avoid leverage
    else if (conditions.frrVeryHigh && conditions.usageVeryHigh) {
      const condList = [
        { label: 'FRR extremely high (>=P90)', met: conditions.frrVeryHigh, value: `P${(ratePercentile7d * 100).toFixed(0)}` },
        { label: 'Utilization extremely high (>=90%)', met: conditions.usageVeryHigh, value: `${(utilization * 100).toFixed(1)}%` },
        { label: 'Rate is spiking', met: conditions.rateSpiking, value: `1h change ${(rateChange1h * 100).toFixed(1)}%` },
        { label: 'Perp funding rate also elevated', met: derivAnnualized > 20, value: `annualized ${derivAnnualized.toFixed(1)}%` },
      ]
      recommendation = {
        action: 'dont_lever',
        name: 'Avoid Leverage',
        confidence: 80,
        reasoning: `Funding costs are extremely high: daily rate ${(current.frr * 100).toFixed(4)}% (annualized ${annualizedFRR.toFixed(1)}%), utilization ${(utilization * 100).toFixed(1)}%. Opening leveraged positions now carries excessive holding costs — profits will be quickly eroded by funding fees.`,
        conditions: condList,
        advice: `Daily holding cost ${(current.frr * 100).toFixed(4)}%, consuming ${(current.frr * 10 * 100).toFixed(2)}% of profits in just 10 days. Unless you have a very high-conviction short-term opportunity, avoid borrowing leverage at this time.`,
        operations: [
          { step: 1, title: 'Check existing leveraged positions', detail: 'Log in to Bitfinex -> go to Orders / Positions page. Check if you have any active Margin positions. Each position is being charged funding fees at the current rate' },
          { step: 2, title: 'Evaluate holding costs', detail: `Current daily rate ${(current.frr * 100).toFixed(4)}% — your leveraged positions are charged ~${(current.frr * 100).toFixed(4)}% per day in funding fees. 10-day cost: ${(current.frr * 10 * 100).toFixed(2)}%` },
          { step: 3, title: 'Consider reducing or closing positions', detail: 'If expected returns cannot cover funding costs, consider reducing or closing positions. Go to Trading page -> select position -> Close/Reduce' },
          { step: 4, title: 'Avoid opening new leveraged positions', detail: 'Until funding costs decline (watch for rate drop signals), do not open new Margin Trading positions. If you need to trade, use Exchange mode (no leverage)' },
          { step: 5, title: 'Reverse play: consider lending', detail: 'Since borrowing costs are high, lending yields are also high. Consider moving idle USD to your Funding Wallet and follow the "Good for Lending" signal' },
        ],
      }
    }
    // Signal 3: Rate about to decline
    else if (conditions.supplyRecovering) {
      const condList = [
        { label: '24h supply increasing (>2%)', met: supplyDelta24h > 0.02, value: `+${(supplyDelta24h * 100).toFixed(1)}%` },
        { label: 'Utilization starting to drop', met: utilChange1h < 0, value: `${(utilChange1h * 100).toFixed(2)}pp/h` },
        { label: 'Current rate still elevated', met: conditions.frrHigh, value: `P${(ratePercentile7d * 100).toFixed(0)}` },
      ]
      recommendation = {
        action: 'rate_drop',
        name: 'Rate About to Decline',
        confidence: 60,
        reasoning: `Supply is recovering quickly (+${(supplyDelta24h * 100).toFixed(1)}%/24h) and utilization is starting to ease. Funding pressure is about to subside — rates will likely trend downward.`,
        conditions: condList,
        advice: `Lenders: shorten your offer duration to avoid being locked into a declining rate. Borrowers: consider waiting 1-2 hours before borrowing — costs should be lower.`,
        operations: [
          { step: 1, title: 'Lenders: shorten offer duration', detail: 'Go to Funding -> check Active Offers. Consider canceling long-duration (>7 day) offers and switching to 2-3 day short-term offers to avoid being locked into a declining rate' },
          { step: 2, title: 'Lenders: lower offer rate', detail: `Current FRR ${(current.frr * 100).toFixed(4)}%/day. Set your offer rate to 90-95% of FRR to ensure fills, since offers above market may not match during a rate decline` },
          { step: 3, title: 'Borrowers: wait before borrowing', detail: 'If you plan to open leveraged positions, wait 1-2 hours to observe rate changes. Rates are likely to drop as supply recovers, so waiting will reduce your holding costs' },
          { step: 4, title: 'Continue monitoring', detail: 'Watch whether utilization keeps declining. Once utilization drops below 80% and the rate falls below P50, the funding environment will return to the "normal" range' },
        ],
      }
    }
    // Default: Normal conditions
    else {
      const condList = [
        { label: 'FRR elevated (>=P75)', met: conditions.frrHigh, value: `P${(ratePercentile7d * 100).toFixed(0)}` },
        { label: 'High utilization (>=80%)', met: conditions.usageHigh, value: `${(utilization * 100).toFixed(1)}%` },
        { label: 'Tight supply (<15%)', met: conditions.supplyTight, value: `${(spareCapacity * 100).toFixed(1)}% remaining` },
        { label: 'Rate is changing', met: Math.abs(rateChange1h) > 0.03, value: `${(rateChange1h * 100).toFixed(1)}%/h` },
      ]
      recommendation = {
        action: 'wait',
        name: 'Normal Funding Conditions',
        confidence: 30,
        reasoning: `Funding market is normal: rate P${(ratePercentile7d * 100).toFixed(0)}, utilization ${(utilization * 100).toFixed(1)}%, leverage costs are within a normal range. No need to adjust strategy based on funding conditions.`,
        conditions: condList,
      }
    }

    // ── History for chart ────────────────────────────────────
    const history = stats
      .slice(0, 72)
      .map((s) => ({ ts: s.timestamp, frr: s.frr, util: s.utilization }))
      .reverse()

    return NextResponse.json({
      success: true,
      data: {
        recommendation,
        current: {
          frr: current.frr,
          frrAnnualized: annualizedFRR,
          utilization,
          totalAmount: current.totalAmount,
          usedAmount: current.usedAmount,
          avgPeriod: current.avgPeriod,
        },
        percentiles: { rate7d: ratePercentile7d },
        changes: { rateChange1h, utilChange1h, supplyDelta24h },
        derivFunding: {
          rate: deriv.fundingRate,
          annualized: derivAnnualized,
          nextFundingTs: deriv.nextFundingTs,
        },
        history,
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Funding Radar Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() },
      { status: 500 }
    )
  }
}

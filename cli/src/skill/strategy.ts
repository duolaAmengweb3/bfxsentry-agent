import chalk from 'chalk'
import { loadConfig } from '../core/config.js'
import { getRecentDecisions } from '../core/decision-log.js'

const STRATEGY_NAMES: Record<string, string> = {
  'smart-follow': '聪明钱跟单',
  'funding-arb': '融资套利',
  'liq-hunter': '爆仓猎人',
  'ob-sniper': '盘口狙击',
  'pm-hedge': 'PM 信号下注',
}

export async function strategyCommand(name?: string, options?: { config?: string }) {
  const cfg = loadConfig(options?.config)

  console.log('')
  console.log(chalk.bold.cyan('  BfxSentry · 策略状态'))
  console.log('')

  const strategies = [
    { key: 'smart_follow', id: 'smart-follow' },
    { key: 'funding_arb', id: 'funding-arb' },
    { key: 'liq_hunter', id: 'liq-hunter' },
    { key: 'ob_sniper', id: 'ob-sniper' },
    { key: 'pm_hedge', id: 'pm-hedge' },
  ]

  for (const s of strategies) {
    if (name && s.id !== name) continue

    const sCfg = (cfg as unknown as Record<string, Record<string, unknown>>)[s.key]
    const enabled = sCfg?.enabled
    const interval = sCfg?.tick_interval
    const icon = enabled ? chalk.green('ON') : chalk.red('OFF')

    console.log(`  ${icon}  ${chalk.bold((STRATEGY_NAMES[s.id] || s.id).padEnd(12))}  间隔 ${interval}s`)

    // Show recent decisions for this strategy
    const decisions = getRecentDecisions(5).filter(d => d.strategy === s.id)
    if (decisions.length > 0) {
      for (const d of decisions.slice(0, 3)) {
        const time = new Date(d.timestamp).toLocaleTimeString()
        const action = d.intent ? `${d.intent.direction} ${d.intent.confidence.toFixed(0)}%` : '无操作'
        const risk = d.riskFilterResult.passed ? chalk.green('通过') : chalk.red(d.riskFilterResult.reason || '拒绝')
        console.log(chalk.dim(`       ${time}  ${action}  风控: ${risk}`))
      }
    }
    console.log('')
  }
}

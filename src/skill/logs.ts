import chalk from 'chalk'
import { getRecentDecisions } from '../core/decision-log.js'

export async function logsCommand(options: { level?: string; limit?: string }) {
  const limit = parseInt(options.limit || '20')
  const decisions = getRecentDecisions(limit)

  console.log('')
  console.log(chalk.bold.cyan('  BfxSentry · 交易日志'))
  console.log('')

  if (decisions.length === 0) {
    console.log(chalk.dim('  暂无交易记录。运行 sentry start 后将自动记录。'))
    console.log('')
    return
  }

  for (const d of decisions) {
    const time = new Date(d.timestamp).toLocaleString()
    const hasIntent = d.intent !== null
    const passed = d.riskFilterResult.passed

    let icon: string
    if (!hasIntent) icon = chalk.dim('·')
    else if (passed) icon = chalk.green('V')
    else icon = chalk.red('X')

    const dir = d.intent?.direction || '-'
    const conf = d.intent ? `${d.intent.confidence.toFixed(0)}%` : '-'
    const reason = !passed ? chalk.dim(d.riskFilterResult.reason || '') : ''
    const pnl = d.pnlAtExit !== undefined
      ? (d.pnlAtExit >= 0 ? chalk.green(`+$${d.pnlAtExit.toFixed(2)}`) : chalk.red(`$${d.pnlAtExit.toFixed(2)}`))
      : ''

    if (options.level === 'warn' && passed) continue

    console.log(`  ${icon} ${time}  ${d.strategy.padEnd(14)} ${dir.padEnd(6)} ${conf.padEnd(5)} ${pnl} ${reason}`)
  }
  console.log('')
}

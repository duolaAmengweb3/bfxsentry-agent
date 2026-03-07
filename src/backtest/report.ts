import chalk from 'chalk'
import type { BacktestResult } from './runner.js'

export function printBacktestReport(result: BacktestResult) {
  const { summary, period, trades } = result

  console.log('')
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════'))
  console.log(chalk.bold.cyan('  BfxSentry · 回测报告'))
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════'))
  console.log('')

  console.log(`  策略: ${chalk.bold(result.strategy)}`)
  console.log(`  区间: ${new Date(period.start).toLocaleDateString()} — ${new Date(period.end).toLocaleDateString()} (${period.days} 天)`)
  console.log(`  快照数: ${result.snapshotsUsed}`)
  console.log('')

  console.log(chalk.bold('  ── 绩效概览 ──'))
  console.log('')

  const pnlColor = summary.totalPnl >= 0 ? chalk.green : chalk.red
  console.log(`  总交易: ${summary.totalTrades}`)
  console.log(`  胜/负:  ${chalk.green(String(summary.wins))} / ${chalk.red(String(summary.losses))}`)
  console.log(`  胜率:   ${(summary.winRate * 100).toFixed(1)}%`)
  console.log(`  总 PnL: ${pnlColor('$' + summary.totalPnl.toFixed(2))}`)
  console.log(`  均 PnL: $${summary.avgPnl.toFixed(2)}`)
  console.log(`  最大回撤: ${(summary.maxDrawdown * 100).toFixed(2)}%`)
  console.log(`  Sharpe:  ${summary.sharpeRatio.toFixed(2)}`)
  console.log('')

  if (trades.length > 0) {
    console.log(chalk.bold('  ── 最近交易 ──'))
    console.log('')
    console.log(chalk.dim('  时间               策略           方向   入场        出场        PnL'))
    console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────'))

    const recent = trades.slice(-15)
    for (const t of recent) {
      const dir = t.direction === 'long' ? chalk.green('多') : chalk.red('空')
      const pnl = t.pnl >= 0 ? chalk.green(`+$${t.pnl.toFixed(2)}`) : chalk.red(`-$${Math.abs(t.pnl).toFixed(2)}`)
      const time = new Date(t.timestamp).toLocaleString().padEnd(20)
      console.log(`  ${time} ${t.strategy.padEnd(14)} ${dir}   $${t.entryPrice.toFixed(0).padEnd(10)} $${t.exitPrice.toFixed(0).padEnd(10)} ${pnl}`)
    }
    console.log('')
  }

  if (trades.length === 0) {
    console.log(chalk.yellow('  没有录制数据可供回测。先运行 sentry start 采集数据。'))
    console.log('')
  }
}

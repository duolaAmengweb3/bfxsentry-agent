import chalk from 'chalk'
import type { BacktestResult } from './runner.js'
import type { OptimizeResult } from './optimizer.js'

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

  printSummary(summary)
  printTrades(trades)
}

export function printOptimizeReport(opt: OptimizeResult) {
  const { best, bestParams, topResults } = opt

  console.log('')
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════'))
  console.log(chalk.bold.cyan('  BfxSentry · 自动调参回测报告'))
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════'))
  console.log('')

  console.log(`  策略: ${chalk.bold(best.strategy)}`)
  console.log(`  区间: ${new Date(best.period.start).toLocaleDateString()} — ${new Date(best.period.end).toLocaleDateString()} (${best.period.days} 天)`)
  console.log(`  快照数: ${best.snapshotsUsed}`)
  console.log(`  参数组合: ${chalk.bold(String(opt.totalCombinations))} 种`)
  console.log('')

  // Default params result
  console.log(chalk.bold('  ── 默认参数 ──'))
  console.log('')
  const defS = opt.default.summary
  const defColor = defS.totalPnl >= 0 ? chalk.green : chalk.red
  console.log(`  交易: ${defS.totalTrades}  胜率: ${(defS.winRate * 100).toFixed(1)}%  PnL: ${defColor('$' + defS.totalPnl.toFixed(2))}  Sharpe: ${defS.sharpeRatio.toFixed(2)}`)
  console.log('')

  // Best params result
  console.log(chalk.bold.green('  ── 最优参数 ✓ ──'))
  console.log('')
  console.log(`  ${chalk.bold(bestParams)}`)
  console.log('')
  printSummary(best.summary)

  // Top 5
  if (topResults.length > 1) {
    console.log(chalk.bold('  ── Top 5 参数组合 ──'))
    console.log('')
    console.log(chalk.dim('  排名  PnL          胜率    交易数  Sharpe  参数'))
    console.log(chalk.dim('  ────────────────────────────────────────────────────────────'))
    for (let i = 0; i < topResults.length; i++) {
      const r = topResults[i]
      const pnlStr = r.pnl >= 0 ? chalk.green(`+$${r.pnl.toFixed(2)}`.padEnd(12)) : chalk.red(`-$${Math.abs(r.pnl).toFixed(2)}`.padEnd(12))
      const marker = i === 0 ? chalk.green(' ★') : '  '
      console.log(`${marker} #${i + 1}   ${pnlStr} ${(r.winRate * 100).toFixed(1).padStart(5)}%   ${String(r.trades).padStart(4)}    ${r.sharpe.toFixed(2).padStart(6)}  ${chalk.dim(r.params)}`)
    }
    console.log('')
  }

  // Trades for best result
  printTrades(best.trades)

  // Recommendation
  if (best.summary.totalPnl > 0 && best.summary.winRate > 0.4) {
    console.log(chalk.green.bold('  ✓ 找到盈利参数！可用 sentry config set 应用推荐配置'))
  } else if (best.summary.totalTrades === 0) {
    console.log(chalk.yellow('  该区间信号较弱，所有参数组合均未触发交易'))
  } else {
    console.log(chalk.yellow('  提示: 当前市场条件下策略表现一般，建议观望或延长回测区间'))
  }
  console.log('')
}

function printSummary(summary: BacktestResult['summary']) {
  const pnlColor = summary.totalPnl >= 0 ? chalk.green : chalk.red
  console.log(`  总交易: ${summary.totalTrades}`)
  console.log(`  胜/负:  ${chalk.green(String(summary.wins))} / ${chalk.red(String(summary.losses))}`)
  console.log(`  胜率:   ${(summary.winRate * 100).toFixed(1)}%`)
  console.log(`  总 PnL: ${pnlColor('$' + summary.totalPnl.toFixed(2))}`)
  console.log(`  均 PnL: $${summary.avgPnl.toFixed(2)}`)
  console.log(`  最大回撤: ${(summary.maxDrawdown * 100).toFixed(2)}%`)
  console.log(`  Sharpe:  ${summary.sharpeRatio.toFixed(2)}`)
  console.log('')
}

function printTrades(trades: BacktestResult['trades']) {
  if (trades.length > 0) {
    console.log(chalk.bold('  ── 交易记录 ──'))
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
}

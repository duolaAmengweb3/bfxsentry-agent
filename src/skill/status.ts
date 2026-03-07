import chalk from 'chalk'
import {
  getPositions, getDailyPnl, getDailyTrades,
  getConsecutiveLosses, getTotalPositionUsd,
  closePosition, closeAllPositions,
} from '../risk/position-manager.js'
import { getVarStats } from '../risk/var-calculator.js'

export async function positionCommand(action?: string, id?: string) {
  if (action === 'close' && id) {
    if (id === 'all' || id === '-all') {
      // Need current price — use last known
      const positions = getPositions()
      if (positions.length === 0) {
        console.log(chalk.yellow('\n  没有持仓\n'))
        return
      }
      const price = positions[0].currentPrice
      const pnl = closeAllPositions(price)
      console.log(chalk.yellow(`\n  全部平仓完成, PnL: $${pnl.toFixed(2)}\n`))
      return
    }

    const positions = getPositions()
    const pos = positions.find(p => p.id === id || p.id.startsWith(id))
    if (!pos) {
      console.log(chalk.red(`\n  找不到持仓 ${id}\n`))
      return
    }
    const pnl = closePosition(pos.id, pos.currentPrice, '手动平仓')
    console.log(chalk.yellow(`\n  平仓 ${pos.id}, PnL: $${pnl.toFixed(2)}\n`))
    return
  }

  const positions = getPositions()

  console.log('')
  console.log(chalk.bold.cyan('  BfxSentry · 持仓状态'))
  console.log('')

  // Summary
  const dailyPnl = getDailyPnl()
  const pnlColor = dailyPnl >= 0 ? chalk.green : chalk.red
  console.log(`  日 PnL: ${pnlColor('$' + dailyPnl.toFixed(2))}  |  交易: ${getDailyTrades()}  |  连亏: ${getConsecutiveLosses()}  |  总仓位: $${getTotalPositionUsd().toFixed(0)}`)

  const varStats = getVarStats()
  if (varStats.returnsCount > 0) {
    console.log(`  VaR(95%): $${varStats.var95.toFixed(2)}  |  最差回报: ${(varStats.worstReturn * 100).toFixed(2)}%`)
  }
  console.log('')

  if (positions.length === 0) {
    console.log(chalk.dim('  无持仓'))
    console.log('')
    return
  }

  console.log(chalk.dim('  ID                    策略         方向   入场       现价       PnL        止损       止盈'))
  console.log(chalk.dim('  ──────────────────────────────────────────────────────────────────────────────────────────'))

  for (const p of positions) {
    const dir = p.direction === 'long' ? chalk.green('多') : chalk.red('空')
    const pnl = p.unrealizedPnl >= 0
      ? chalk.green(`+$${p.unrealizedPnl.toFixed(2)}`)
      : chalk.red(`-$${Math.abs(p.unrealizedPnl).toFixed(2)}`)

    const idShort = p.id.length > 20 ? p.id.slice(0, 20) + '..' : p.id.padEnd(22)
    console.log(
      `  ${idShort} ${p.strategy.padEnd(12)} ${dir}   $${p.entryPrice.toFixed(0).padEnd(10)}$${p.currentPrice.toFixed(0).padEnd(10)}${pnl.padEnd(12)}$${p.stopLoss.toFixed(0).padEnd(10)}$${p.takeProfit.toFixed(0)}`
    )
  }
  console.log('')
}

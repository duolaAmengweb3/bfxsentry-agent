import chalk from 'chalk'
import { loadConfig } from '../core/config.js'
import { runOnce } from '../core/engine.js'
import { dryRunExecute } from '../executor/dry-run.js'
import { liveExecute } from '../executor/bitfinex-trader.js'
import { openPosition } from '../risk/position-manager.js'
import type { TradeIntent } from '../strategy/types.js'

export async function tradeCommand(
  direction: string,
  sizeStr: string,
  options: { stop?: string; tp?: string; config?: string },
) {
  if (direction !== 'long' && direction !== 'short') {
    console.log(chalk.red('\n  用法: sentry trade <long|short> <size_btc> [--stop 2%] [--tp 3%]\n'))
    return
  }

  const size = parseFloat(sizeStr)
  if (isNaN(size) || size <= 0) {
    console.log(chalk.red('\n  无效的仓位大小\n'))
    return
  }

  const cfg = loadConfig(options.config)
  const { snapshot } = await runOnce(cfg)
  const price = snapshot.ticker.lastPrice

  const stopPct = parseFloat(options.stop?.replace('%', '') || '2')
  const tpPct = parseFloat(options.tp?.replace('%', '') || '3')

  const intent: TradeIntent = {
    id: `manual-${Date.now()}`,
    strategy: 'manual',
    direction: direction as 'long' | 'short',
    instrument: cfg.collector.bitfinex.symbol,
    sizePct: (size * price / cfg.risk.max_total_position_usd) * 100,
    leverage: 1,
    entryPrice: price,
    stopLossPct: stopPct,
    takeProfitPct: tpPct,
    confidence: 100,
    reason: `手动 ${direction} ${size} BTC`,
    signalIds: [],
    timestamp: Date.now(),
  }

  console.log('')
  console.log(chalk.bold(`  手动交易: ${direction.toUpperCase()} ${size} BTC @ $${price.toLocaleString()}`))
  console.log(chalk.dim(`  止损: ${stopPct}% | 止盈: ${tpPct}%`))

  let result
  if (cfg.engine.mode === 'live') {
    result = await liveExecute(intent, cfg)
  } else {
    result = dryRunExecute(intent, snapshot)
  }

  if (result.success) {
    const pos = openPosition(intent, result)
    console.log(chalk.green(`  成交: $${result.fillPrice?.toFixed(2)} x ${result.fillSize?.toFixed(6)} BTC [${cfg.engine.mode}]`))
    if (pos) console.log(chalk.dim(`  持仓 ID: ${pos.id}`))
  } else {
    console.log(chalk.red(`  失败: ${result.error}`))
  }
  console.log('')
}

import chalk from 'chalk'
import { loadConfig } from '../core/config.js'
import { initLogger } from '../core/logger.js'
import { runBacktest } from '../backtest/runner.js'
import { printBacktestReport } from '../backtest/report.js'

export async function backtestCommand(
  strategy: string | undefined,
  options: { days?: string; config?: string },
) {
  initLogger('warn')
  const cfg = loadConfig(options.config)
  const days = parseInt(options.days || '7')

  console.log(chalk.dim(`\n  回测中... 策略: ${strategy || 'all'}, 天数: ${days}\n`))

  const result = await runBacktest(cfg, strategy, days)
  printBacktestReport(result)
}

import chalk from 'chalk'
import { loadConfig } from '../core/config.js'
import { initLogger } from '../core/logger.js'
import { runOptimizedBacktest } from '../backtest/optimizer.js'
import { printOptimizeReport } from '../backtest/report.js'

export async function backtestCommand(
  strategy: string | undefined,
  options: { days?: string; config?: string },
) {
  initLogger('warn')
  const cfg = loadConfig(options.config)
  const days = parseInt(options.days || '7')

  console.log(chalk.dim(`\n  自动调参回测中... 策略: ${strategy || 'all'}, 天数: ${days}\n`))

  const result = await runOptimizedBacktest(cfg, strategy, days, (msg) => {
    if (process.stderr.isTTY) {
      process.stderr.write(`\r  ${chalk.dim(msg)}`)
    }
  })
  if (process.stderr.isTTY) process.stderr.write('\r' + ' '.repeat(80) + '\r')

  printOptimizeReport(result)
}

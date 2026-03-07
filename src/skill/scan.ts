import chalk from 'chalk'
import { loadConfig } from '../core/config.js'
import { runOnce } from '../core/engine.js'
import type { Signal } from '../signal/types.js'

const LEVEL_ICON: Record<string, string> = {
  red: '🔴',
  yellow: '🟡',
  green: '🟢',
}

const DIR_LABEL: Record<string, string> = {
  long: '↑ 多',
  short: '↓ 空',
  neutral: '— 中性',
}

export async function scanCommand(options: { json?: boolean; config?: string }) {
  const cfg = loadConfig(options.config)

  let result
  try {
    result = await runOnce(cfg)
  } catch (err) {
    console.error(chalk.red(`\n  数据采集失败: ${(err as Error).message}`))
    console.error(chalk.dim('  请检查网络连接或代理设置 (Bitfinex API 可能需要代理)\n'))
    process.exit(1)
  }
  const { snapshot, signals } = result

  if (options.json) {
    console.log(JSON.stringify({ snapshot: { timestamp: snapshot.timestamp, price: snapshot.ticker.lastPrice }, signals }, null, 2))
    return
  }

  const price = snapshot.ticker.lastPrice
  const vol = snapshot.ticker.volume

  console.log('')
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════'))
  console.log(chalk.bold.cyan('  BfxSentry · 全市场扫描'))
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════'))
  console.log('')
  console.log(`  ${chalk.dim('BTC/USD')}  ${chalk.bold.white('$' + price.toLocaleString())}  ${chalk.dim('Vol')} ${vol.toFixed(1)} BTC  ${chalk.dim(new Date().toLocaleTimeString())}`)
  console.log('')

  // Group by module
  const modules = ['smart-money', 'funding', 'liquidation', 'orderbook'] as const
  const moduleNames: Record<string, string> = {
    'smart-money': '聪明钱雷达',
    'funding': '融资雷达',
    'liquidation': '爆仓猎人',
    'orderbook': '盘口狙击',
  }

  for (const mod of modules) {
    const modSignals = signals.filter(s => s.module === mod)
    if (modSignals.length === 0) continue

    console.log(chalk.bold(`  ── ${moduleNames[mod]} ──`))
    for (const s of modSignals) {
      printSignal(s)
    }
    console.log('')
  }

  // Summary
  const longSigs = signals.filter(s => s.direction === 'long')
  const shortSigs = signals.filter(s => s.direction === 'short')
  const strongSigs = signals.filter(s => s.confidence >= 60)

  console.log(chalk.dim('  ─────────────────────────────────────────────────'))
  console.log(`  ${chalk.bold('综合判断')}  多 ${chalk.green(String(longSigs.length))} · 空 ${chalk.red(String(shortSigs.length))} · 强信号 ${chalk.yellow(String(strongSigs.length))}`)

  if (strongSigs.length > 0) {
    const top = strongSigs.sort((a, b) => b.confidence - a.confidence)[0]
    console.log(`  ${chalk.bold('最强信号')}  ${LEVEL_ICON[top.level]} ${top.title} (${top.confidence.toFixed(0)}%)`)
  }
  console.log('')
}

function printSignal(s: Signal) {
  const icon = LEVEL_ICON[s.level] || '⚪'
  const dir = DIR_LABEL[s.direction] || s.direction
  const conf = s.confidence.toFixed(0).padStart(3)
  console.log(`    ${icon} ${chalk.bold(s.title.padEnd(14))} ${dir.padEnd(6)} ${chalk.dim('置信')} ${conf}%  ${chalk.dim(s.summary)}`)
}

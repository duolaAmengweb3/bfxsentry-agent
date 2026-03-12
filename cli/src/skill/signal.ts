import chalk from 'chalk'
import { loadConfig } from '../core/config.js'
import { runOnce, getEngineState } from '../core/engine.js'
import type { Signal } from '../signal/types.js'

const MODULE_NAMES: Record<string, string> = {
  'smart-money': '聪明钱雷达',
  'funding': '融资雷达',
  'liquidation': '爆仓猎人',
  'orderbook': '盘口狙击',
  'polymarket': 'PM 雷达',
}

export async function signalCommand(module?: string, options?: { config?: string }) {
  const cfg = loadConfig(options?.config)

  // Use cached state if available, otherwise fetch
  let signals: Signal[]
  const state = getEngineState()
  if (state.lastSignals.length > 0) {
    signals = state.lastSignals
  } else {
    const result = await runOnce(cfg)
    signals = result.signals
  }

  if (module) {
    signals = signals.filter(s => s.module === module)
    if (signals.length === 0) {
      console.log(chalk.yellow(`  没有找到模块 "${module}" 的信号`))
      return
    }
  }

  console.log('')
  console.log(chalk.bold.cyan('  BfxSentry · 信号详情'))
  console.log(chalk.dim(`  ${new Date().toLocaleString()}`))
  console.log('')

  const grouped = new Map<string, Signal[]>()
  for (const s of signals) {
    const arr = grouped.get(s.module) || []
    arr.push(s)
    grouped.set(s.module, arr)
  }

  for (const [mod, sigs] of grouped) {
    console.log(chalk.bold(`  ── ${MODULE_NAMES[mod] || mod} ──`))
    console.log('')

    for (const s of sigs) {
      const levelColor = s.level === 'red' ? chalk.red : s.level === 'yellow' ? chalk.yellow : chalk.green
      const dirIcon = s.direction === 'long' ? '↑' : s.direction === 'short' ? '↓' : '—'

      console.log(`  ${levelColor('●')} ${chalk.bold(s.title)}  [${s.id}]`)
      console.log(`    方向: ${dirIcon} ${s.direction}  |  置信度: ${s.confidence.toFixed(0)}%  |  级别: ${s.level}`)
      console.log(`    ${chalk.dim(s.summary)}`)

      // Print details
      const entries = Object.entries(s.details)
      if (entries.length > 0) {
        const detailStr = entries
          .filter(([, v]) => typeof v !== 'object')
          .map(([k, v]) => `${k}: ${typeof v === 'number' ? (v as number).toFixed(4) : v}`)
          .join('  |  ')
        if (detailStr) console.log(`    ${chalk.dim(detailStr)}`)
      }
      console.log('')
    }
  }
}

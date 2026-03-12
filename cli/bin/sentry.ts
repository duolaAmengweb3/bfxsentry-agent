#!/usr/bin/env node

import { Command } from 'commander'
import { writeFileSync, readFileSync, unlinkSync } from 'node:fs'
import { initLogger } from '../src/core/logger.js'
import { loadConfig } from '../src/core/config.js'
import { startEngine, stopEngine } from '../src/core/engine.js'
import { getPidPath } from '../src/core/paths.js'
import { scanCommand } from '../src/skill/scan.js'
import { signalCommand } from '../src/skill/signal.js'
import { strategyCommand } from '../src/skill/strategy.js'
import { positionCommand } from '../src/skill/status.js'
import { tradeCommand } from '../src/skill/trade.js'
import { backtestCommand } from '../src/skill/backtest.js'
import { configCommand } from '../src/skill/config.js'
import { logsCommand } from '../src/skill/logs.js'
import { getSkills, getSkillsByCategory } from '../src/skill/registry.js'

const PID_FILE = getPidPath()

function writePidFile() {
  try { writeFileSync(PID_FILE, String(process.pid)) } catch { /* ignore */ }
}

function removePidFile() {
  try { unlinkSync(PID_FILE) } catch { /* ignore */ }
}

function readPidFile(): number | null {
  try {
    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim())
    return isNaN(pid) ? null : pid
  } catch { return null }
}

function isProcessRunning(pid: number): boolean {
  try { process.kill(pid, 0); return true } catch { return false }
}

const program = new Command()

program
  .name('sentry')
  .description('BfxSentry Agent CLI — Bitfinex 信号驱动交易代理')
  .version('0.3.0')

// ── sentry skills ──
program
  .command('skills')
  .description('列出所有可用 Skill')
  .action(() => {
    console.log('\n  BfxSentry Agent · Skill 注册表\n')
    const categories = ['signal', 'strategy', 'trade', 'system'] as const
    const labels: Record<string, string> = {
      signal: '📡 信号',
      strategy: '🧠 策略',
      trade: '💰 交易',
      system: '⚙️  系统',
    }
    for (const cat of categories) {
      const items = getSkillsByCategory(cat)
      if (items.length === 0) continue
      console.log(`  ${labels[cat]}`)
      for (const s of items) {
        console.log(`    ${s.id.padEnd(12)} ${s.name.padEnd(10)} ${s.desc}`)
        console.log(`    ${''.padEnd(12)} ${s.usage}`)
      }
      console.log('')
    }
  })

// ── sentry scan ──
program
  .command('scan')
  .description('全市场一次性扫描, 不交易')
  .option('--json', 'JSON 输出')
  .option('-c, --config <path>', '自定义配置文件')
  .action(async (options) => {
    initLogger('silent')
    await scanCommand(options)
  })

// ── sentry signal ──
program
  .command('signal [module]')
  .description('查看信号详情 (smart-money|funding|liquidation|orderbook|polymarket)')
  .option('-c, --config <path>', '自定义配置文件')
  .action(async (module, options) => {
    initLogger('silent')
    await signalCommand(module, options)
  })

// ── sentry strategy ──
program
  .command('strategy [name]')
  .description('查看策略状态 (smart-follow|funding-arb|liq-hunter|ob-sniper|pm-hedge)')
  .option('-c, --config <path>', '自定义配置文件')
  .action(async (name, options) => {
    initLogger('silent')
    await strategyCommand(name, options)
  })

// ── sentry position ──
program
  .command('position [action] [id]')
  .description('持仓管理 (close <id> | close-all)')
  .action(async (action, id) => {
    initLogger('silent')
    await positionCommand(action, id)
  })

// ── sentry trade ──
program
  .command('trade <direction> <size>')
  .description('手动交易 (long|short <btc_size> [--stop 2%] [--tp 3%])')
  .option('--stop <pct>', '止损百分比', '2%')
  .option('--tp <pct>', '止盈百分比', '3%')
  .option('-c, --config <path>', '自定义配置文件')
  .action(async (direction, size, options) => {
    initLogger('silent')
    await tradeCommand(direction, size, options)
  })

// ── sentry backtest ──
program
  .command('backtest [strategy]')
  .description('回测策略 (liq-hunter|smart-follow|ob-sniper|funding-arb|pm-hedge)')
  .option('-d, --days <n>', '回测天数', '7')
  .option('-c, --config <path>', '自定义配置文件')
  .action(async (strategy, options) => {
    initLogger('silent')
    await backtestCommand(strategy, options)
  })

// ── sentry config ──
program
  .command('config <action> [args...]')
  .description('配置管理 (show | set <path> <value>)')
  .option('-c, --config <path>', '自定义配置文件')
  .action(async (action, args, options) => {
    initLogger('silent')
    await configCommand(action, args, options)
  })

// ── sentry logs ──
program
  .command('logs')
  .description('查看交易日志')
  .option('-l, --level <level>', '日志级别 (all|warn)', 'all')
  .option('-n, --limit <n>', '显示条数', '20')
  .action(async (options) => {
    initLogger('silent')
    await logsCommand(options)
  })

// ── sentry start ──
program
  .command('start')
  .description('启动 Agent (持续运行)')
  .option('-m, --mode <mode>', '运行模式 (dry-run|live)', 'dry-run')
  .option('-c, --config <path>', '自定义配置文件')
  .option('-i, --interval <sec>', 'Tick 间隔 (秒)', '10')
  .action(async (options) => {
    const cfg = loadConfig(options.config)
    cfg.engine.mode = options.mode
    initLogger(cfg.engine.log_level)

    console.log(`\n  BfxSentry Agent 启动中... (${cfg.engine.mode} 模式)\n`)

    writePidFile()

    let shuttingDown = false
    const shutdown = async () => {
      if (shuttingDown) return // prevent double shutdown
      shuttingDown = true
      console.log('\n  正在优雅停止 (等待 in-flight tick + 平仓)...')
      await stopEngine()
      removePidFile()
      process.exit(0)
    }
    process.on('SIGINT', () => { shutdown() })
    process.on('SIGTERM', () => { shutdown() })
    process.on('exit', removePidFile)

    await startEngine(cfg, parseInt(options.interval))
  })

// ── sentry stop ──
program
  .command('stop')
  .description('停止 Agent')
  .option('--force', '强制终止 (SIGKILL)')
  .action((options) => {
    const pid = readPidFile()
    if (!pid) {
      console.log('  未找到运行中的 Agent (PID 文件不存在)')
      return
    }
    if (!isProcessRunning(pid)) {
      console.log(`  Agent 进程 (PID ${pid}) 已不存在, 清理 PID 文件`)
      removePidFile()
      return
    }
    const signal = options.force ? 'SIGKILL' : 'SIGTERM'
    console.log(`  向 Agent (PID ${pid}) 发送 ${signal}...`)
    try {
      process.kill(pid, signal)
      console.log('  已发送停止信号')
    } catch (err) {
      console.error(`  停止失败: ${(err as Error).message}`)
    }
  })

program.parse()

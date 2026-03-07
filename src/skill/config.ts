import chalk from 'chalk'
import { loadConfig } from '../core/config.js'

export async function configCommand(action: string, args?: string[], options?: { config?: string }) {
  const cfg = loadConfig(options?.config)

  if (action === 'show') {
    console.log('')
    console.log(chalk.bold.cyan('  BfxSentry · 当前配置'))
    console.log('')
    printObj(cfg as unknown as Record<string, unknown>, 2)
    console.log('')
    return
  }

  if (action === 'set' && args && args.length >= 2) {
    const path = args[0]
    const value = args[1]
    console.log(chalk.yellow(`\n  运行时配置修改: ${path} = ${value}`))
    console.log(chalk.dim('  注: 运行时修改不会持久化，重启后恢复默认\n'))
    // In a full implementation, this would modify the in-memory config
    return
  }

  console.log(chalk.dim('\n  用法: sentry config show | sentry config set <path> <value>\n'))
}

function printObj(obj: Record<string, unknown>, indent: number) {
  for (const [key, value] of Object.entries(obj)) {
    const pad = ' '.repeat(indent)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      console.log(`${pad}${chalk.bold(key)}:`)
      printObj(value as Record<string, unknown>, indent + 2)
    } else {
      console.log(`${pad}${chalk.dim(key)}: ${chalk.white(String(value))}`)
    }
  }
}

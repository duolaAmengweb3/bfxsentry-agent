export interface SkillDef {
  id: string
  name: string
  desc: string
  usage: string
  examples: string[]
  category: 'signal' | 'strategy' | 'trade' | 'system'
}

const skills: SkillDef[] = [
  {
    id: 'scan',
    name: '全市场扫描',
    desc: '一次性采集市场数据并输出所有模块信号, 不执行交易',
    usage: 'sentry scan [--json] [-c <config>]',
    examples: ['sentry scan', 'sentry scan --json'],
    category: 'signal',
  },
  {
    id: 'signal',
    name: '信号查询',
    desc: '查看各模块当前信号详情',
    usage: 'sentry signal [module] [-c <config>]',
    examples: [
      'sentry signal',
      'sentry signal smart-money',
      'sentry signal liquidation',
      'sentry signal orderbook',
      'sentry signal funding',
      'sentry signal polymarket',
    ],
    category: 'signal',
  },
  {
    id: 'strategy',
    name: '策略状态',
    desc: '查看各策略启用状态、tick 间隔、最近决策记录',
    usage: 'sentry strategy [name] [-c <config>]',
    examples: [
      'sentry strategy',
      'sentry strategy smart-follow',
      'sentry strategy liq-hunter',
    ],
    category: 'strategy',
  },
  {
    id: 'position',
    name: '持仓管理',
    desc: '查看当前持仓、浮动 PnL, 手动平仓',
    usage: 'sentry position [close <id> | close-all]',
    examples: [
      'sentry position',
      'sentry position close pos-abc123',
      'sentry position close-all',
    ],
    category: 'trade',
  },
  {
    id: 'trade',
    name: '手动交易',
    desc: '手动提交做多/做空指令, 经风控过滤后执行',
    usage: 'sentry trade <long|short> <size_btc> [--stop <pct>] [--tp <pct>] [-c <config>]',
    examples: [
      'sentry trade long 0.01 --stop 2% --tp 3%',
      'sentry trade short 0.01 --stop 1.5%',
    ],
    category: 'trade',
  },
  {
    id: 'backtest',
    name: '回测',
    desc: '基于 SQLite 录制的市场快照回测策略, 生成胜率/PnL/Sharpe 报告',
    usage: 'sentry backtest [strategy] [-d <days>] [-c <config>]',
    examples: [
      'sentry backtest liq-hunter -d 7',
      'sentry backtest smart-follow -d 30',
    ],
    category: 'strategy',
  },
  {
    id: 'config',
    name: '配置管理',
    desc: '查看或修改运行配置',
    usage: 'sentry config <show|set> [path] [value] [-c <config>]',
    examples: [
      'sentry config show',
      'sentry config set liq_hunter.enabled false',
      'sentry config set risk.max_daily_loss_usd 500',
    ],
    category: 'system',
  },
  {
    id: 'logs',
    name: '决策日志',
    desc: '查看交易决策审计日志 (信号→意图→风控→执行)',
    usage: 'sentry logs [-l <level>] [-n <limit>]',
    examples: [
      'sentry logs',
      'sentry logs --level warn',
      'sentry logs -n 50',
    ],
    category: 'system',
  },
  {
    id: 'start',
    name: '启动 Agent',
    desc: '启动持续运行的交易代理, 支持 dry-run 和 live 模式',
    usage: 'sentry start [-m <mode>] [-i <interval>] [-c <config>]',
    examples: [
      'sentry start',
      'sentry start --mode live',
      'sentry start -i 5 -c config/phase1-safety.yaml',
    ],
    category: 'system',
  },
  {
    id: 'stop',
    name: '停止 Agent',
    desc: '优雅停止: 等待 in-flight tick → 交易所平仓 → 退出',
    usage: 'sentry stop [--force]',
    examples: [
      'sentry stop',
      'sentry stop --force',
    ],
    category: 'system',
  },
]

export function getSkills(): SkillDef[] {
  return skills
}

export function getSkill(id: string): SkillDef | undefined {
  return skills.find(s => s.id === id)
}

export function getSkillsByCategory(category: SkillDef['category']): SkillDef[] {
  return skills.filter(s => s.category === category)
}

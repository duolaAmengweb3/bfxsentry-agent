'use client'

import {
  Terminal, Download, Shield, Cpu, BarChart3, Zap, Database,
  GitBranch, ChevronRight, Copy, Check, RefreshCw, Power,
  Timer, AlertTriangle, Settings, ArrowDownUp, Clock, HardDrive,
  Github, BookOpen, Layers,
} from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

function CopyBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative group">
      <pre className="bg-black/60 border border-border/50 rounded-lg p-4 text-sm font-mono overflow-x-auto text-green-400/90 leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, badge }: { icon: React.ElementType; title: string; desc: string; badge?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
        {badge && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  )
}

function CommandRow({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">
      <code className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded whitespace-nowrap">{cmd}</code>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </div>
  )
}

function ConfigRow({ path, value, desc }: { path: string; value: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
      <code className="text-[11px] font-mono text-amber-400/90 whitespace-nowrap">{path}</code>
      <code className="text-[11px] font-mono text-emerald-400/80 whitespace-nowrap">{value}</code>
      <span className="text-[11px] text-muted-foreground ml-auto">{desc}</span>
    </div>
  )
}

export default function AgentCliPage() {
  const { locale } = useI18n()
  const t = {
    en: {
      heroSub: 'Signal-driven Bitfinex auto-trading agent',
      heroDesc: 'Standalone CLI tool independent of the Web Dashboard. Collects real-time market data from Bitfinex public API, generates trading signals through 5 strategy modules, and auto-executes after dual risk-control filtering. Supports dry-run simulation and live trading modes.',
      tags: ['Signal pipeline', '5 strategies', 'Dual risk control', 'Auto-tune', 'Idempotent retry', 'Graceful shutdown', 'State persistence', 'Event-driven'],
      quickInstall: 'Quick Install',
      corePipeline: 'Core Pipeline',
      pipelineSubs: ['Data collection', 'Event detection', 'Signal generation', 'Strategy evaluation', 'Dual risk control', 'Idempotent execution'],
      pipelineNote: 'Event layer detects liquidation cascades / wall breaks / extreme spreads, triggering instant tick insertion for strategy evaluation; scheduled ticks drive regular strategy dispatch, each with independent tick_interval.',
      features: [
        { t: '5 Strategy Modules', d: 'Smart-money follow, funding arbitrage, liquidation hunter, orderbook sniper, PM signal betting — pure functional design, zero fork between backtest & live, each with independent tick_interval' },
        { t: 'Dual Risk Control', d: 'Strategy-level limits + portfolio-level VaR / circuit breaker / trading session control / directional concentration. Phase 1 safety params auto-tighten' },
        { t: 'Event + Tick Hybrid', d: 'Liquidation cascade, wall break triggers instant tick; extreme spread auto-switches to limit-only for 60s to prevent slippage' },
        { t: 'Idempotent Retry', d: 'Same CID retries 3x (configurable), exponential backoff [1s,3s,5s]. Network errors auto-retry, exchange rejections terminate immediately' },
        { t: 'Graceful Shutdown', d: 'Stop waits for in-flight tick → exchange real close (live) → local ledger cleanup. PID file for cross-process control' },
        { t: 'State Persistence', d: 'Positions, risk state (daily loss/streak/circuit breaker) persisted to SQLite, auto-recovery on process restart' },
        { t: 'Snapshot Recording', d: 'Each tick records full market snapshot + signals to SQLite, supports offline backtest and decision audit trail' },
        { t: 'Decision Audit', d: 'Every strategy evaluation writes to decision_log: signal snapshot → intent → risk result → execution result, fully traceable' },
        { t: 'Auto-Tune Backtest', d: 'Pulls historical data directly from Bitfinex API, 225 parameter combinations auto-optimized, outputs optimal SL/TP/threshold config and Top 5 ranking' },
      ],
      cmdRef: 'Command Reference',
      cmdCatSignal: 'Signals & Scan',
      cmdCatStrategy: 'Strategy & Positions',
      cmdCatTrade: 'Trading & Engine',
      cmdCatBacktest: 'Backtest & Config',
      cmdDescs: {
        scan: 'Full market one-time scan, output all module signals',
        scanJson: 'JSON format output, suitable for pipeline processing',
        signal: 'View all module signal details',
        signalOb: 'View orderbook sniper signal only',
        strategy: 'All strategy status + recent decision records',
        position: 'Current positions + floating PnL',
        posClose: 'Manually close specified position',
        posCloseAll: 'Close all positions (live sends exchange orders)',
        tradeLong: 'Manually long 0.01 BTC',
        start: 'Start Agent (dry-run mode)',
        startLive: 'Live mode (requires API Key)',
        startI: 'Custom global tick interval 5 seconds',
        stop: 'Graceful stop: wait tick → close → exit',
        stopForce: 'Force terminate (SIGKILL)',
        backtest: 'Auto-tune backtest 7 days, output optimal config',
        configShow: 'View current full configuration',
        logs: 'Trading decision audit logs',
      },
      skillSystem: 'Skill System',
      viewFullDoc: 'View full docs',
      skillDesc: 'Each CLI command corresponds to a Skill, registered via skill/registry.ts. Run sentry skills to view all registered Skills.',
      skillCats: ['📡 Signal', '🧠 Strategy', '💰 Trading', '⚙️ System'],
      skillItems: {
        scan: { n: 'Market scan', d: 'Collect data + output signals, no trading' },
        signal: { n: 'Signal query', d: 'View signal details by module (smart-money/funding/liquidation/orderbook/polymarket)' },
        strategy: { n: 'Strategy status', d: 'Enabled status + tick interval + recent decisions' },
        backtest: { n: 'Auto-tune backtest', d: 'Pull API data, 225 param combos, output best config' },
        position: { n: 'Position management', d: 'View positions + manual close + close all' },
        trade: { n: 'Manual trade', d: 'Submit long/short, filtered by risk control' },
        startStop: { n: 'Engine control', d: 'Start (dry-run/live) / graceful shutdown' },
        config: { n: 'Config management', d: 'View or modify strategy/risk params at runtime' },
        logs: { n: 'Decision logs', d: 'Signal→intent→risk→execution full audit' },
        skills: { n: 'Skill list', d: 'List all registered Skills and usage' },
      },
      stratParams: 'Strategy Parameters',
      usageNote: 'Usage Note',
      usageNoteDesc: 'Shown are preset parameter templates. Recommended flow: backtest to find optimal params → dry-run to verify stability → switch to live.',
      usageDisclaimer: 'This page is for research and tool documentation only, not investment advice.',
      thStrategy: 'Strategy', thTrigger: 'Trigger', thPosition: 'Position', thLeverage: 'Leverage', thSlTp: 'SL/TP', thTick: 'Tick',
      strats: ['Smart Follow', 'Funding Arb', 'Liq Hunter', 'OB Sniper', 'PM Signal Bet'],
      riskConfig: 'Risk & Execution Config',
      riskLimits: 'Risk Limits',
      circuitBreaker: 'Circuit Breaker',
      execution: 'Execution',
      retryStrategy: 'Retry Strategy',
      cooldowns: 'Cooldowns',
      riskDescs: {
        maxPos: 'Max total position', maxDailyLoss: 'Max daily loss', maxTrades: 'Max daily trades',
        maxConcurrent: 'Max concurrent positions', maxSameDir: 'Same-direction limit', maxVar: 'Portfolio VaR limit',
        consLoss: 'Consecutive losses trigger', lossStreak: 'Loss streak amount trigger', cooldown: 'Circuit breaker cooldown',
        orderType: 'Order type (limit/market)', limitOffset: 'Limit offset', maxSlippage: 'Max slippage',
        conflictRes: 'Reverse conflict handling', retryMax: 'Max retry attempts', retryBackoff: 'Backoff intervals',
        retryOnMax: 'On max retry: alert+skip', sameDirCool: 'Same-direction cooldown', oppCool: 'Opposite-direction cooldown',
      },
      shutdownFlow: 'Graceful Shutdown Flow',
      shutdownSubs: ['stop command', 'Block new ticks', 'Wait in-flight', 'Exchange close', 'Write SQLite', 'Clean exit'],
      shutdownNote: 'In live mode, Close stage sends EXCHANGE MARKET reverse orders to Bitfinex for real closing; dry-run only cleans local ledger. Failed close orders are logged as warnings for manual handling.',
      eventDriven: 'Event-Driven Architecture',
      thEvent: 'Event', thTriggerCond: 'Trigger Condition', thResponse: 'System Response',
      eventDescs: ['1-min liquidation intensity ≥ P95', 'Large wall disappears + price breaks through', 'Bid-Ask spread > 0.1%'],
      eventResponses: ['Immediately triggers guardedTick → strategy evaluation', 'Immediately triggers guardedTick → strategy evaluation', 'Force switch to limit-only for 60 seconds'],
      eventNote: 'All event triggers go through guardedTick lock, ensuring only one tick executes at a time, preventing concurrent order placement.',
      demoScenarios: 'Demo Scenarios',
      demoDesc: 'The following scenarios show how Bitfinex Agent works in real markets. Each corresponds to a typical trading decision flow.',
      scenario: 'Scenario',
      scenarioTitles: ['Whale Alert Tracking — From Signal to Decision', 'Liquidation Cascade Snipe — Event-Driven Response', 'Auto-Tune Backtest — 225 Combo Optimization', 'Full Trading Flow — From Start to Take Profit', 'Risk Circuit Breaker — Consecutive Loss Protection'],
      user: 'User', agentAnalysis: 'Agent Analysis', agentSummary: 'Agent Summary',
      changelog: 'Changelog',
      footer: 'Data source: Bitfinex public API · Not investment advice, for research only · Bitfinex',
    },
    zh: {
      heroSub: '信号驱动的 Bitfinex 自动交易代理',
      heroDesc: '独立于 Web Dashboard 的命令行工具。从 Bitfinex 公开 API 采集实时市场数据，通过 5 大策略模块生成交易信号，经过双层风控过滤后自动执行。支持 dry-run 纸盘模拟和 live 实盘两种模式。',
      tags: ['信号管线', '5策略', '双层风控', '自动调参', '幂等重试', '优雅停机', '状态持久化', '事件驱动'],
      quickInstall: '快速安装',
      corePipeline: '核心管线',
      pipelineSubs: ['数据采集', '事件检测', '信号生成', '策略研判', '双层风控', '幂等执行'],
      pipelineNote: '事件层检测爆仓级联 / 墙突破 / 极端价差，触发即时 tick 插入策略评估；定时 tick 驱动常规策略调度，每策略独立 tick_interval。',
      features: [
        { t: '5 大策略模块', d: '聪明钱跟单、融资套利、爆仓猎人、盘口狙击、PM 信号下注 — 纯函数设计，回测与实盘零分叉，每策略独立 tick_interval' },
        { t: '双层风控', d: '策略级限额 + 组合级 VaR / 熔断 / 交易时段控制 / 方向集中度。Phase 1 安全参数自动收紧' },
        { t: '事件 + Tick 混合', d: '爆仓级联、墙突破触发即时 tick；极端价差自动切 limit-only 60 秒，防止滑点' },
        { t: '幂等重试', d: '同 CID 重试 3 次 (可配置)，指数退避 [1s,3s,5s]。网络异常自动重试，交易所拒绝立即终止' },
        { t: '优雅停机', d: 'stop 等待 in-flight tick → 交易所真实平仓 (live) → 本地账本清理。PID 文件跨进程控制' },
        { t: '状态持久化', d: '仓位、风控状态 (日亏损/连亏/熔断) 持久化到 SQLite，进程重启自动恢复，不丢失仓位' },
        { t: 'Snapshot 录制', d: '每 tick 录制完整市场快照 + 信号到 SQLite，支持离线回测和决策审计追踪' },
        { t: '决策审计', d: '每次策略评估写入 decision_log: 信号快照 → 意图 → 风控结果 → 执行结果，完整可追溯' },
        { t: '自动调参回测', d: '直接从 Bitfinex API 拉取历史数据, 225 种参数组合自动寻优, 输出最优 SL/TP/阈值配置和 Top 5 排名' },
      ],
      cmdRef: '命令速查',
      cmdCatSignal: '信号 & 扫描',
      cmdCatStrategy: '策略 & 持仓',
      cmdCatTrade: '交易 & 引擎',
      cmdCatBacktest: '回测 & 配置',
      cmdDescs: {
        scan: '全市场一次性扫描, 输出所有模块信号',
        scanJson: 'JSON 格式输出, 适合管道处理',
        signal: '查看所有模块信号详情',
        signalOb: '只看盘口狙击信号',
        strategy: '所有策略运行状态 + 最近决策记录',
        position: '当前持仓 + 浮动 PnL',
        posClose: '手动平仓指定持仓',
        posCloseAll: '全部平仓 (live 会发交易所单)',
        tradeLong: '手动做多 0.01 BTC',
        start: '启动 Agent (dry-run 模式)',
        startLive: '实盘模式 (需要 API Key)',
        startI: '自定义全局 tick 间隔 5 秒',
        stop: '优雅停止: 等待 tick → 平仓 → 退出',
        stopForce: '强制终止 (SIGKILL)',
        backtest: '自动调参回测 7 天, 输出最优配置',
        configShow: '查看当前完整配置',
        logs: '交易决策审计日志',
      },
      skillSystem: 'Skill 系统',
      viewFullDoc: '查看完整文档',
      skillDesc: '每个 CLI 命令对应一个 Skill，通过 skill/registry.ts 统一注册。运行 sentry skills 可查看所有已注册 Skill。',
      skillCats: ['📡 信号', '🧠 策略', '💰 交易', '⚙️ 系统'],
      skillItems: {
        scan: { n: '全市场扫描', d: '采集数据 + 输出信号, 不交易' },
        signal: { n: '信号查询', d: '按模块查看信号详情 (smart-money/funding/liquidation/orderbook/polymarket)' },
        strategy: { n: '策略状态', d: '启用状态 + tick 间隔 + 最近决策' },
        backtest: { n: '自动调参回测', d: '直接拉 API 数据, 225 组参数寻优, 输出最佳配置' },
        position: { n: '持仓管理', d: '查看持仓 + 手动平仓 + 全平' },
        trade: { n: '手动交易', d: '提交做多/做空, 经风控过滤后执行' },
        startStop: { n: '引擎控制', d: '启动 (dry-run/live) / 优雅停机' },
        config: { n: '配置管理', d: '查看或运行时修改策略/风控参数' },
        logs: { n: '决策日志', d: '信号→意图→风控→执行完整审计' },
        skills: { n: 'Skill 列表', d: '列出所有已注册 Skill 及用法' },
      },
      stratParams: '策略参数',
      usageNote: '使用说明',
      usageNoteDesc: '当前展示的是预置参数模板。建议流程：先回测筛选最佳参数组合，再运行 dry-run 模拟盘验证稳定性，最后再切换 live 实盘。',
      usageDisclaimer: '本页面信息仅供研究与工具使用说明，不构成任何投资建议。',
      thStrategy: '策略', thTrigger: '触发条件', thPosition: '仓位', thLeverage: '杠杆', thSlTp: '止损/止盈', thTick: 'Tick',
      strats: ['聪明钱跟单', '融资套利', '爆仓猎人', '盘口狙击', 'PM 信号下注'],
      riskConfig: '风控 & 执行配置',
      riskLimits: '风控限额',
      circuitBreaker: '熔断',
      execution: '执行',
      retryStrategy: '重试策略',
      cooldowns: '冷却',
      riskDescs: {
        maxPos: '总仓位上限', maxDailyLoss: '日亏损上限', maxTrades: '日交易次数上限',
        maxConcurrent: '最大并发持仓', maxSameDir: '同向集中度上限', maxVar: '组合 VaR 上限',
        consLoss: '连续亏损触发', lossStreak: '连亏金额触发', cooldown: '熔断冷却时间',
        orderType: '下单类型 (limit/market)', limitOffset: '限价偏移', maxSlippage: '最大滑点',
        conflictRes: '反向冲突处理', retryMax: '最大重试次数', retryBackoff: '退避间隔',
        retryOnMax: '达到上限: 告警+跳过', sameDirCool: '同向冷却', oppCool: '反向冷却',
      },
      shutdownFlow: '优雅停机流程',
      shutdownSubs: ['stop 命令', '阻止新 tick', '等 in-flight', '交易所平仓', '写入 SQLite', '清理退出'],
      shutdownNote: 'Live 模式下 Close 阶段向 Bitfinex 发送 EXCHANGE MARKET 反向单真实平仓；Dry-run 模式只清理本地账本。失败的平仓单会记录警告日志，提示需要手动处理。',
      eventDriven: '事件驱动机制',
      thEvent: '事件', thTriggerCond: '触发条件', thResponse: '系统响应',
      eventDescs: ['1分钟爆仓强度 ≥ P95', '大墙消失 + 价格突破', 'Bid-Ask 价差 > 0.1%'],
      eventResponses: ['立即触发 guardedTick → 策略评估', '立即触发 guardedTick → 策略评估', '强制切换 limit-only 60 秒'],
      eventNote: '所有事件触发都走 guardedTick 锁，保证同一时刻只有一个 tick 在执行，不会并发下单。',
      demoScenarios: '实战场景演示',
      demoDesc: '以下场景展示 Bitfinex Agent 如何在真实市场中工作。每个场景对应一个典型交易决策流程。',
      scenario: '场景',
      scenarioTitles: ['鲸鱼异动追踪 — 从信号到决策', '爆仓级联狙击 — 事件驱动实时响应', '自动调参回测 — 225 组合寻优', '完整交易流程 — 从启动到止盈', '风控熔断 — 连亏保护机制'],
      user: '用户', agentAnalysis: 'Agent 分析', agentSummary: 'Agent 总结',
      changelog: '更新日志',
      footer: '数据来源 Bitfinex 公开 API · 不构成任何投资建议，仅供研究参考 · Bitfinex',
    },
    vi: {
      heroSub: 'Agent giao dịch tự động Bitfinex dựa trên tín hiệu',
      heroDesc: 'Công cụ CLI độc lập với Web Dashboard. Thu thập dữ liệu thị trường thời gian thực từ Bitfinex API, tạo tín hiệu giao dịch qua 5 module chiến lược, tự động thực hiện sau khi lọc qua kiểm soát rủi ro kép. Hỗ trợ chế độ mô phỏng dry-run và giao dịch thật live.',
      tags: ['Pipeline tín hiệu', '5 chiến lược', 'Kiểm soát rủi ro kép', 'Tự điều chỉnh', 'Thử lại idempotent', 'Tắt máy graceful', 'Lưu trạng thái', 'Điều khiển sự kiện'],
      quickInstall: 'Cài đặt nhanh',
      corePipeline: 'Pipeline cốt lõi',
      pipelineSubs: ['Thu thập dữ liệu', 'Phát hiện sự kiện', 'Tạo tín hiệu', 'Đánh giá chiến lược', 'Kiểm soát rủi ro kép', 'Thực thi idempotent'],
      pipelineNote: 'Lớp sự kiện phát hiện chuỗi thanh lý / phá vỡ tường / chênh lệch cực đoan, kích hoạt tick tức thì; tick định kỳ điều phối chiến lược thường xuyên.',
      features: [
        { t: '5 Module chiến lược', d: 'Theo dõi smart-money, kinh doanh chênh lệch funding, săn thanh lý, bắn tỉa sổ lệnh, đặt cược PM — thiết kế hàm thuần, backtest và live không khác biệt' },
        { t: 'Kiểm soát rủi ro kép', d: 'Giới hạn cấp chiến lược + VaR cấp danh mục / ngắt mạch / kiểm soát phiên giao dịch' },
        { t: 'Sự kiện + Tick kết hợp', d: 'Chuỗi thanh lý, phá vỡ tường kích hoạt tick tức thì; chênh lệch cực đoan tự chuyển limit-only 60 giây' },
        { t: 'Thử lại idempotent', d: 'Cùng CID thử lại 3 lần, backoff [1s,3s,5s]. Lỗi mạng tự thử lại, sàn từ chối dừng ngay' },
        { t: 'Tắt máy graceful', d: 'Stop đợi tick đang chạy → đóng vị thế thật → dọn sổ cái. File PID điều khiển cross-process' },
        { t: 'Lưu trạng thái', d: 'Vị thế, trạng thái rủi ro lưu vào SQLite, tự phục hồi khi khởi động lại' },
        { t: 'Ghi snapshot', d: 'Mỗi tick ghi snapshot thị trường đầy đủ + tín hiệu vào SQLite' },
        { t: 'Kiểm toán quyết định', d: 'Mỗi đánh giá chiến lược ghi vào decision_log: snapshot → ý định → kết quả rủi ro → kết quả thực thi' },
        { t: 'Backtest tự điều chỉnh', d: 'Kéo dữ liệu lịch sử từ Bitfinex API, 225 tổ hợp tham số tự tối ưu, xuất cấu hình tốt nhất' },
      ],
      cmdRef: 'Tham khảo lệnh',
      cmdCatSignal: 'Tín hiệu & Quét',
      cmdCatStrategy: 'Chiến lược & Vị thế',
      cmdCatTrade: 'Giao dịch & Engine',
      cmdCatBacktest: 'Backtest & Cấu hình',
      cmdDescs: {
        scan: 'Quét toàn thị trường, xuất tín hiệu tất cả module',
        scanJson: 'Xuất JSON, phù hợp xử lý pipeline',
        signal: 'Xem chi tiết tín hiệu tất cả module',
        signalOb: 'Chỉ xem tín hiệu orderbook sniper',
        strategy: 'Trạng thái tất cả chiến lược + quyết định gần đây',
        position: 'Vị thế hiện tại + PnL chưa thực hiện',
        posClose: 'Đóng vị thế chỉ định thủ công',
        posCloseAll: 'Đóng tất cả vị thế',
        tradeLong: 'Long thủ công 0.01 BTC',
        start: 'Khởi động Agent (chế độ dry-run)',
        startLive: 'Chế độ live (cần API Key)',
        startI: 'Tùy chỉnh tick interval 5 giây',
        stop: 'Dừng graceful: đợi tick → đóng → thoát',
        stopForce: 'Buộc dừng (SIGKILL)',
        backtest: 'Backtest tự điều chỉnh 7 ngày',
        configShow: 'Xem cấu hình đầy đủ',
        logs: 'Nhật ký kiểm toán quyết định',
      },
      skillSystem: 'Hệ thống Skill',
      viewFullDoc: 'Xem tài liệu đầy đủ',
      skillDesc: 'Mỗi lệnh CLI tương ứng một Skill, đăng ký qua skill/registry.ts. Chạy sentry skills để xem tất cả Skill.',
      skillCats: ['📡 Tín hiệu', '🧠 Chiến lược', '💰 Giao dịch', '⚙️ Hệ thống'],
      skillItems: {
        scan: { n: 'Quét thị trường', d: 'Thu thập + xuất tín hiệu, không giao dịch' },
        signal: { n: 'Truy vấn tín hiệu', d: 'Xem chi tiết theo module' },
        strategy: { n: 'Trạng thái chiến lược', d: 'Trạng thái + tick interval + quyết định gần đây' },
        backtest: { n: 'Backtest tự điều chỉnh', d: 'Kéo API, 225 tổ hợp, xuất cấu hình tốt nhất' },
        position: { n: 'Quản lý vị thế', d: 'Xem + đóng thủ công + đóng tất cả' },
        trade: { n: 'Giao dịch thủ công', d: 'Gửi long/short, lọc qua kiểm soát rủi ro' },
        startStop: { n: 'Điều khiển engine', d: 'Khởi động (dry-run/live) / tắt graceful' },
        config: { n: 'Quản lý cấu hình', d: 'Xem hoặc sửa tham số runtime' },
        logs: { n: 'Nhật ký quyết định', d: 'Tín hiệu→ý định→rủi ro→thực thi kiểm toán đầy đủ' },
        skills: { n: 'Danh sách Skill', d: 'Liệt kê tất cả Skill đã đăng ký' },
      },
      stratParams: 'Tham số chiến lược',
      usageNote: 'Hướng dẫn sử dụng',
      usageNoteDesc: 'Đây là template tham số mặc định. Quy trình: backtest → dry-run xác minh → chuyển live.',
      usageDisclaimer: 'Thông tin chỉ để nghiên cứu, không phải lời khuyên đầu tư.',
      thStrategy: 'Chiến lược', thTrigger: 'Điều kiện', thPosition: 'Vị thế', thLeverage: 'Đòn bẩy', thSlTp: 'SL/TP', thTick: 'Tick',
      strats: ['Smart Follow', 'Funding Arb', 'Liq Hunter', 'OB Sniper', 'PM Signal Bet'],
      riskConfig: 'Rủi ro & Cấu hình thực thi',
      riskLimits: 'Giới hạn rủi ro',
      circuitBreaker: 'Ngắt mạch',
      execution: 'Thực thi',
      retryStrategy: 'Chiến lược thử lại',
      cooldowns: 'Thời gian chờ',
      riskDescs: {
        maxPos: 'Giới hạn tổng vị thế', maxDailyLoss: 'Giới hạn lỗ ngày', maxTrades: 'Giới hạn giao dịch ngày',
        maxConcurrent: 'Vị thế đồng thời tối đa', maxSameDir: 'Giới hạn cùng hướng', maxVar: 'Giới hạn VaR',
        consLoss: 'Kích hoạt lỗ liên tiếp', lossStreak: 'Kích hoạt số tiền lỗ', cooldown: 'Thời gian chờ ngắt mạch',
        orderType: 'Loại lệnh', limitOffset: 'Offset giá limit', maxSlippage: 'Trượt giá tối đa',
        conflictRes: 'Xử lý xung đột ngược', retryMax: 'Số lần thử lại tối đa', retryBackoff: 'Khoảng backoff',
        retryOnMax: 'Đạt giới hạn: cảnh báo+bỏ qua', sameDirCool: 'Chờ cùng hướng', oppCool: 'Chờ ngược hướng',
      },
      shutdownFlow: 'Quy trình tắt graceful',
      shutdownSubs: ['Lệnh stop', 'Chặn tick mới', 'Đợi đang chạy', 'Đóng vị thế sàn', 'Ghi SQLite', 'Thoát sạch'],
      shutdownNote: 'Chế độ live gửi lệnh đóng thật tới Bitfinex; dry-run chỉ dọn sổ cái nội bộ.',
      eventDriven: 'Kiến trúc điều khiển sự kiện',
      thEvent: 'Sự kiện', thTriggerCond: 'Điều kiện kích hoạt', thResponse: 'Phản hồi hệ thống',
      eventDescs: ['Cường độ thanh lý 1 phút ≥ P95', 'Tường lớn biến mất + giá phá vỡ', 'Spread Bid-Ask > 0.1%'],
      eventResponses: ['Kích hoạt guardedTick ngay → đánh giá chiến lược', 'Kích hoạt guardedTick ngay → đánh giá chiến lược', 'Buộc chuyển limit-only 60 giây'],
      eventNote: 'Tất cả sự kiện đi qua guardedTick lock, đảm bảo chỉ một tick chạy tại một thời điểm.',
      demoScenarios: 'Kịch bản demo',
      demoDesc: 'Các kịch bản sau cho thấy Agent hoạt động thế nào trong thị trường thực.',
      scenario: 'Kịch bản',
      scenarioTitles: ['Theo dõi cá voi — Từ tín hiệu đến quyết định', 'Bắn tỉa chuỗi thanh lý — Phản hồi sự kiện', 'Backtest tự điều chỉnh — 225 tổ hợp tối ưu', 'Quy trình đầy đủ — Từ khởi động đến chốt lời', 'Ngắt mạch rủi ro — Bảo vệ lỗ liên tiếp'],
      user: 'Người dùng', agentAnalysis: 'Phân tích Agent', agentSummary: 'Tóm tắt Agent',
      changelog: 'Nhật ký thay đổi',
      footer: 'Nguồn dữ liệu: Bitfinex API công khai · Không phải lời khuyên đầu tư · Bitfinex',
    },
  }[locale]!
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Hero */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card/80 to-card/60 p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Terminal className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Bitfinex Agent CLI</h1>
            <p className="text-sm text-muted-foreground">{t.heroSub}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="https://github.com/duolaAmengweb3/bfxsentry-agent"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 text-foreground/80 border border-border/60 hover:bg-white/15 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
            <a
              href="https://github.com/duolaAmengweb3/bfxsentry-agent/blob/main/SKILL.md"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              SKILL.md
            </a>
            <a
              href="https://www.npmjs.com/package/bfxsentry-agent"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors"
            >
              npm v0.3.3
            </a>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {t.heroDesc}
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {t.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Quick Install */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t.quickInstall}</h2>
        </div>
        <div className="space-y-3">
          <CopyBlock code={`# Install globally
npm install -g bfxsentry-agent

# Or run directly
npx bfxsentry-agent scan`} />
          <CopyBlock code={`# Bitfinex live trading — requires API Key (generate at bitfinex.com)
export BFX_API_KEY=your_key
export BFX_API_SECRET=your_secret
sentry start --mode live`} />
          <CopyBlock code={`# Polymarket auto-betting — integrated with official CLI (Rust)
# 1. Install Polymarket CLI
brew install polymarket-cli          # macOS
# or cargo install polymarket-cli    # build from source

# 2. Configure wallet authentication
polymarket auth                      # follow prompts to connect Polygon wallet

# 3. Auto-bet via polymarket market-order when Bitfinex signal hits threshold
sentry start --mode live             # PM signal betting strategy triggers automatically`} />
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Requires: Node.js 20+, automatically uses SOCKS5 proxy (127.0.0.1:7897) for Bitfinex API</div>
            <div>Polymarket betting requires separate official CLI install · scan/signal/backtest read-only commands need no API Key</div>
          </div>
        </div>
      </div>

      {/* Architecture */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <h2 className="font-semibold mb-4">{t.corePipeline}</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { label: 'Collector', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
            { label: 'Event', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
            { label: 'Signal', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
            { label: 'Strategy', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
            { label: 'Risk', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
            { label: 'Executor', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className={`px-3 py-2 rounded-lg border ${step.color}`}>
                <div className="font-semibold">{step.label}</div>
                <div className="opacity-70">{t.pipelineSubs[i]}</div>
              </div>
              {i < 5 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />}
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground">
          {t.pipelineNote}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { icon: Cpu, badge: undefined },
          { icon: Shield, badge: undefined },
          { icon: Zap, badge: 'v0.2' },
          { icon: RefreshCw, badge: 'v0.2' },
          { icon: Power, badge: 'v0.2' },
          { icon: HardDrive, badge: 'v0.2' },
          { icon: Database, badge: undefined },
          { icon: GitBranch, badge: undefined },
          { icon: BarChart3, badge: 'v0.3' },
        ].map((f, i) => (
          <FeatureCard key={i} icon={f.icon} title={t.features[i].t} desc={t.features[i].d} badge={f.badge} />
        ))}
      </div>

      {/* Commands */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t.cmdRef}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.cmdCatSignal}</h3>
            <CommandRow cmd="sentry scan" desc={t.cmdDescs.scan} />
            <CommandRow cmd="sentry scan --json" desc={t.cmdDescs.scanJson} />
            <CommandRow cmd="sentry signal" desc={t.cmdDescs.signal} />
            <CommandRow cmd="sentry signal orderbook" desc={t.cmdDescs.signalOb} />

            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">{t.cmdCatStrategy}</h3>
            <CommandRow cmd="sentry strategy" desc={t.cmdDescs.strategy} />
            <CommandRow cmd="sentry position" desc={t.cmdDescs.position} />
            <CommandRow cmd="sentry position close <id>" desc={t.cmdDescs.posClose} />
            <CommandRow cmd="sentry position close-all" desc={t.cmdDescs.posCloseAll} />
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.cmdCatTrade}</h3>
            <CommandRow cmd="sentry trade long 0.01 --stop 2%" desc={t.cmdDescs.tradeLong} />
            <CommandRow cmd="sentry start" desc={t.cmdDescs.start} />
            <CommandRow cmd="sentry start --mode live" desc={t.cmdDescs.startLive} />
            <CommandRow cmd="sentry start -i 5" desc={t.cmdDescs.startI} />
            <CommandRow cmd="sentry stop" desc={t.cmdDescs.stop} />
            <CommandRow cmd="sentry stop --force" desc={t.cmdDescs.stopForce} />

            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">{t.cmdCatBacktest}</h3>
            <CommandRow cmd="sentry backtest -d 7" desc={t.cmdDescs.backtest} />
            <CommandRow cmd="sentry config show" desc={t.cmdDescs.configShow} />
            <CommandRow cmd="sentry logs" desc={t.cmdDescs.logs} />
          </div>
        </div>
      </div>

      {/* Skill System */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t.skillSystem}</h2>
          <a
            href="https://github.com/duolaAmengweb3/bfxsentry-agent/blob/main/SKILL.md"
            target="_blank"
            rel="noopener"
            className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
          >
            {t.viewFullDoc}
          </a>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {t.skillDesc}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              cat: t.skillCats[0],
              color: 'border-blue-500/30',
              items: [
                { id: 'scan', name: t.skillItems.scan.n, desc: t.skillItems.scan.d },
                { id: 'signal', name: t.skillItems.signal.n, desc: t.skillItems.signal.d },
              ],
            },
            {
              cat: t.skillCats[1],
              color: 'border-amber-500/30',
              items: [
                { id: 'strategy', name: t.skillItems.strategy.n, desc: t.skillItems.strategy.d },
                { id: 'backtest', name: t.skillItems.backtest.n, desc: t.skillItems.backtest.d },
              ],
            },
            {
              cat: t.skillCats[2],
              color: 'border-emerald-500/30',
              items: [
                { id: 'position', name: t.skillItems.position.n, desc: t.skillItems.position.d },
                { id: 'trade', name: t.skillItems.trade.n, desc: t.skillItems.trade.d },
              ],
            },
            {
              cat: t.skillCats[3],
              color: 'border-purple-500/30',
              items: [
                { id: 'start / stop', name: t.skillItems.startStop.n, desc: t.skillItems.startStop.d },
                { id: 'config', name: t.skillItems.config.n, desc: t.skillItems.config.d },
                { id: 'logs', name: t.skillItems.logs.n, desc: t.skillItems.logs.d },
                { id: 'skills', name: t.skillItems.skills.n, desc: t.skillItems.skills.d },
              ],
            },
          ].map(group => (
            <div key={group.cat} className={`rounded-xl border ${group.color} bg-card/30 p-3`}>
              <div className="text-xs font-semibold mb-2">{group.cat}</div>
              <div className="space-y-2">
                {group.items.map(item => (
                  <div key={item.id} className="flex items-start gap-2">
                    <code className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
                      {item.id}
                    </code>
                    <div className="min-w-0">
                      <span className="text-xs font-medium">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategies Detail */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <h2 className="font-semibold mb-4">{t.stratParams}</h2>
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
          <div className="font-medium text-amber-300">{t.usageNote}</div>
          <div className="mt-1 text-muted-foreground">
            {t.usageNoteDesc}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {t.usageDisclaimer}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">{t.thStrategy}</th>
                <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">{t.thTrigger}</th>
                <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">{t.thPosition}</th>
                <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">{t.thLeverage}</th>
                <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">{t.thSlTp}</th>
                <th className="text-left py-2 font-semibold text-muted-foreground">{t.thTick}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              <tr>
                <td className="py-2.5 pr-4 font-medium">{t.strats[0]}</td>
                <td className="py-2.5 pr-4 text-muted-foreground">Score &ge;65, &ge;5 whales aligned</td>
                <td className="py-2.5 pr-4">8%</td>
                <td className="py-2.5 pr-4">2x</td>
                <td className="py-2.5 pr-4">2% / 1.5% trailing stop</td>
                <td className="py-2.5 text-muted-foreground">180s</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">{t.strats[1]}</td>
                <td className="py-2.5 pr-4 text-muted-foreground">FRR &ge;P75, utilization &ge;80%</td>
                <td className="py-2.5 pr-4">25%</td>
                <td className="py-2.5 pr-4">1x</td>
                <td className="py-2.5 pr-4">Exit on rate decline</td>
                <td className="py-2.5 text-muted-foreground">300s</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">{t.strats[2]}</td>
                <td className="py-2.5 pr-4 text-muted-foreground">Intensity &ge;P85, one-sided &gt;70%</td>
                <td className="py-2.5 pr-4">5%</td>
                <td className="py-2.5 pr-4">3x</td>
                <td className="py-2.5 pr-4">0.5% / 1%</td>
                <td className="py-2.5 text-muted-foreground">5s</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">{t.strats[3]}</td>
                <td className="py-2.5 pr-4 text-muted-foreground">Bid/Ask &ge;1.5x + trade flow confirm</td>
                <td className="py-2.5 pr-4">5%</td>
                <td className="py-2.5 pr-4">3x</td>
                <td className="py-2.5 pr-4">0.3% / 0.5%</td>
                <td className="py-2.5 text-muted-foreground">5s</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium">{t.strats[4]}</td>
                <td className="py-2.5 pr-4 text-muted-foreground">Agg confidence &ge;35% (4h optimal)</td>
                <td className="py-2.5 pr-4">$100 USDC</td>
                <td className="py-2.5 pr-4">1x</td>
                <td className="py-2.5 pr-4">5% / 10%</td>
                <td className="py-2.5 text-muted-foreground">15s</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk & Execution Config */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t.riskConfig}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <Shield className="w-3 h-3 inline mr-1" />{t.riskLimits}
            </h3>
            <ConfigRow path="max_total_position_usd" value="5000" desc={t.riskDescs.maxPos} />
            <ConfigRow path="max_daily_loss_usd" value="200" desc={t.riskDescs.maxDailyLoss} />
            <ConfigRow path="max_daily_trades" value="50" desc={t.riskDescs.maxTrades} />
            <ConfigRow path="max_concurrent_positions" value="3" desc={t.riskDescs.maxConcurrent} />
            <ConfigRow path="max_same_direction_pct" value="70%" desc={t.riskDescs.maxSameDir} />
            <ConfigRow path="max_portfolio_var_pct" value="3%" desc={t.riskDescs.maxVar} />

            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
              <AlertTriangle className="w-3 h-3 inline mr-1" />{t.circuitBreaker}
            </h3>
            <ConfigRow path="consecutive_losses" value="5" desc={t.riskDescs.consLoss} />
            <ConfigRow path="loss_streak_usd" value="300" desc={t.riskDescs.lossStreak} />
            <ConfigRow path="cooldown_minutes" value="60" desc={t.riskDescs.cooldown} />
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <ArrowDownUp className="w-3 h-3 inline mr-1" />{t.execution}
            </h3>
            <ConfigRow path="order_type" value="limit" desc={t.riskDescs.orderType} />
            <ConfigRow path="limit_offset_pct" value="0.02%" desc={t.riskDescs.limitOffset} />
            <ConfigRow path="max_slippage_pct" value="0.1%" desc={t.riskDescs.maxSlippage} />
            <ConfigRow path="conflict_resolution" value="conservative" desc={t.riskDescs.conflictRes} />

            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
              <RefreshCw className="w-3 h-3 inline mr-1" />{t.retryStrategy}
            </h3>
            <ConfigRow path="retry.max_attempts" value="3" desc={t.riskDescs.retryMax} />
            <ConfigRow path="retry.backoff_ms" value="[1000,3000,5000]" desc={t.riskDescs.retryBackoff} />
            <ConfigRow path="retry.on_max_retry" value="alert_and_skip" desc={t.riskDescs.retryOnMax} />

            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
              <Clock className="w-3 h-3 inline mr-1" />{t.cooldowns}
            </h3>
            <ConfigRow path="same_direction_cooldown_sec" value="300" desc={t.riskDescs.sameDirCool} />
            <ConfigRow path="opposite_signal_cooldown_sec" value="60" desc={t.riskDescs.oppCool} />
          </div>
        </div>
      </div>

      {/* Graceful Shutdown Flow */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Power className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t.shutdownFlow}</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">v0.2</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { label: 'SIGTERM', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
            { label: 'Lock', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
            { label: 'Await', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
            { label: 'Close', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
            { label: 'Persist', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
            { label: 'Exit', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className={`px-3 py-2 rounded-lg border ${step.color}`}>
                <div className="font-semibold">{step.label}</div>
                <div className="opacity-70">{t.shutdownSubs[i]}</div>
              </div>
              {i < 5 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />}
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground">
          {t.shutdownNote}
        </div>
      </div>

      {/* Event-Driven Architecture */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t.eventDriven}</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">v0.2</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">{t.thEvent}</th>
                <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">{t.thTriggerCond}</th>
                <th className="text-left py-2 font-semibold text-muted-foreground">{t.thResponse}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {[
                { name: 'liq_cascade', color: 'text-red-400' },
                { name: 'wall_break', color: 'text-amber-400' },
                { name: 'spread_extreme', color: 'text-purple-400' },
              ].map((evt, i) => (
                <tr key={evt.name}>
                  <td className={`py-2.5 pr-4 font-medium ${evt.color}`}>{evt.name}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{t.eventDescs[i]}</td>
                  <td className="py-2.5">{t.eventResponses[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground">
          {t.eventNote}
        </div>
      </div>

      {/* Demo Scenarios */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t.demoScenarios}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          {t.demoDesc}
        </p>

        {/* Scenario 1: Whale Alert */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">{t.scenario} 1</span>
            <span className="text-sm font-semibold">{t.scenarioTitles[0]}</span>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="text-[10px] text-primary font-semibold mb-1">{t.user}</div>
              <div className="text-xs">Any unusual BTC activity? Check what the whales are doing</div>
            </div>
            <CopyBlock code={`$ sentry scan --json
# Agent parses signals, finds smart-money confidence 72%, auto deep-dive

$ sentry signal smart-money

═══════════════════════════════════════════════════
  Smart Money Radar · Details
═══════════════════════════════════════════════════

  Direction: Long    Confidence: 72%    Score: 68/100

  ── Whale Activity ──
    Active whales: 8
    Long whales: 6 (75%)    ← significantly bullish
    Short whales: 2 (25%)
    Net position change: +142.3 BTC (past 1 hour)

  ── Smart Money Flow ──
    Large buys: $9.7M (3 orders)
    Large sells: $3.2M (1 order)
    Net inflow: +$6.5M

  ── Trigger Conditions ──
    ✓ Score 68 ≥ 65 threshold
    ✓ 6 whales aligned ≥ 5 minimum
    → smart-follow strategy triggered`} />
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
              <div className="text-[10px] text-emerald-400 font-semibold mb-1">{t.agentAnalysis}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Detected <span className="text-emerald-400 font-medium">strong whale buying signal</span>: 6 of 8 active whales are bullish, net inflow $6.5M.
                smart-follow strategy triggered, recommended direction<span className="text-emerald-400"> Long</span>, position 8% ($400), leverage 2x, stop-loss 2%, trailing take-profit 1.5%.
                Start Agent execution?
              </div>
            </div>
          </div>
        </div>

        {/* Scenario 2: Liquidation Cascade */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">{t.scenario} 2</span>
            <span className="text-sm font-semibold">{t.scenarioTitles[1]}</span>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="text-[10px] text-primary font-semibold mb-1">{t.user}</div>
              <div className="text-xs">BTC just dropped 3% sharply, any liquidation opportunities?</div>
            </div>
            <CopyBlock code={`$ sentry signal liquidation

═══════════════════════════════════════════════════
  Liquidation Hunter · Details
═══════════════════════════════════════════════════

  Direction: Long (contrarian)    Confidence: 81%    Intensity P92

  ── Liquidation Data ──
    1-min liquidation volume: $18.7M     ← abnormally high
    Long liquidation ratio: 89%          ← strongly one-sided
    Short liquidation ratio: 11%
    Cascade intensity: P92 (near P95 event trigger)

  ── Historical Comparison ──
    Current intensity vs past 24h: Top 3%
    Similar post-liquidation bounce probability: 73% (past 30 days)

  ── Strategy Decision ──
    ✓ Intensity P92 ≥ P85 threshold
    ✓ One-sided 89% > 70% minimum
    → liq-hunter recommends Long (contrarian bounce capture)
    ⚠ Stop-loss only 0.5%, quick in/out

$ sentry strategy liq-hunter
  Status: Triggered · Last decision: Long 0.05 BTC @ $65,420
  Stop-loss: $65,093 (-0.5%) · Take-profit: $66,074 (+1%)`} />
            <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
              <div className="text-[10px] text-red-400 font-semibold mb-1">{t.agentAnalysis}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Detected <span className="text-red-400 font-medium">liquidation cascade</span>: $18.7M long liquidations, intensity P92, one-sided ratio 89%.
                Historically, similar liquidations have a 73% bounce probability. liq-hunter triggered contrarian long, very tight 0.5% stop-loss.
                If intensity rises to P95, a <code className="bg-red-500/10 px-1 rounded">liq_cascade</code> event fires and Agent inserts an immediate tick evaluation.
              </div>
            </div>
          </div>
        </div>

        {/* Scenario 3: Auto-Optimize Backtest */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">{t.scenario} 3</span>
            <span className="text-sm font-semibold">{t.scenarioTitles[2]}</span>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="text-[10px] text-primary font-semibold mb-1">{t.user}</div>
              <div className="text-xs">Optimize the liquidation hunter parameters, find the best config for the past week</div>
            </div>
            <CopyBlock code={`$ sentry backtest liq-hunter -d 7

  Fetching 7-day historical data from Bitfinex API...
  ✓ 168 1h candles
  ✓ 12,847 historical trades
  ✓ Funding statistics

  Generating market snapshots... ✓ 168 snapshots
  Computing signals... ✓ 168 signal sets

  ═══════════════════════════════════════════════
  Starting parameter optimization · 225 combinations
  ═══════════════════════════════════════════════
  [████████████████████████████████████████] 225/225

  ── Default vs Optimal Parameters ──
  ┌─────────────┬──────────┬──────────┐
  │             │  Default  │  Optimal  │
  ├─────────────┼──────────┼──────────┤
  │ PnL         │  -$4.80  │  +$18.50 │
  │ Win Rate    │  33.3%   │  71.4%   │
  │ Sharpe      │  -0.42   │   2.87   │
  │ Max DD      │  $12.30  │   $5.20  │
  │ Trades      │  3       │   7      │
  └─────────────┴──────────┴──────────┘

  ── Optimal Parameters ──
  SL multiplier: 1.5x · TP multiplier: 2.5x
  Min score: 50 · Min confidence: 55%

  ── Top 5 Parameter Rankings ──
  #1  SL=1.5x TP=2.5x Score≥50 Conf≥55%  +$18.50
  #2  SL=1.5x TP=2.0x Score≥50 Conf≥55%  +$15.30
  #3  SL=2.0x TP=2.5x Score≥50 Conf≥55%  +$12.80
  #4  SL=1.5x TP=2.5x Score≥60 Conf≥55%  +$11.20
  #5  SL=1.0x TP=2.0x Score≥50 Conf≥50%  +$9.60

  💡 Suggestion: Adjust liq_hunter SL from 0.5% to 0.75%,
     TP from 1% to 1.25%, significantly improving win rate and returns.
     Run: sentry config set liq_hunter.sl_pct 0.75`} />
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
              <div className="text-[10px] text-amber-400 font-semibold mb-1">{t.agentAnalysis}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Backtest complete! Default parameters lost $4.80, optimized <span className="text-amber-400 font-medium">profit $18.50, win rate improved from 33% to 71%</span>.
                Key finding: default 0.5% stop-loss is too tight, frequently stopped out by noise; widening to 0.75% with 1.25% take-profit works best.
                Want me to apply the optimal parameters?
              </div>
            </div>
          </div>
        </div>

        {/* Scenario 4: Full Workflow */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">{t.scenario} 4</span>
            <span className="text-sm font-semibold">{t.scenarioTitles[3]}</span>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="text-[10px] text-primary font-semibold mb-1">{t.user}</div>
              <div className="text-xs">OK, start the Agent with optimized parameters, run dry-run first to see results</div>
            </div>
            <CopyBlock code={`# Step 1: Apply optimal parameters
$ sentry config set liq_hunter.sl_pct 0.75
  ✓ liq_hunter.sl_pct: 0.5 → 0.75

$ sentry config set liq_hunter.tp_pct 1.25
  ✓ liq_hunter.tp_pct: 1.0 → 1.25

# Step 2: Start dry-run simulation
$ sentry start -i 5

  Bitfinex Agent starting... (dry-run mode)

  [10:32:05] tick #1  smart-money:neutral  funding:neutral  liq:neutral  orderbook:neutral
  [10:32:10] tick #2  smart-money:neutral  funding:neutral  liq:neutral  orderbook:neutral
  ...
  [10:45:33] tick #162 ⚡ liq_cascade event! Liquidation intensity P96
  [10:45:33] ← immediate tick inserted
  [10:45:33] liq-hunter triggered: Long 0.05 BTC @ $66,180
  [10:45:33] Risk check passed: position $331 < $5000 limit ✓
  [10:45:33] Simulated fill: BUY 0.05 BTC @ $66,180
  ...
  [10:52:17] liq-hunter take-profit hit: $66,180 → $67,007 (+1.25%)
  [10:52:17] Simulated close: SELL 0.05 BTC, PnL +$41.35`} />
            <CopyBlock code={`# Step 3: Check positions and P&L
$ sentry position

  ── Current Positions ──
  (no active positions)

  ── Closed (today) ──
  #1  liq-hunter  Long 0.05 BTC  $66,180→$67,007
      PnL: +$41.35 (+1.25%)  Duration: 6m44s

  Daily cumulative PnL: +$41.35  Win rate: 1/1 (100%)

# Step 4: Stop when satisfied
$ sentry stop
  Sending SIGTERM to Agent (PID 42831)...
  Graceful shutdown (waiting for in-flight tick + close positions)...
  ✓ Safely exited`} />
            <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3">
              <div className="text-[10px] text-purple-400 font-semibold mb-1">{t.agentSummary}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Dry-run for 20 minutes, <span className="text-purple-400 font-medium">captured 1 liquidation cascade bounce, profit +$41.35 (+1.25%)</span>.
                Optimized parameters performing as expected. If dry-run results remain stable over 2-3 days, consider switching to live mode.
                Note: live trading requires BFX_API_KEY environment variable.
              </div>
            </div>
          </div>
        </div>

        {/* Scenario 5: Risk Control */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">{t.scenario} 5</span>
            <span className="text-sm font-semibold">{t.scenarioTitles[4]}</span>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="text-[10px] text-primary font-semibold mb-1">{t.user}</div>
              <div className="text-xs">The Agent ran overnight but stopped, check the logs for me</div>
            </div>
            <CopyBlock code={`$ sentry logs --level warn -n 10

  [03:12:44] ⚠ ob-sniper stop-loss: -$16.50 (consec loss #3)
  [03:28:11] ⚠ ob-sniper stop-loss: -$12.80 (consec loss #4)
  [03:41:05] ⚠ ob-sniper stop-loss: -$18.20 (consec loss #5)
  [03:41:05] 🛑 Circuit breaker triggered! 5 consecutive losses, total -$82.30
  [03:41:05] → All strategies paused for 60 minutes
  [03:41:05] → Cooldown until 04:41:05

$ sentry position

  ── Risk Control Status ──
  Daily loss: -$82.30 / -$200 limit (41.2%)
  Consecutive losses: 5 → 🛑 Circuit breaker active
  Cooldown remaining: 38 minutes
  Today's trades: 12 / 50 limit`} />
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
              <div className="text-[10px] text-emerald-400 font-semibold mb-1">{t.agentAnalysis}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                <span className="text-emerald-400 font-medium">Risk control system working as intended</span> — ob-sniper hit 5 consecutive stop-losses during low-liquidity overnight hours,
                triggering circuit breaker protection, auto-pausing all strategies for 60 minutes. Total loss $82.30 still within daily $200 limit.
                Suggestion: disable ob-sniper during low-liquidity hours (UTC 0-4) via <code className="bg-emerald-500/10 px-1 rounded">config set</code>,
                keep only low-frequency strategies like smart-follow.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Changelog */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Timer className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t.changelog}</h2>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold">v0.3.3</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">latest</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
              <li>PM strategy rewrite: signal-driven auto-betting on Polymarket, 4h accuracy 55-67% (confidence &ge; 35%)</li>
              <li>signalSummary confidence formula refactor: module coverage + signal consistency, effectively distinguishes strong/weak signals</li>
              <li>New Polymarket executor: dry-run mode simulation, live mode calls Polymarket CLI</li>
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold">v0.3.0</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Backtest engine refactor: fetch historical data directly from Bitfinex API, no pre-recorded SQLite snapshots needed, works out of the box</li>
              <li>Auto parameter optimizer: 225 parameter combinations (SL/TP/thresholds) auto-sweep, outputs optimal config + Top 5 rankings</li>
              <li>Fix backtest position lookup bug (getPositions couldn't find closed positions after closePosition)</li>
              <li>New reverse-signal auto-close mechanism, no longer relies solely on SL/TP</li>
              <li>Backtest mode skips SQLite persistence, significantly faster</li>
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold">v0.2.0</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Fix dist build DB/PID path crash (unified paths.ts)</li>
              <li>Fix risk control position USD calculation (remove erroneous entryPrice multiplication)</li>
              <li>signalSummary confidence formula refactor (module coverage + signal consistency)</li>
              <li>Event-driven: liq_cascade/wall_break triggers immediate tick, spread_extreme switches to limit-only</li>
              <li>Idempotent retry: same CID retry + configurable backoff, auto-recover from network errors</li>
              <li>order_type config now actually drives order type (EXCHANGE LIMIT / MARKET)</li>
              <li>Strategy-level tick_interval independent scheduling</li>
              <li>Graceful shutdown: wait for in-flight → exchange real close → PID cleanup</li>
              <li>Position/risk state SQLite persistence, process restart recovery</li>
              <li>CID/exchangeOrderId field semantics fix</li>
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold">v0.1.0</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Initial release: 5 strategy modules + dual-layer risk control + backtest engine</li>
              <li>10 CLI commands (scan/signal/strategy/position/trade/start/stop/backtest/config/logs)</li>
              <li>SOCKS5 proxy support, Bitfinex REST API data collection</li>
              <li>SQLite snapshot recording + decision audit logs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="text-center text-xs text-muted-foreground/50 py-4">
        {t.footer}
      </div>
    </div>
  )
}

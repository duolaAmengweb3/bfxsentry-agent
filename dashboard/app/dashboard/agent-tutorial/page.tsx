'use client'

import Link from 'next/link'
import {
  GraduationCap, Terminal, Download, Server, Key, Play, BookOpen,
  ExternalLink, Github, ChevronRight, Copy, Check, Cpu, Shield,
  Zap, Globe, ArrowRight,
} from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

function CopyBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative group">
      {title && (
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{title}</div>
      )}
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

function StepCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
          {step}
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function LinkCard({ href, icon: Icon, title, desc }: { href: string; icon: React.ElementType; title: string; desc: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl border border-border/60 bg-card/40 p-4 hover:border-primary/30 hover:bg-card/60 transition-all group block"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium group-hover:text-primary transition-colors">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
      </div>
    </a>
  )
}

const translations = {
  en: {
    heroTitle: 'Agent AI Tutorial',
    heroSubtitle: 'From scratch: Deploy Lobster Agent, use our tools with Claude Code / Codex',
    heroDesc: 'This tutorial is for beginners. It walks you through deploying OpenClaw (the Lobster AI Agent framework) step by step, and integrating our trading signal system into Claude Code, OpenAI Codex, and other Agent AI tools. No programming experience required — just follow the steps.',

    part1Title: 'Part 1: Deploy OpenClaw (Lobster AI Agent)',
    part1Desc: 'OpenClaw is an open-source personal AI assistant framework supporting WhatsApp, Telegram, Discord, and more. It runs locally on your device. After installation, you can register our trading tools (bfxsentry-agent) as an OpenClaw Skill, letting the lobster automatically analyze markets and execute trades for you.',

    step1Title: 'Install Node.js 22+',
    step1Desc: 'OpenClaw requires Node.js 22 or above.',

    step2Title: 'One-click Install OpenClaw',
    wizardLabel: 'Wizard mode',
    wizardDesc: ' The onboard command guides you through all setup steps including AI model, messaging channels, Skill configuration, etc. Recommended for beginners.',

    step3Title: 'Configure AI Model',
    step3Desc: 'OpenClaw supports multiple AI models (OpenAI, DeepSeek, Claude, etc.). The wizard will guide you through configuration, or you can edit manually:',
    step3Note: 'DeepSeek API gives free credits on signup and is very affordable. You can also use OpenAI, Claude, or any model you have a key for.',

    step4Title: 'Start OpenClaw Gateway',

    step5Title: 'Register bfxsentry-agent as a Skill',
    step5Desc: 'After installing OpenClaw, register our trading tools as a Skill so the lobster can automatically invoke sentry commands:',
    doneLabel: 'Done!',
    doneDesc: ' Now you can chat with the lobster through any connected channel (Telegram/WhatsApp/Discord, etc.) and ask it to analyze markets and trade for you.',

    openclawGithubBtn: 'OpenClaw GitHub Repo',
    openclawDocsBtn: 'OpenClaw Official Docs',
    agentCliDocsBtn: 'View Full Agent CLI Docs',

    part2Title: 'Part 2: What Tools We Provide',
    part2Desc: 'Before connecting any Agent AI, learn about our tool capabilities. You can call these commands directly in any AI Agent that supports terminal commands.',
    toolTag_core: 'Core',
    toolTag_signal: 'Signal',
    toolTag_strategy: 'Strategy',
    toolTag_trade: 'Trade',
    toolTag_engine: 'Engine',
    tool1Desc: 'Full market scan, outputs structured JSON of all module signals for AI to parse directly',
    tool2Desc: 'Smart money signal details: whale direction, net inflow, confidence score',
    tool3Desc: 'Liquidation data: cascade intensity, long/short ratio, rebound probability',
    tool4Desc: 'Order book depth: Bid/Ask ratio, wall detection, imbalance direction',
    tool5Desc: 'Funding rate: FRR, utilization, lending/borrowing recommendations',
    tool6Desc: 'Auto-parameter backtesting: 225 parameter combinations optimized, outputs best config',
    tool7Desc: 'Current strategy run status and recent decision records',
    tool8Desc: 'Current positions + floating PnL + daily profit stats',
    tool9Desc: 'Manually submit trade orders, executed after risk control filtering',
    tool10Desc: 'Start or stop the auto trading engine (dry-run / live)',
    keyPoint: 'Key point:',
    keyPointDesc: ' is the core command for connecting all AI Agents — it outputs standard JSON that any AI can parse and understand. The tutorials below are built around this.',

    part3Title: 'Part 3: Using Our Tools in Claude Code',
    part3Desc: 'Claude Code is Anthropic\'s command-line AI agent that can execute terminal commands and understand outputs directly. After installing the Lobster Agent, Claude Code can call all sentry commands to analyze markets and execute strategies.',

    ccStep1Title: 'Install Claude Code',
    ccStep1Note_seeDoc: 'See',
    ccStep1Note_officialDoc: 'Claude Code Official Docs',
    ccStep1Note_needAccount: ' · Requires an Anthropic account (free credits available)',

    ccStep2Title: 'Ensure sentry is installed',
    ccStep2Desc: 'Claude Code relies on tools already available in your local environment. Make sure the Lobster Agent is globally installed:',

    ccStep3Title: 'Call our tools with natural language',
    ccStep3Desc: 'In Claude Code, you don\'t need to memorize commands. Just describe what you want in plain language. Claude will automatically call the corresponding sentry commands:',

    scenario1Label: 'Scenario 1: Market Scan',
    scenario1Prompt: '"Use sentry to scan the current BTC market signals and analyze what whales are doing"',
    scenario1Desc_prefix: 'Claude Code will run ',
    scenario1Desc_and: ' and ',
    scenario1Desc_suffix: ', then explain in plain language: current whale direction, signal strength, and whether there are trading opportunities.',

    scenario2Label: 'Scenario 2: Backtest & Optimize',
    scenario2Prompt: '"Use sentry backtest to backtest the liquidation hunter strategy for the past 7 days and tell me the optimal parameters"',
    scenario2Desc_prefix: 'Claude Code will run ',
    scenario2Desc_suffix: ', analyze 225 parameter combinations and give you clear parameter recommendations and risk analysis.',

    scenario3Label: 'Scenario 3: Trade Execution',
    scenario3Prompt: '"Check the current positions and today\'s profit"',
    scenario3Desc_prefix: 'Claude Code will run ',
    scenario3Desc_and: ' and ',
    scenario3Desc_suffix: ', and compile them into an easy-to-read position report.',

    scenario4Label: 'Scenario 4: Automation Development',
    scenario4Prompt: '"Write a Node.js script that calls sentry scan --json every 30 seconds and sends a Telegram notification when smart money confidence > 70%"',
    scenario4Desc: 'Claude Code will use our tools\' JSON output to generate a complete monitoring script and debug it for you.',

    ccStep4Title: 'Write CLAUDE.md so Claude remembers the tools',
    ccStep4Desc_prefix: 'Create a ',
    ccStep4Desc_suffix: ' in your project root directory. Claude Code reads it automatically on every startup, so it will always know which tools are available:',

    part4Title: 'Part 4: Using Our Tools in OpenAI Codex CLI',
    part4Desc: 'OpenAI Codex CLI is OpenAI\'s open-source terminal AI agent (similar to Claude Code). It can also call our sentry tools directly.',

    codexStep1Title: 'Install Codex CLI',
    codexStep1Note_seeDoc: 'See',
    codexStep1Note_repo: 'Codex CLI GitHub Repo',

    codexStep2Title: 'Call sentry tools with natural language',
    codexStep2Desc: 'Just like Claude Code, describe what you want in natural language and Codex will call the corresponding sentry commands:',
    youSayLabel: 'You say',
    codexPrompt1: '"Run sentry scan --json, analyze the current BTC market, and tell me which signals are triggered"',
    codexPrompt2: '"Use sentry backtest smart-follow -d 14 to backtest the smart money strategy for two weeks"',
    codexPrompt3: '"Run sentry position to check current positions, and if there are losing ones help me analyze why"',

    codexStep3Title: 'Codex instruction file (codex.md)',
    codexStep3Desc_prefix: 'Create a ',
    codexStep3Desc_suffix: ' in your project root. Codex loads it automatically, similar to Claude Code\'s CLAUDE.md:',

    part5Title: 'Part 5: The Lobster Itself is an Agent AI',
    part5Desc: 'The Lobster Agent is itself an AI Agent — it automatically collects data, generates signals, evaluates strategies, and executes trades, all without human intervention. Think of it as a trading-focused AI Agent that works even better when combined with Claude Code / Codex.',

    lobsterCol: 'Lobster Agent handles',
    claudeCol: 'Claude Code / Codex handles',
    comboCol: 'Combined = Superpower',

    lobster1: 'Real-time Bitfinex data collection',
    lobster2: '5 strategy modules auto-evaluation',
    lobster3: 'Dual-layer risk control + circuit breaker',
    lobster4: 'Signal generation + auto order placement',
    lobster5: 'Backtesting + state persistence',

    claude1: 'Understand your needs in natural language',
    claude2: 'Call sentry commands for data',
    claude3: 'Interpret complex signals in plain terms',
    claude4: 'Write automation scripts and extensions',
    claude5: 'Combine multiple commands for complex tasks',

    combo1: 'Conversational market analysis',
    combo2: 'AI-assisted strategy optimization',
    combo3: 'Auto-write monitoring alert scripts',
    combo4: 'Smart backtest + result interpretation',
    combo5: 'Natural language trading and risk management',

    part6Title: 'Part 6: Other Agent AI Platforms Work Too',
    part6Desc: 'Our tools are standard CLI — any AI Agent that can execute terminal commands can call them. Below are verified compatible platforms.',

    cursorDesc: 'In Cursor\'s Agent mode, type "run sentry scan --json to analyze the market" and Cursor will execute it in the built-in terminal and interpret the results with AI. You can also have Cursor develop automation tools based on sentry data.',
    windsurfDesc: 'Windsurf\'s Cascade AI supports multi-step tasks. Have it run sentry scan → sentry backtest → analyze results → generate report in one go to complete a full market analysis workflow.',
    warpDesc: 'Warp\'s AI features can explain sentry command output. After running sentry scan, select the output and press Ctrl+I to have AI interpret the signal meanings and trading suggestions.',
    aiderDesc: 'Aider supports executing shell commands in conversation. Chat while using sentry tools, or directly modify the Lobster Agent source code to add custom strategy modules.',

    universalTitle: 'Universal access: Works with any AI Agent',
    universalDesc: 'No matter which AI Agent you use, just make sure: (1) bfxsentry-agent is installed locally (2) The AI Agent can execute terminal commands. Then simply tell the AI:',
    universalFlow_aiRead: 'AI reads JSON',
    universalFlow_understand: 'Understand + Analyze',
    universalFlow_action: 'Suggest or Execute',

    faqTitle: 'FAQ',
    faq1q: 'Is the Lobster Agent free?',
    faq1a: 'Completely free and open source. Scanning signals, backtesting, and other features cost nothing and require no account registration. Live trading only needs your own Bitfinex API Key.',
    faq2q: 'Can I use it without programming experience?',
    faq2a: 'Yes. After installing Node.js, just copy and paste commands from the tutorial. With AI Agents like Claude Code, you don\'t even need to remember commands — just tell the AI what you want in plain language.',
    faq3q: 'What\'s the difference between dry-run and live?',
    faq3a: 'Dry-run uses real market data but doesn\'t place real orders, ideal for validating strategy performance. Switch to live mode after confirming strategy stability.',
    faq4q: 'Do I need a VPN?',
    faq4a: 'Bitfinex API requires proxy access in some regions. The Agent auto-detects and uses a local SOCKS5 proxy (127.0.0.1:7897). If you have a proxy tool (Clash/V2Ray, etc.), ensure the proxy port is 7897.',
    faq5q: 'Are my funds safe?',
    faq5a: 'The Agent only operates via API — your funds stay in your Bitfinex account. We recommend only enabling Orders + Wallets Read permissions for your API Key, and never enable withdrawal. Dual-layer risk control + circuit breaker protection limits maximum loss.',
    faq6q: 'How do I configure Polymarket auto-betting?',
    faq6a: 'You need to additionally install the Polymarket official CLI (Rust), then run polymarket auth to connect a Polygon wallet. The Agent auto-places bets when signals reach the threshold. See the Agent CLI page for installation instructions.',

    resourcesTitle: 'Resources',

    linkDesc_openclawGithub: 'Lobster AI Agent Framework · Open Source',
    linkDesc_openclawDocs: 'Getting Started · Model Config · Skill System',
    linkDesc_lobsterGithub: 'Source Code · Give it a Star',
    linkDesc_npm: 'bfxsentry-agent · Latest v0.3.3',
    linkDesc_skillDoc: 'Complete command and skill documentation',
    linkDesc_claudeCode: 'Anthropic AI coding agent',
    linkDesc_codex: 'Open-source terminal AI agent',
    linkDesc_bfxApiKey: 'Create and manage your API Key',
    linkDesc_cursor: 'AI-first code editor',
    linkDesc_aider: 'Open-source AI coding assistant',

    linkTitle_lobsterGithub: 'Lobster Agent GitHub',
    linkTitle_openclawDocs: 'OpenClaw Official Docs',
    linkTitle_skillDoc: 'Skill System Docs',
    linkTitle_claudeCode: 'Claude Code Official Docs',
    linkTitle_bfxApiKey: 'Bitfinex API Key Management',

    footer_prefix: 'Tutorial content is continuously updated · Questions? Join the ',
    footer_tgGroup: 'Telegram group',
    footer_suffix: ' · Bitfinex',
  },
  zh: {
    heroTitle: 'Agent AI 教程',
    heroSubtitle: '从零开始：部署龙虾 Agent、配合 Claude Code / Codex 使用我们的工具',
    heroDesc: '本教程面向零基础用户，手把手教你如何部署 OpenClaw（龙虾 AI Agent 框架），以及如何在 Claude Code、OpenAI Codex 等 Agent AI 工具中集成我们的交易信号系统。无需编程经验，按步骤操作即可上手。',

    part1Title: '第一部分：部署 OpenClaw（龙虾 AI Agent）',
    part1Desc: 'OpenClaw 是一个开源的个人 AI 助手框架，支持 WhatsApp、Telegram、Discord 等多种通道，可以在你的设备上本地运行。安装好之后，你可以把我们的交易工具（bfxsentry-agent）注册为 OpenClaw 的 Skill，让龙虾自动帮你分析市场、执行交易。',

    step1Title: '安装 Node.js 22+',
    step1Desc: 'OpenClaw 需要 Node.js 22 或以上版本。',

    step2Title: '一键安装 OpenClaw',
    wizardLabel: '向导模式',
    wizardDesc: ' onboard 命令会一步步引导你完成所有设置，包括 AI 模型、消息通道、Skill 配置等。小白用户推荐直接走向导。',

    step3Title: '配置 AI 模型',
    step3Desc: 'OpenClaw 支持多种 AI 模型（OpenAI、DeepSeek、Claude 等）。向导中会引导配置，你也可以手动编辑：',
    step3Note: 'DeepSeek API 注册即送余额，价格低廉。也可以用 OpenAI、Claude 等任何你有 Key 的模型。',

    step4Title: '启动 OpenClaw Gateway',

    step5Title: '注册 bfxsentry-agent 作为 Skill',
    step5Desc: '安装好 OpenClaw 后，把我们的交易工具注册为 Skill，龙虾就能自动调用 sentry 命令：',
    doneLabel: '完成！',
    doneDesc: ' 现在你可以通过任何已连接的通道（Telegram/WhatsApp/Discord 等）和龙虾对话，让它帮你分析市场和交易。',

    openclawGithubBtn: 'OpenClaw GitHub 仓库',
    openclawDocsBtn: 'OpenClaw 官方文档',
    agentCliDocsBtn: '查看 Agent CLI 完整文档',

    part2Title: '第二部分：我们提供了哪些工具',
    part2Desc: '在接入任何 Agent AI 之前，先了解我们提供的工具能力。你可以在任何支持终端命令的 AI Agent 中直接调用这些命令。',
    toolTag_core: '核心',
    toolTag_signal: '信号',
    toolTag_strategy: '策略',
    toolTag_trade: '交易',
    toolTag_engine: '引擎',
    tool1Desc: '全市场一键扫描，输出所有模块信号的结构化 JSON，AI 可直接解析',
    tool2Desc: '查看聪明钱信号详情：鲸鱼方向、净流入、置信度评分',
    tool3Desc: '爆仓数据：级联强度、多空比、反弹概率',
    tool4Desc: '盘口深度：Bid/Ask 比、大墙检测、失衡方向',
    tool5Desc: '融资利率：FRR、利用率、放贷/借贷建议',
    tool6Desc: '自动调参回测：225 种参数组合寻优，输出最佳配置',
    tool7Desc: '当前所有策略运行状态和最近决策记录',
    tool8Desc: '当前持仓 + 浮动 PnL + 今日盈亏统计',
    tool9Desc: '手动提交交易指令，经风控过滤后执行',
    tool10Desc: '启动或停止自动交易引擎（dry-run / live）',
    keyPoint: '关键点：',
    keyPointDesc: ' 是对接所有 AI Agent 的核心命令 — 它输出标准 JSON，任何 AI 都能解析理解。下面的教程都围绕这个展开。',

    part3Title: '第三部分：在 Claude Code 中使用我们的工具',
    part3Desc: 'Claude Code 是 Anthropic 推出的命令行 AI 代理，能直接在终端执行命令并理解输出。安装好龙虾 Agent 后，Claude Code 可以直接调用 sentry 的所有命令来分析市场、执行策略。',

    ccStep1Title: '安装 Claude Code',
    ccStep1Note_seeDoc: '详见',
    ccStep1Note_officialDoc: 'Claude Code 官方文档',
    ccStep1Note_needAccount: ' · 需要 Anthropic 账号（有免费额度）',

    ccStep2Title: '确保 sentry 已安装',
    ccStep2Desc: 'Claude Code 依赖你本地环境中已有的工具。确保龙虾 Agent 已全局安装：',

    ccStep3Title: '用自然语言调用我们的工具',
    ccStep3Desc: '在 Claude Code 里，你不需要记命令，直接用中文描述你想做什么。Claude 会自动调用对应的 sentry 命令：',

    scenario1Label: '场景 1：市场扫描',
    scenario1Prompt: '\u201c用 sentry 帮我扫描一下 BTC 当前的市场信号，分析一下鲸鱼在做什么\u201d',
    scenario1Desc_prefix: 'Claude Code 会运行 ',
    scenario1Desc_and: ' 和 ',
    scenario1Desc_suffix: '，然后用通俗语言告诉你：当前鲸鱼方向、信号强度、是否有交易机会。',

    scenario2Label: '场景 2：回测调参',
    scenario2Prompt: '\u201c帮我用 sentry backtest 对爆仓猎人策略回测过去 7 天，告诉我最优参数\u201d',
    scenario2Desc_prefix: 'Claude Code 会运行 ',
    scenario2Desc_suffix: '，解析 225 组参数组合结果，给你一份清晰的参数建议和风险分析。',

    scenario3Label: '场景 3：交易执行',
    scenario3Prompt: '\u201c查看一下当前持仓和今天的收益情况\u201d',
    scenario3Desc_prefix: 'Claude Code 会运行 ',
    scenario3Desc_and: ' 和 ',
    scenario3Desc_suffix: '，整理成易读的持仓报告。',

    scenario4Label: '场景 4：自动化开发',
    scenario4Prompt: '\u201c帮我写一个 Node.js 脚本，每 30 秒调用 sentry scan --json，当聪明钱置信度 > 70% 时发 Telegram 通知\u201d',
    scenario4Desc: 'Claude Code 会用我们工具的 JSON 输出，直接帮你生成完整的监控脚本代码并调试运行。',

    ccStep4Title: '写入 CLAUDE.md 让 Claude 记住工具',
    ccStep4Desc_prefix: '在你的项目根目录创建 ',
    ccStep4Desc_suffix: '，Claude Code 每次启动都会自动读取，这样它就永远知道有哪些工具可用：',

    part4Title: '第四部分：在 OpenAI Codex CLI 中使用我们的工具',
    part4Desc: 'OpenAI Codex CLI 是 OpenAI 开源的终端 AI 代理（类似 Claude Code）。同样可以直接调用我们的 sentry 工具。',

    codexStep1Title: '安装 Codex CLI',
    codexStep1Note_seeDoc: '详见',
    codexStep1Note_repo: 'Codex CLI GitHub 仓库',

    codexStep2Title: '用自然语言调用 sentry 工具',
    codexStep2Desc: '和 Claude Code 一样，直接用自然语言描述，Codex 会调用对应的 sentry 命令：',
    youSayLabel: '你说',
    codexPrompt1: '\u201c运行 sentry scan --json，分析当前 BTC 市场，告诉我哪些信号被触发\u201d',
    codexPrompt2: '\u201c用 sentry backtest smart-follow -d 14 回测聪明钱策略两周\u201d',
    codexPrompt3: '\u201c执行 sentry position 查看当前持仓，如果有亏损的仓位帮我分析原因\u201d',

    codexStep3Title: 'Codex 指令文件 (codex.md)',
    codexStep3Desc_prefix: '在项目根目录创建 ',
    codexStep3Desc_suffix: '，Codex 会自动加载，效果和 Claude Code 的 CLAUDE.md 类似：',

    part5Title: '第五部分：龙虾本身就是 Agent AI',
    part5Desc: '龙虾 Agent 自身也是一个 AI Agent — 它自动采集数据、生成信号、评估策略、执行交易，全流程无需人工干预。你可以把它理解成一个专注交易的 AI Agent，和 Claude Code / Codex 配合使用效果更佳。',

    lobsterCol: '龙虾 Agent 负责',
    claudeCol: 'Claude Code / Codex 负责',
    comboCol: '组合使用 = 超级能力',

    lobster1: '实时采集 Bitfinex 数据',
    lobster2: '5 大策略模块自动评估',
    lobster3: '双层风控 + 熔断保护',
    lobster4: '信号生成 + 自动下单',
    lobster5: '回测调参 + 状态持久化',

    claude1: '用自然语言理解你的需求',
    claude2: '调用 sentry 命令获取数据',
    claude3: '解读复杂信号、通俗解释',
    claude4: '帮你写自动化脚本和扩展',
    claude5: '组合多条命令完成复杂任务',

    combo1: '对话式市场分析',
    combo2: 'AI 辅助策略优化',
    combo3: '自动编写监控报警脚本',
    combo4: '智能回测 + 结果解读',
    combo5: '自然语言下单和风控管理',

    part6Title: '第六部分：其他 Agent AI 平台也能用',
    part6Desc: '我们的工具是标准 CLI，任何能执行终端命令的 AI Agent 都可以调用。以下是已验证兼容的平台。',

    cursorDesc: '在 Cursor 的 Agent 模式中直接输入 \u201c运行 sentry scan --json 分析市场\u201d，Cursor 会在内置终端执行并用 AI 解读结果。也可以让 Cursor 帮你开发基于 sentry 数据的自动化工具。',
    windsurfDesc: 'Windsurf 的 Cascade AI 支持多步任务。可以让它连续运行 sentry scan → sentry backtest → 分析结果 → 生成报告，一口气完成完整的市场分析流程。',
    warpDesc: 'Warp 的 AI 功能可以解释 sentry 命令输出。运行完 sentry scan 后，选中输出按 Ctrl+I 让 AI 解读信号含义和交易建议。',
    aiderDesc: 'Aider 支持在对话中执行 shell 命令。可以边聊边用 sentry 工具，也能直接修改龙虾 Agent 源码添加自定义策略模块。',

    universalTitle: '通用接入方式：任何 AI Agent 都适用',
    universalDesc: '不管用哪个 AI Agent，只需要确保：① 本机已安装 bfxsentry-agent ② AI Agent 能执行终端命令。然后直接告诉 AI：',
    universalFlow_aiRead: 'AI 读取 JSON',
    universalFlow_understand: '理解 + 分析',
    universalFlow_action: '给你建议或执行',

    faqTitle: '常见问题',
    faq1q: '龙虾 Agent 收费吗？',
    faq1a: '完全免费开源。扫描信号、回测调参等功能无需任何费用，也不需要注册账号。实盘交易只需要你自己的 Bitfinex API Key。',
    faq2q: '不会编程能用吗？',
    faq2a: '可以。安装好 Node.js 后，按照教程复制粘贴命令就行。配合 Claude Code 等 AI Agent，你甚至不需要记命令，用自然语言告诉 AI 你想做什么就可以。',
    faq3q: '模拟盘和实盘有什么区别？',
    faq3a: 'dry-run 模拟盘使用真实市场数据，但不会真正下单，适合验证策略效果。确认策略稳定后再切 live 实盘模式。',
    faq4q: '需要翻墙吗？',
    faq4a: 'Bitfinex API 在部分地区需要代理访问。Agent 会自动检测并使用本地 SOCKS5 代理 (127.0.0.1:7897)。如果你已有代理工具（Clash/V2Ray 等），确保代理端口是 7897 即可。',
    faq5q: '资金安全吗？',
    faq5a: 'Agent 只通过 API 操作，你的资金始终在 Bitfinex 账户中。API Key 建议只开 Orders + Wallets Read 权限，不要开提币权限。另外有双层风控 + 熔断保护，限制最大亏损。',
    faq6q: 'Polymarket 自动下注怎么配置？',
    faq6a: '需要额外安装 Polymarket 官方 CLI (Rust)，然后运行 polymarket auth 连接 Polygon 钱包。Agent 信号达到阈值时会自动调用下注。详见 Agent CLI 页面的安装说明。',

    resourcesTitle: '资源链接',

    linkDesc_openclawGithub: '龙虾 AI Agent 框架 · 开源',
    linkDesc_openclawDocs: '入门指南 · 模型配置 · Skill 系统',
    linkDesc_lobsterGithub: '源码仓库 · Star 支持一下',
    linkDesc_npm: 'bfxsentry-agent · 最新版 v0.3.3',
    linkDesc_skillDoc: '完整的命令和技能说明',
    linkDesc_claudeCode: 'Anthropic AI 编程代理',
    linkDesc_codex: '开源终端 AI 代理',
    linkDesc_bfxApiKey: '创建和管理你的 API Key',
    linkDesc_cursor: 'AI-first 代码编辑器',
    linkDesc_aider: '开源 AI 编程助手',

    linkTitle_lobsterGithub: '龙虾 Agent GitHub',
    linkTitle_openclawDocs: 'OpenClaw 官方文档',
    linkTitle_skillDoc: 'Skill 系统文档',
    linkTitle_claudeCode: 'Claude Code 官方文档',
    linkTitle_bfxApiKey: 'Bitfinex API Key 管理',

    footer_prefix: '教程内容持续更新 · 有问题请到 ',
    footer_tgGroup: 'Telegram 群',
    footer_suffix: ' 交流 · Bitfinex',
  },
  vi: {
    heroTitle: 'Hướng dẫn Agent AI',
    heroSubtitle: 'Từ đầu: Triển khai Lobster Agent, sử dụng công cụ của chúng tôi với Claude Code / Codex',
    heroDesc: 'Hướng dẫn này dành cho người mới bắt đầu. Nó hướng dẫn bạn từng bước triển khai OpenClaw (khung Lobster AI Agent) và tích hợp hệ thống tín hiệu giao dịch của chúng tôi vào Claude Code, OpenAI Codex và các công cụ Agent AI khác. Không cần kinh nghiệm lập trình — chỉ cần làm theo các bước.',

    part1Title: 'Phần 1: Triển khai OpenClaw (Lobster AI Agent)',
    part1Desc: 'OpenClaw là một framework trợ lý AI cá nhân mã nguồn mở, hỗ trợ WhatsApp, Telegram, Discord và nhiều kênh khác. Nó chạy cục bộ trên thiết bị của bạn. Sau khi cài đặt, bạn có thể đăng ký công cụ giao dịch (bfxsentry-agent) làm Skill của OpenClaw, để lobster tự động phân tích thị trường và thực hiện giao dịch cho bạn.',

    step1Title: 'Cài đặt Node.js 22+',
    step1Desc: 'OpenClaw yêu cầu Node.js phiên bản 22 trở lên.',

    step2Title: 'Cài đặt OpenClaw một lệnh',
    wizardLabel: 'Chế độ hướng dẫn',
    wizardDesc: ' Lệnh onboard hướng dẫn bạn qua tất cả các bước thiết lập bao gồm mô hình AI, kênh nhắn tin, cấu hình Skill, v.v. Khuyến nghị cho người mới.',

    step3Title: 'Cấu hình mô hình AI',
    step3Desc: 'OpenClaw hỗ trợ nhiều mô hình AI (OpenAI, DeepSeek, Claude, v.v.). Trình hướng dẫn sẽ giúp bạn cấu hình, hoặc bạn có thể chỉnh sửa thủ công:',
    step3Note: 'DeepSeek API tặng credit miễn phí khi đăng ký và rất rẻ. Bạn cũng có thể dùng OpenAI, Claude hoặc bất kỳ mô hình nào bạn có key.',

    step4Title: 'Khởi động OpenClaw Gateway',

    step5Title: 'Đăng ký bfxsentry-agent làm Skill',
    step5Desc: 'Sau khi cài OpenClaw, đăng ký công cụ giao dịch làm Skill để lobster có thể tự động gọi lệnh sentry:',
    doneLabel: 'Hoàn tất!',
    doneDesc: ' Bây giờ bạn có thể trò chuyện với lobster qua bất kỳ kênh nào đã kết nối (Telegram/WhatsApp/Discord, v.v.) và nhờ nó phân tích thị trường và giao dịch cho bạn.',

    openclawGithubBtn: 'OpenClaw GitHub Repo',
    openclawDocsBtn: 'Tài liệu chính thức OpenClaw',
    agentCliDocsBtn: 'Xem tài liệu Agent CLI đầy đủ',

    part2Title: 'Phần 2: Chúng tôi cung cấp những công cụ gì',
    part2Desc: 'Trước khi kết nối bất kỳ Agent AI nào, hãy tìm hiểu khả năng công cụ của chúng tôi. Bạn có thể gọi các lệnh này trực tiếp trong bất kỳ AI Agent nào hỗ trợ lệnh terminal.',
    toolTag_core: 'Cốt lõi',
    toolTag_signal: 'Tín hiệu',
    toolTag_strategy: 'Chiến lược',
    toolTag_trade: 'Giao dịch',
    toolTag_engine: 'Engine',
    tool1Desc: 'Quét toàn thị trường, xuất JSON cấu trúc tất cả tín hiệu module để AI phân tích trực tiếp',
    tool2Desc: 'Chi tiết tín hiệu smart money: hướng cá voi, dòng tiền ròng, điểm tin cậy',
    tool3Desc: 'Dữ liệu thanh lý: cường độ cascade, tỷ lệ long/short, xác suất phục hồi',
    tool4Desc: 'Độ sâu sổ lệnh: tỷ lệ Bid/Ask, phát hiện tường lệnh, hướng mất cân bằng',
    tool5Desc: 'Lãi suất funding: FRR, mức sử dụng, khuyến nghị cho vay/vay',
    tool6Desc: 'Backtest tự động tối ưu: 225 tổ hợp tham số, xuất cấu hình tốt nhất',
    tool7Desc: 'Trạng thái chạy tất cả chiến lược và bản ghi quyết định gần đây',
    tool8Desc: 'Vị thế hiện tại + PnL nổi + thống kê lãi/lỗ hôm nay',
    tool9Desc: 'Gửi lệnh giao dịch thủ công, thực thi sau khi lọc qua quản lý rủi ro',
    tool10Desc: 'Khởi động hoặc dừng engine giao dịch tự động (dry-run / live)',
    keyPoint: 'Điểm chính:',
    keyPointDesc: ' là lệnh cốt lõi để kết nối tất cả AI Agent — nó xuất JSON chuẩn mà bất kỳ AI nào cũng có thể phân tích và hiểu. Các hướng dẫn bên dưới đều xoay quanh lệnh này.',

    part3Title: 'Phần 3: Sử dụng công cụ trong Claude Code',
    part3Desc: 'Claude Code là agent AI dòng lệnh của Anthropic, có thể thực thi lệnh terminal và hiểu kết quả trực tiếp. Sau khi cài Lobster Agent, Claude Code có thể gọi tất cả lệnh sentry để phân tích thị trường và thực hiện chiến lược.',

    ccStep1Title: 'Cài đặt Claude Code',
    ccStep1Note_seeDoc: 'Xem',
    ccStep1Note_officialDoc: 'Tài liệu chính thức Claude Code',
    ccStep1Note_needAccount: ' · Cần tài khoản Anthropic (có credit miễn phí)',

    ccStep2Title: 'Đảm bảo sentry đã cài đặt',
    ccStep2Desc: 'Claude Code phụ thuộc vào các công cụ đã có trong môi trường cục bộ. Đảm bảo Lobster Agent đã được cài toàn cục:',

    ccStep3Title: 'Gọi công cụ bằng ngôn ngữ tự nhiên',
    ccStep3Desc: 'Trong Claude Code, bạn không cần nhớ lệnh. Chỉ cần mô tả những gì bạn muốn bằng ngôn ngữ tự nhiên. Claude sẽ tự động gọi lệnh sentry tương ứng:',

    scenario1Label: 'Tình huống 1: Quét thị trường',
    scenario1Prompt: '"Dùng sentry quét tín hiệu thị trường BTC hiện tại và phân tích cá voi đang làm gì"',
    scenario1Desc_prefix: 'Claude Code sẽ chạy ',
    scenario1Desc_and: ' và ',
    scenario1Desc_suffix: ', sau đó giải thích bằng ngôn ngữ dễ hiểu: hướng cá voi hiện tại, cường độ tín hiệu, và liệu có cơ hội giao dịch không.',

    scenario2Label: 'Tình huống 2: Backtest & Tối ưu',
    scenario2Prompt: '"Dùng sentry backtest để backtest chiến lược liquidation hunter 7 ngày qua, cho tôi biết tham số tối ưu"',
    scenario2Desc_prefix: 'Claude Code sẽ chạy ',
    scenario2Desc_suffix: ', phân tích 225 tổ hợp tham số và đưa ra khuyến nghị tham số rõ ràng cùng phân tích rủi ro.',

    scenario3Label: 'Tình huống 3: Thực hiện giao dịch',
    scenario3Prompt: '"Kiểm tra vị thế hiện tại và lợi nhuận hôm nay"',
    scenario3Desc_prefix: 'Claude Code sẽ chạy ',
    scenario3Desc_and: ' và ',
    scenario3Desc_suffix: ', và tổng hợp thành báo cáo vị thế dễ đọc.',

    scenario4Label: 'Tình huống 4: Phát triển tự động hóa',
    scenario4Prompt: '"Viết script Node.js gọi sentry scan --json mỗi 30 giây và gửi thông báo Telegram khi độ tin cậy smart money > 70%"',
    scenario4Desc: 'Claude Code sẽ sử dụng đầu ra JSON từ công cụ của chúng tôi để tạo script giám sát hoàn chỉnh và debug cho bạn.',

    ccStep4Title: 'Viết CLAUDE.md để Claude nhớ các công cụ',
    ccStep4Desc_prefix: 'Tạo ',
    ccStep4Desc_suffix: ' trong thư mục gốc dự án. Claude Code tự động đọc file này mỗi khi khởi động, nên nó sẽ luôn biết những công cụ nào khả dụng:',

    part4Title: 'Phần 4: Sử dụng công cụ trong OpenAI Codex CLI',
    part4Desc: 'OpenAI Codex CLI là agent AI terminal mã nguồn mở của OpenAI (tương tự Claude Code). Cũng có thể gọi trực tiếp công cụ sentry của chúng tôi.',

    codexStep1Title: 'Cài đặt Codex CLI',
    codexStep1Note_seeDoc: 'Xem',
    codexStep1Note_repo: 'Codex CLI GitHub Repo',

    codexStep2Title: 'Gọi công cụ sentry bằng ngôn ngữ tự nhiên',
    codexStep2Desc: 'Giống Claude Code, chỉ cần mô tả bằng ngôn ngữ tự nhiên, Codex sẽ gọi lệnh sentry tương ứng:',
    youSayLabel: 'Bạn nói',
    codexPrompt1: '"Chạy sentry scan --json, phân tích thị trường BTC hiện tại, cho tôi biết tín hiệu nào được kích hoạt"',
    codexPrompt2: '"Dùng sentry backtest smart-follow -d 14 để backtest chiến lược smart money hai tuần"',
    codexPrompt3: '"Chạy sentry position xem vị thế hiện tại, nếu có vị thế thua lỗ hãy phân tích nguyên nhân"',

    codexStep3Title: 'File hướng dẫn Codex (codex.md)',
    codexStep3Desc_prefix: 'Tạo ',
    codexStep3Desc_suffix: ' trong thư mục gốc dự án. Codex tự động tải, tương tự CLAUDE.md của Claude Code:',

    part5Title: 'Phần 5: Bản thân Lobster là Agent AI',
    part5Desc: 'Lobster Agent tự nó là một AI Agent — tự động thu thập dữ liệu, tạo tín hiệu, đánh giá chiến lược và thực hiện giao dịch, toàn bộ không cần can thiệp thủ công. Hãy nghĩ nó như một AI Agent chuyên về giao dịch, hoạt động tốt hơn khi kết hợp với Claude Code / Codex.',

    lobsterCol: 'Lobster Agent đảm nhận',
    claudeCol: 'Claude Code / Codex đảm nhận',
    comboCol: 'Kết hợp = Siêu năng lực',

    lobster1: 'Thu thập dữ liệu Bitfinex thời gian thực',
    lobster2: '5 module chiến lược tự động đánh giá',
    lobster3: 'Quản lý rủi ro hai lớp + circuit breaker',
    lobster4: 'Tạo tín hiệu + đặt lệnh tự động',
    lobster5: 'Backtest tham số + lưu trữ trạng thái',

    claude1: 'Hiểu nhu cầu bằng ngôn ngữ tự nhiên',
    claude2: 'Gọi lệnh sentry để lấy dữ liệu',
    claude3: 'Giải thích tín hiệu phức tạp đơn giản',
    claude4: 'Viết script tự động hóa và mở rộng',
    claude5: 'Kết hợp nhiều lệnh cho tác vụ phức tạp',

    combo1: 'Phân tích thị trường qua hội thoại',
    combo2: 'AI hỗ trợ tối ưu chiến lược',
    combo3: 'Tự viết script giám sát cảnh báo',
    combo4: 'Backtest thông minh + giải thích kết quả',
    combo5: 'Giao dịch và quản lý rủi ro bằng ngôn ngữ tự nhiên',

    part6Title: 'Phần 6: Các nền tảng Agent AI khác cũng dùng được',
    part6Desc: 'Công cụ của chúng tôi là CLI chuẩn — bất kỳ AI Agent nào thực thi được lệnh terminal đều có thể gọi. Dưới đây là các nền tảng đã xác nhận tương thích.',

    cursorDesc: 'Trong chế độ Agent của Cursor, nhập "chạy sentry scan --json phân tích thị trường", Cursor sẽ thực thi trong terminal tích hợp và dùng AI giải thích kết quả. Bạn cũng có thể nhờ Cursor phát triển công cụ tự động hóa dựa trên dữ liệu sentry.',
    windsurfDesc: 'Cascade AI của Windsurf hỗ trợ tác vụ nhiều bước. Hãy để nó chạy liên tiếp sentry scan → sentry backtest → phân tích kết quả → tạo báo cáo, hoàn thành quy trình phân tích thị trường đầy đủ.',
    warpDesc: 'Tính năng AI của Warp có thể giải thích đầu ra lệnh sentry. Sau khi chạy sentry scan, chọn đầu ra và nhấn Ctrl+I để AI giải thích ý nghĩa tín hiệu và gợi ý giao dịch.',
    aiderDesc: 'Aider hỗ trợ thực thi lệnh shell trong cuộc trò chuyện. Vừa chat vừa dùng công cụ sentry, hoặc trực tiếp sửa mã nguồn Lobster Agent để thêm module chiến lược tùy chỉnh.',

    universalTitle: 'Cách kết nối chung: Áp dụng cho mọi AI Agent',
    universalDesc: 'Bất kể bạn dùng AI Agent nào, chỉ cần đảm bảo: (1) Đã cài bfxsentry-agent cục bộ (2) AI Agent có thể thực thi lệnh terminal. Sau đó chỉ cần nói với AI:',
    universalFlow_aiRead: 'AI đọc JSON',
    universalFlow_understand: 'Hiểu + Phân tích',
    universalFlow_action: 'Gợi ý hoặc Thực thi',

    faqTitle: 'Câu hỏi thường gặp',
    faq1q: 'Lobster Agent có phí không?',
    faq1a: 'Hoàn toàn miễn phí và mã nguồn mở. Quét tín hiệu, backtest và các tính năng khác không tốn phí và không cần đăng ký tài khoản. Giao dịch thực chỉ cần Bitfinex API Key của bạn.',
    faq2q: 'Không biết lập trình có dùng được không?',
    faq2a: 'Được. Sau khi cài Node.js, chỉ cần sao chép và dán lệnh từ hướng dẫn. Với AI Agent như Claude Code, bạn không cần nhớ lệnh — chỉ cần nói với AI bạn muốn gì bằng ngôn ngữ tự nhiên.',
    faq3q: 'Dry-run và live khác nhau thế nào?',
    faq3a: 'Dry-run dùng dữ liệu thị trường thực nhưng không đặt lệnh thực, phù hợp để kiểm chứng hiệu quả chiến lược. Chuyển sang chế độ live sau khi xác nhận chiến lược ổn định.',
    faq4q: 'Có cần VPN không?',
    faq4a: 'Bitfinex API cần proxy ở một số khu vực. Agent tự phát hiện và sử dụng proxy SOCKS5 cục bộ (127.0.0.1:7897). Nếu bạn có công cụ proxy (Clash/V2Ray, v.v.), đảm bảo cổng proxy là 7897.',
    faq5q: 'Tiền có an toàn không?',
    faq5a: 'Agent chỉ hoạt động qua API — tiền của bạn luôn ở trong tài khoản Bitfinex. Khuyến nghị chỉ bật quyền Orders + Wallets Read cho API Key, không bật quyền rút tiền. Thêm vào đó có quản lý rủi ro hai lớp + circuit breaker giới hạn thua lỗ tối đa.',
    faq6q: 'Cấu hình đặt cược tự động Polymarket thế nào?',
    faq6a: 'Cần cài thêm Polymarket CLI chính thức (Rust), sau đó chạy polymarket auth để kết nối ví Polygon. Agent tự đặt cược khi tín hiệu đạt ngưỡng. Xem trang Agent CLI để biết hướng dẫn cài đặt.',

    resourcesTitle: 'Tài nguyên',

    linkDesc_openclawGithub: 'Khung Lobster AI Agent · Mã nguồn mở',
    linkDesc_openclawDocs: 'Bắt đầu · Cấu hình mô hình · Hệ thống Skill',
    linkDesc_lobsterGithub: 'Kho mã nguồn · Hãy Star ủng hộ',
    linkDesc_npm: 'bfxsentry-agent · Phiên bản mới nhất v0.3.3',
    linkDesc_skillDoc: 'Tài liệu đầy đủ về lệnh và skill',
    linkDesc_claudeCode: 'Agent lập trình AI của Anthropic',
    linkDesc_codex: 'Agent AI terminal mã nguồn mở',
    linkDesc_bfxApiKey: 'Tạo và quản lý API Key của bạn',
    linkDesc_cursor: 'Trình soạn thảo code AI-first',
    linkDesc_aider: 'Trợ lý lập trình AI mã nguồn mở',

    linkTitle_lobsterGithub: 'Lobster Agent GitHub',
    linkTitle_openclawDocs: 'Tài liệu chính thức OpenClaw',
    linkTitle_skillDoc: 'Tài liệu hệ thống Skill',
    linkTitle_claudeCode: 'Tài liệu chính thức Claude Code',
    linkTitle_bfxApiKey: 'Quản lý Bitfinex API Key',

    footer_prefix: 'Nội dung hướng dẫn liên tục cập nhật · Có câu hỏi? Tham gia ',
    footer_tgGroup: 'nhóm Telegram',
    footer_suffix: ' · Bitfinex',
  },
} as const

export default function AgentTutorialPage() {
  const { locale } = useI18n()
  const t = translations[locale] || translations.en

  const toolItems = [
    { cmd: 'sentry scan --json', desc: t.tool1Desc, tag: t.toolTag_core },
    { cmd: 'sentry signal smart-money', desc: t.tool2Desc, tag: t.toolTag_signal },
    { cmd: 'sentry signal liquidation', desc: t.tool3Desc, tag: t.toolTag_signal },
    { cmd: 'sentry signal orderbook', desc: t.tool4Desc, tag: t.toolTag_signal },
    { cmd: 'sentry signal funding', desc: t.tool5Desc, tag: t.toolTag_signal },
    { cmd: 'sentry backtest -d 7', desc: t.tool6Desc, tag: t.toolTag_strategy },
    { cmd: 'sentry strategy', desc: t.tool7Desc, tag: t.toolTag_strategy },
    { cmd: 'sentry position', desc: t.tool8Desc, tag: t.toolTag_trade },
    { cmd: 'sentry trade long 0.01', desc: t.tool9Desc, tag: t.toolTag_trade },
    { cmd: 'sentry start / stop', desc: t.tool10Desc, tag: t.toolTag_engine },
  ]

  const faqItems = [
    { q: t.faq1q, a: t.faq1a },
    { q: t.faq2q, a: t.faq2a },
    { q: t.faq3q, a: t.faq3a },
    { q: t.faq4q, a: t.faq4a },
    { q: t.faq5q, a: t.faq5a },
    { q: t.faq6q, a: t.faq6a },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Hero */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-violet-500/10 via-card/80 to-card/60 p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
            <GraduationCap className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t.heroTitle}</h1>
            <p className="text-sm text-muted-foreground">{t.heroSubtitle}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          {t.heroDesc}
        </p>
      </div>

      {/* Part 1: Deploy OpenClaw */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🦞</span>
          <h2 className="font-semibold text-lg">{t.part1Title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          {t.part1Desc}
        </p>

        <div className="space-y-4">
          <StepCard step={1} title={t.step1Title}>
            <p>{t.step1Desc}</p>
            <CopyBlock code={`# macOS
brew install node

# Windows — Download the latest LTS installer from https://nodejs.org

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify version
node --version   # Requires v22+`} />
          </StepCard>

          <StepCard step={2} title={t.step2Title}>
            <CopyBlock code={`# Install OpenClaw globally (npm / pnpm / bun all work)
npm install -g openclaw@latest

# Run onboard wizard (auto-configures Gateway, workspace, channels etc.)
openclaw onboard --install-daemon`} />
            <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-3 text-xs">
              <span className="text-violet-400 font-medium">{t.wizardLabel}</span>
              {t.wizardDesc}
            </div>
          </StepCard>

          <StepCard step={3} title={t.step3Title}>
            <p>{t.step3Desc}</p>
            <CopyBlock code={`# Model config file location
~/.openclaw/agents/main/agent/models.json

# Example: using DeepSeek V3 (cost-effective, recommended for beginners)
{
  "default": "deepseek-chat",
  "models": {
    "deepseek-chat": {
      "provider": "openai-compat",
      "base_url": "https://api.deepseek.com/v1",
      "api_key": "your_deepseek_api_key"
    }
  }
}`} />
            <p className="text-xs">
              {t.step3Note}
            </p>
          </StepCard>

          <StepCard step={4} title={t.step4Title}>
            <CopyBlock code={`# Start Gateway (AI Agent core service)
openclaw gateway --port 18789 --verbose

# Or run in background via the daemon auto-installed by onboard
# macOS uses launchd, Linux uses systemd, auto-starts on boot`} />
          </StepCard>

          <StepCard step={5} title={t.step5Title}>
            <p>{t.step5Desc}</p>
            <CopyBlock code={`# First install our trading tools
npm install -g bfxsentry-agent

# Then add a Skill in OpenClaw's skills directory
# Skill file location: ~/.openclaw/skills/clawquant-trader/SKILL.md
# See the Agent CLI page for detailed Skill definitions`} />
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 text-xs">
              <span className="text-emerald-400 font-medium">{t.doneLabel}</span>
              {t.doneDesc}
            </div>
          </StepCard>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <a
            href="https://github.com/openclaw/openclaw"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-colors font-medium"
          >
            <Github className="w-3.5 h-3.5" />
            {t.openclawGithubBtn}
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://docs.openclaw.ai/start/getting-started"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-colors font-medium"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {t.openclawDocsBtn}
            <ExternalLink className="w-3 h-3" />
          </a>
          <Link
            href="/dashboard/agent-cli"
            className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors font-medium"
          >
            <span className="text-base leading-none">🦞</span>
            {t.agentCliDocsBtn}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Part 2: Our Tools Overview */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="font-semibold text-lg">{t.part2Title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          {t.part2Desc}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {toolItems.map(item => (
            <div key={item.cmd} className="rounded-lg border border-border/50 bg-card/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-[11px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{item.cmd}</code>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground">{item.tag}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 text-xs">
          <span className="text-amber-400 font-medium">{t.keyPoint}</span>
          <code className="bg-primary/10 text-primary px-1 rounded mx-1">sentry scan --json</code>
          {t.keyPointDesc}
        </div>
      </div>

      {/* Part 3: Claude Code */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">{t.part3Title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          {t.part3Desc}
        </p>

        <div className="space-y-4">
          <StepCard step={1} title={t.ccStep1Title}>
            <CopyBlock code={`# Install Claude Code CLI (requires Node.js 18+)
npm install -g @anthropic-ai/claude-code

# Start (first time requires Anthropic account login)
claude`} />
            <p className="text-xs">
              {t.ccStep1Note_seeDoc}{' '}
              <a href="https://docs.anthropic.com/en/docs/claude-code/overview" target="_blank" rel="noopener" className="text-primary hover:underline">
                {t.ccStep1Note_officialDoc}
              </a>
              {t.ccStep1Note_needAccount}
            </p>
          </StepCard>

          <StepCard step={2} title={t.ccStep2Title}>
            <p>{t.ccStep2Desc}</p>
            <CopyBlock code={`# Verify sentry is available
sentry --version

# If not installed, install it first
npm install -g bfxsentry-agent`} />
          </StepCard>

          <StepCard step={3} title={t.ccStep3Title}>
            <p>{t.ccStep3Desc}</p>
            <div className="space-y-2">
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <div className="text-[10px] text-primary font-semibold mb-1.5">{t.scenario1Label}</div>
                <div className="text-xs mb-2">{t.scenario1Prompt}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t.scenario1Desc_prefix}<code className="bg-primary/10 text-primary px-1 rounded">sentry scan --json</code>{t.scenario1Desc_and}
                  <code className="bg-primary/10 text-primary px-1 rounded">sentry signal smart-money</code>{t.scenario1Desc_suffix}
                </div>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <div className="text-[10px] text-primary font-semibold mb-1.5">{t.scenario2Label}</div>
                <div className="text-xs mb-2">{t.scenario2Prompt}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t.scenario2Desc_prefix}<code className="bg-primary/10 text-primary px-1 rounded">sentry backtest liq-hunter -d 7</code>{t.scenario2Desc_suffix}
                </div>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <div className="text-[10px] text-primary font-semibold mb-1.5">{t.scenario3Label}</div>
                <div className="text-xs mb-2">{t.scenario3Prompt}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t.scenario3Desc_prefix}<code className="bg-primary/10 text-primary px-1 rounded">sentry position</code>{t.scenario3Desc_and}
                  <code className="bg-primary/10 text-primary px-1 rounded">sentry logs</code>{t.scenario3Desc_suffix}
                </div>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <div className="text-[10px] text-primary font-semibold mb-1.5">{t.scenario4Label}</div>
                <div className="text-xs mb-2">{t.scenario4Prompt}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t.scenario4Desc}
                </div>
              </div>
            </div>
          </StepCard>

          <StepCard step={4} title={t.ccStep4Title}>
            <p>{t.ccStep4Desc_prefix}<code className="bg-primary/10 text-primary px-1.5 rounded">CLAUDE.md</code>{t.ccStep4Desc_suffix}</p>
            <CopyBlock code={`# CLAUDE.md example content

## Available tools: Bitfinex Lobster Agent

This project integrates bfxsentry-agent (sentry CLI). Available commands:

- \`sentry scan --json\` — Full market signal scan (JSON output)
- \`sentry signal smart-money\` — Smart money / whale direction
- \`sentry signal liquidation\` — Liquidation data
- \`sentry signal orderbook\` — Order book depth
- \`sentry backtest <strategy> -d <days>\` — Backtest & optimize params
- \`sentry position\` — Positions and PnL
- \`sentry start / stop\` — Start/stop auto trading

When the user asks about market signals or trading strategies, prefer using these commands to get real-time data.`} />
          </StepCard>
        </div>
      </div>

      {/* Part 4: OpenAI Codex */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold text-lg">{t.part4Title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          {t.part4Desc}
        </p>

        <div className="space-y-4">
          <StepCard step={1} title={t.codexStep1Title}>
            <CopyBlock code={`# Install OpenAI Codex CLI
npm install -g @openai/codex

# Set OpenAI API Key
export OPENAI_API_KEY=your_openai_key

# Start Codex (full-auto mode available with --full-auto)
codex`} />
            <p className="text-xs">
              {t.codexStep1Note_seeDoc}{' '}
              <a href="https://github.com/openai/codex" target="_blank" rel="noopener" className="text-primary hover:underline">
                {t.codexStep1Note_repo}
              </a>
            </p>
          </StepCard>

          <StepCard step={2} title={t.codexStep2Title}>
            <p>{t.codexStep2Desc}</p>
            <div className="space-y-2">
              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                <div className="text-[10px] text-emerald-400 font-semibold mb-1">{t.youSayLabel}</div>
                <div className="text-xs space-y-1.5">
                  <div>{t.codexPrompt1}</div>
                  <div>{t.codexPrompt2}</div>
                  <div>{t.codexPrompt3}</div>
                </div>
              </div>
            </div>
          </StepCard>

          <StepCard step={3} title={t.codexStep3Title}>
            <p>{t.codexStep3Desc_prefix}<code className="bg-primary/10 text-primary px-1.5 rounded">codex.md</code>{t.codexStep3Desc_suffix}</p>
            <CopyBlock code={`# codex.md (project root directory)

## External tools: bfxsentry-agent

sentry CLI is globally installed for Bitfinex market signal analysis.
Key commands:
- sentry scan --json  → Full market scan
- sentry signal <module>  → Detailed signal for a specific module
- sentry backtest <strategy> -d <days>  → Backtest
- sentry position  → Position query
- sentry start / stop  → Engine control`} />
          </StepCard>
        </div>
      </div>

      {/* Part 5: Lobster Agent as AI Agent */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🦞</span>
          <h2 className="font-semibold text-lg">{t.part5Title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          {t.part5Desc}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="text-xs font-semibold text-blue-400 mb-2">{t.lobsterCol}</div>
            <ul className="text-[11px] text-muted-foreground space-y-1">
              <li>{t.lobster1}</li>
              <li>{t.lobster2}</li>
              <li>{t.lobster3}</li>
              <li>{t.lobster4}</li>
              <li>{t.lobster5}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
            <div className="text-xs font-semibold text-purple-400 mb-2">{t.claudeCol}</div>
            <ul className="text-[11px] text-muted-foreground space-y-1">
              <li>{t.claude1}</li>
              <li>{t.claude2}</li>
              <li>{t.claude3}</li>
              <li>{t.claude4}</li>
              <li>{t.claude5}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="text-xs font-semibold text-emerald-400 mb-2">{t.comboCol}</div>
            <ul className="text-[11px] text-muted-foreground space-y-1">
              <li>{t.combo1}</li>
              <li>{t.combo2}</li>
              <li>{t.combo3}</li>
              <li>{t.combo4}</li>
              <li>{t.combo5}</li>
            </ul>
          </div>
        </div>

        <CopyBlock code={`# Typical workflow: 3 steps from analysis to trading

# Step 1: Ask in Claude Code / Codex
"Use sentry to scan the current market, if there are strong signals then backtest the optimal params for that strategy"

# Step 2: AI executes automatically
# → sentry scan --json  (found smart money signal 72%)
# → sentry backtest smart-follow -d 7  (backtest finds optimal SL/TP)
# → Outputs analysis report + parameter recommendations

# Step 3: After you confirm, AI applies the config
# → sentry config set smart_follow.sl_pct 2.5
# → sentry start -i 5  (start dry-run for validation)`} />
      </div>

      {/* Part 6: Other Agent AI Platforms */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">{t.part6Title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          {t.part6Desc}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/60 bg-card/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold">Cursor</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">IDE</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {t.cursorDesc}
            </p>
            <a href="https://cursor.com" target="_blank" rel="noopener" className="text-[10px] text-primary hover:underline">
              cursor.com
            </a>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold">Windsurf (Codeium)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">IDE</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {t.windsurfDesc}
            </p>
            <a href="https://codeium.com/windsurf" target="_blank" rel="noopener" className="text-[10px] text-primary hover:underline">
              codeium.com/windsurf
            </a>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold">Warp Terminal</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">Terminal</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {t.warpDesc}
            </p>
            <a href="https://www.warp.dev" target="_blank" rel="noopener" className="text-[10px] text-primary hover:underline">
              warp.dev
            </a>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold">Aider</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">CLI Agent</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {t.aiderDesc}
            </p>
            <a href="https://aider.chat" target="_blank" rel="noopener" className="text-[10px] text-primary hover:underline">
              aider.chat
            </a>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-primary/5 border border-primary/20 p-4">
          <div className="text-xs font-semibold mb-2">{t.universalTitle}</div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {t.universalDesc}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Terminal className="w-3.5 h-3.5" />
              <span className="font-mono">sentry scan --json</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t.universalFlow_aiRead}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t.universalFlow_understand}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t.universalFlow_action}</span>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">{t.faqTitle}</h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item) => (
            <div key={item.q} className="rounded-lg border border-border/40 p-3">
              <div className="text-sm font-medium mb-1">{item.q}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{item.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Resources & Links */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">{t.resourcesTitle}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <LinkCard
            href="https://github.com/openclaw/openclaw"
            icon={Github}
            title="OpenClaw GitHub"
            desc={t.linkDesc_openclawGithub}
          />
          <LinkCard
            href="https://docs.openclaw.ai/start/getting-started"
            icon={BookOpen}
            title={t.linkTitle_openclawDocs}
            desc={t.linkDesc_openclawDocs}
          />
          <LinkCard
            href="https://github.com/duolaAmengweb3/bfxsentry-agent"
            icon={Github}
            title={t.linkTitle_lobsterGithub}
            desc={t.linkDesc_lobsterGithub}
          />
          <LinkCard
            href="https://www.npmjs.com/package/bfxsentry-agent"
            icon={Download}
            title="npm"
            desc={t.linkDesc_npm}
          />
          <LinkCard
            href="https://github.com/duolaAmengweb3/bfxsentry-agent/blob/main/SKILL.md"
            icon={BookOpen}
            title={t.linkTitle_skillDoc}
            desc={t.linkDesc_skillDoc}
          />
          <LinkCard
            href="https://docs.anthropic.com/en/docs/claude-code/overview"
            icon={Terminal}
            title={t.linkTitle_claudeCode}
            desc={t.linkDesc_claudeCode}
          />
          <LinkCard
            href="https://github.com/openai/codex"
            icon={Github}
            title="OpenAI Codex CLI"
            desc={t.linkDesc_codex}
          />
          <LinkCard
            href="https://setting.bitfinex.com/api"
            icon={Key}
            title={t.linkTitle_bfxApiKey}
            desc={t.linkDesc_bfxApiKey}
          />
          <LinkCard
            href="https://cursor.com"
            icon={Cpu}
            title="Cursor IDE"
            desc={t.linkDesc_cursor}
          />
          <LinkCard
            href="https://aider.chat"
            icon={Globe}
            title="Aider"
            desc={t.linkDesc_aider}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground/50 py-4">
        {t.footer_prefix}
        <a href="https://t.me/dsa885" target="_blank" rel="noopener" className="text-primary/60 hover:text-primary hover:underline">
          {t.footer_tgGroup}
        </a>
        {t.footer_suffix}
      </div>
    </div>
  )
}

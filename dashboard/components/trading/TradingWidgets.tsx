'use client'

import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, Pause, Banknote, ShieldAlert, ChevronDown, ChevronRight, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

// ─── Signal Hero Card ──────────────────────────────────────────
// This is THE main element on every trading module page.
// It shows: direction → name → confidence → conditions → reasoning → levels

interface SignalCondition {
  label: string
  met: boolean
  value: string
}

interface OperationStep {
  step: number
  title: string
  detail?: string
}

interface SignalHeroProps {
  action: string
  name: string
  confidence: number
  reasoning: string
  conditions: SignalCondition[]
  entry?: string
  stop?: string
  target?: string
  advice?: string
  operations?: OperationStep[]
}

const actionStyles: Record<string, {
  label: string; color: string; bg: string; border: string
  gradientFrom: string; icon: typeof TrendingUp
}> = {
  long:             { label: '做多', color: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/40', gradientFrom: 'from-emerald-500/15', icon: TrendingUp },
  trend_long:       { label: '做多', color: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/40', gradientFrom: 'from-emerald-500/15', icon: TrendingUp },
  reversal_long:    { label: '做多', color: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/40', gradientFrom: 'from-emerald-500/15', icon: TrendingUp },
  fake_wall_long:   { label: '做多', color: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/40', gradientFrom: 'from-emerald-500/15', icon: TrendingUp },
  lend:             { label: '放贷', color: 'text-blue-400', bg: 'bg-blue-500', border: 'border-blue-500/40', gradientFrom: 'from-blue-500/15', icon: Banknote },
  short:            { label: '做空', color: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500/40', gradientFrom: 'from-red-500/15', icon: TrendingDown },
  trend_short:      { label: '做空', color: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500/40', gradientFrom: 'from-red-500/15', icon: TrendingDown },
  reversal_short:   { label: '做空', color: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500/40', gradientFrom: 'from-red-500/15', icon: TrendingDown },
  fake_wall_short:  { label: '做空', color: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500/40', gradientFrom: 'from-red-500/15', icon: TrendingDown },
  dont_lever:       { label: '警告', color: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-500/40', gradientFrom: 'from-orange-500/15', icon: ShieldAlert },
  rate_drop:        { label: '预警', color: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500/40', gradientFrom: 'from-amber-500/15', icon: ChevronDown },
  wait:             { label: '观望', color: 'text-zinc-400', bg: 'bg-zinc-500', border: 'border-zinc-500/30', gradientFrom: 'from-zinc-500/10', icon: Pause },
}

export function SignalHero({ action, name, confidence, reasoning, conditions, entry, stop, target, advice, operations }: SignalHeroProps) {
  const { locale } = useI18n()
  const actionLabels = {
    en: { long: 'Long', lend: 'Lend', short: 'Short', warn: 'Warning', alert: 'Alert', wait: 'Wait' },
    zh: { long: '做多', lend: '放贷', short: '做空', warn: '警告', alert: '预警', wait: '观望' },
    vi: { long: 'Long', lend: 'Cho vay', short: 'Short', warn: 'Cảnh báo', alert: 'Báo động', wait: 'Chờ' },
  }[locale]
  const localizedStyles = {
    ...actionStyles,
    long: { ...actionStyles.long, label: actionLabels.long },
    trend_long: { ...actionStyles.trend_long, label: actionLabels.long },
    reversal_long: { ...actionStyles.reversal_long, label: actionLabels.long },
    fake_wall_long: { ...actionStyles.fake_wall_long, label: actionLabels.long },
    lend: { ...actionStyles.lend, label: actionLabels.lend },
    short: { ...actionStyles.short, label: actionLabels.short },
    trend_short: { ...actionStyles.trend_short, label: actionLabels.short },
    reversal_short: { ...actionStyles.reversal_short, label: actionLabels.short },
    fake_wall_short: { ...actionStyles.fake_wall_short, label: actionLabels.short },
    dont_lever: { ...actionStyles.dont_lever, label: actionLabels.warn },
    rate_drop: { ...actionStyles.rate_drop, label: actionLabels.alert },
    wait: { ...actionStyles.wait, label: actionLabels.wait },
  }
  const style = localizedStyles[action as keyof typeof localizedStyles] || localizedStyles.wait
  const Icon = style.icon
  const metCount = conditions.filter((c) => c.met).length
  const isActive = action !== 'wait'
  const copy = {
    en: { conditions: 'Conditions', entry: 'Entry', stop: 'Stop', target: 'Target', guide: 'Bitfinex execution guide' },
    zh: { conditions: '触发条件', entry: '入场', stop: '止损', target: '目标', guide: 'Bitfinex 操作指引' },
    vi: { conditions: 'Điều kiện', entry: 'Điểm vào', stop: 'Dừng lỗ', target: 'Mục tiêu', guide: 'Hướng dẫn thao tác Bitfinex' },
  }[locale]

  return (
    <div className={cn(
      'rounded-2xl border-2 p-0 overflow-hidden transition-all',
      style.border,
      isActive ? 'shadow-lg' : ''
    )}>
      {/* Header: direction + name + confidence */}
      <div className={cn('bg-gradient-to-r to-transparent px-5 py-4', style.gradientFrom)}>
        <div className="flex items-center gap-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', style.bg + '/20')}>
            <Icon className={cn('w-6 h-6', style.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={cn('text-lg font-bold', style.color)}>{style.label}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-sm font-medium truncate">{name}</span>
            </div>
            {/* Confidence bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden max-w-[200px]">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', style.bg)}
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className={cn('text-xs font-mono font-bold', style.color)}>{confidence}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {/* Reasoning */}
        <p className="text-sm text-muted-foreground leading-relaxed">{reasoning}</p>

        {/* Conditions */}
        <div>
            <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">{copy.conditions}</span>
            <span className="text-xs font-mono text-muted-foreground">{metCount}/{conditions.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {c.met ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                )}
                <span className={c.met ? 'text-foreground' : 'text-muted-foreground/50'}>{c.label}</span>
                <span className={cn('ml-auto font-mono text-[11px]', c.met ? 'text-foreground' : 'text-muted-foreground/40')}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Entry / Stop / Target */}
        {(entry || stop || target) && (
          <div className="flex flex-wrap gap-3">
            {entry && (
              <div className="rounded-lg bg-muted/20 border border-border/40 px-3 py-1.5 text-xs">
                <span className="text-muted-foreground">{copy.entry} </span>
                <span className="font-mono font-medium">{entry}</span>
              </div>
            )}
            {stop && (
              <div className="rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-1.5 text-xs">
                <span className="text-red-400/70">{copy.stop} </span>
                <span className="font-mono font-medium text-red-400">{stop}</span>
              </div>
            )}
            {target && (
              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-1.5 text-xs">
                <span className="text-emerald-400/70">{copy.target} </span>
                <span className="font-mono font-medium text-emerald-400">{target}</span>
              </div>
            )}
          </div>
        )}

        {/* Advice */}
        {advice && (
          <div className="rounded-lg bg-muted/15 border border-border/30 px-3 py-2 text-xs text-muted-foreground">
            {advice}
          </div>
        )}

        {/* Operation Steps */}
        {operations && operations.length > 0 && (
            <div className="rounded-xl border border-border/40 bg-muted/5 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border/30 bg-muted/10">
              <span className="text-xs font-semibold">{copy.guide}</span>
            </div>
            <div className="px-4 py-3 space-y-3">
              {operations.map((op) => (
                <div key={op.step} className="flex gap-3">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5',
                    style.bg + '/20', style.color
                  )}>
                    {op.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{op.title}</div>
                    {op.detail && <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{op.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Bias Meter ────────────────────────────────────────────────
export type Bias = 'strong_long' | 'long' | 'neutral' | 'short' | 'strong_short'

const biasConfig: Record<Bias, { label: string; color: string; bg: string; icon: typeof TrendingUp }> = {
  strong_long: { label: '强烈看多', color: 'text-emerald-400', bg: 'bg-emerald-500', icon: TrendingUp },
  long: { label: '偏多', color: 'text-emerald-400', bg: 'bg-emerald-500', icon: TrendingUp },
  neutral: { label: '中性', color: 'text-yellow-400', bg: 'bg-yellow-500', icon: Minus },
  short: { label: '偏空', color: 'text-red-400', bg: 'bg-red-500', icon: TrendingDown },
  strong_short: { label: '强烈看空', color: 'text-red-400', bg: 'bg-red-500', icon: TrendingDown },
}

export function BiasMeter({ score, label }: { score: number; label?: string }) {
  const { locale } = useI18n()
  const biasLabels = {
    en: { strong_long: 'Strong long', long: 'Bullish', neutral: 'Neutral', short: 'Bearish', strong_short: 'Strong short' },
    zh: { strong_long: '强烈看多', long: '偏多', neutral: '中性', short: '偏空', strong_short: '强烈看空' },
    vi: { strong_long: 'Rất bullish', long: 'Bullish', neutral: 'Trung tính', short: 'Bearish', strong_short: 'Rất bearish' },
  }[locale]
  const bias: Bias =
    score >= 60 ? 'strong_long' : score >= 20 ? 'long' : score > -20 ? 'neutral' : score > -60 ? 'short' : 'strong_short'
  const cfg = { ...biasConfig[bias], label: biasLabels[bias] }
  const Icon = cfg.icon
  const pct = ((score + 100) / 200) * 100
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Icon className={cn('w-5 h-5', cfg.color)} />
        <span className={cn('text-lg font-bold', cfg.color)}>{label || cfg.label}</span>
      </div>
      <div className="flex-1 h-3 rounded-full bg-gradient-to-r from-red-500/30 via-yellow-500/30 to-emerald-500/30 relative overflow-hidden">
        <div className={cn('absolute top-0 h-full w-4 rounded-full shadow-lg transition-all duration-500', cfg.bg)} style={{ left: `calc(${pct}% - 8px)` }} />
        <div className="absolute top-0 left-1/2 w-px h-full bg-white/20" />
      </div>
      <span className={cn('font-mono text-sm font-bold min-w-[40px] text-right', cfg.color)}>
        {score >= 0 ? '+' : ''}{score}
      </span>
    </div>
  )
}

// ─── Condition Checklist ───────────────────────────────────────
export interface Condition {
  label: string; met: boolean; value?: string
}

export function ConditionChecklist({ conditions, title }: { conditions: Condition[]; title?: string }) {
  const metCount = conditions.filter((c) => c.met).length
  return (
    <div>
      {title && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium">{title}</span>
          <span className="text-xs font-mono text-muted-foreground">{metCount}/{conditions.length}</span>
        </div>
      )}
      <div className="space-y-1.5">
        {conditions.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {c.met ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
            <span className={c.met ? 'text-foreground' : 'text-muted-foreground/60'}>{c.label}</span>
            {c.value && <span className={cn('ml-auto font-mono', c.met ? 'text-foreground' : 'text-muted-foreground/40')}>{c.value}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Action Card ───────────────────────────────────────────────
export type ActionType = 'long' | 'short' | 'wait' | 'reduce' | 'hedge'

const actionCardConfig: Record<ActionType, { label: string; color: string; border: string; bg: string }> = {
  long: { label: '做多信号', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' },
  short: { label: '做空信号', color: 'text-red-400', border: 'border-red-500/40', bg: 'bg-red-500/10' },
  wait: { label: '观望等待', color: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-500/10' },
  reduce: { label: '减仓/止损', color: 'text-orange-400', border: 'border-orange-500/40', bg: 'bg-orange-500/10' },
  hedge: { label: '对冲建议', color: 'text-blue-400', border: 'border-blue-500/40', bg: 'bg-blue-500/10' },
}

export interface ActionSuggestion {
  type: ActionType; confidence: number; reasoning: string
  levels?: { entry?: string; stop?: string; note?: string }
}

export function ActionCard({ action }: { action: ActionSuggestion }) {
  const { locale } = useI18n()
  const labelMap = {
    en: { long: 'Long setup', short: 'Short setup', wait: 'Wait', reduce: 'Reduce / stop', hedge: 'Hedge idea', confidence: 'Confidence', focus: 'Focus zone', risk: 'Risk level' },
    zh: { long: '做多信号', short: '做空信号', wait: '观望等待', reduce: '减仓/止损', hedge: '对冲建议', confidence: '置信度', focus: '关注区间', risk: '风控位' },
    vi: { long: 'Tín hiệu long', short: 'Tín hiệu short', wait: 'Chờ quan sát', reduce: 'Giảm vị thế / cắt lỗ', hedge: 'Gợi ý hedge', confidence: 'Độ tin cậy', focus: 'Vùng theo dõi', risk: 'Mức rủi ro' },
  }[locale]
  const cfg = { ...actionCardConfig[action.type], label: labelMap[action.type] }
  return (
    <div className={cn('rounded-xl border p-4', cfg.border, cfg.bg)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ChevronRight className={cn('w-4 h-4', cfg.color)} />
          <span className={cn('font-semibold text-sm', cfg.color)}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{labelMap.confidence}</span>
          <div className="w-16 h-2 rounded-full bg-muted/40 overflow-hidden">
            <div className={cn('h-full rounded-full', cfg.bg.replace('/10', ''))} style={{ width: `${action.confidence}%` }} />
          </div>
          <span className={cn('text-xs font-mono font-bold', cfg.color)}>{action.confidence}%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{action.reasoning}</p>
      {action.levels && (
        <div className="flex gap-4 text-xs">
          {action.levels.entry && <div className="rounded-lg bg-muted/30 px-3 py-1.5"><span className="text-muted-foreground">{labelMap.focus} </span><span className="font-mono font-medium">{action.levels.entry}</span></div>}
          {action.levels.stop && <div className="rounded-lg bg-muted/30 px-3 py-1.5"><span className="text-muted-foreground">{labelMap.risk} </span><span className="font-mono font-medium">{action.levels.stop}</span></div>}
          {action.levels.note && <div className="rounded-lg bg-muted/30 px-3 py-1.5"><span className="text-muted-foreground">{action.levels.note}</span></div>}
        </div>
      )}
    </div>
  )
}

// ─── Module Action Header ──────────────────────────────────────
export function ModuleActionHeader({
  moduleName, biasScore, biasLabel, conditions, action,
}: {
  moduleName: string; biasScore: number; biasLabel?: string; conditions: Condition[]; action: ActionSuggestion
}) {
  const { locale } = useI18n()
  const copy = {
    en: { analysis: 'trade analysis', conditions: 'Conditions' },
    zh: { analysis: '交易研判', conditions: '触发条件' },
    vi: { analysis: 'đánh giá giao dịch', conditions: 'Điều kiện' },
  }[locale]
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card/80 to-card/60 backdrop-blur p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-primary/70 font-medium">{moduleName} · {copy.analysis}</span>
        <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground/50" />
      </div>
      <BiasMeter score={biasScore} label={biasLabel} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ConditionChecklist conditions={conditions} title={copy.conditions} />
        <ActionCard action={action} />
      </div>
    </div>
  )
}

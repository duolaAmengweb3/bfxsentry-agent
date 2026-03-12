import { getLogger } from './logger.js'
import { eventBus } from './event-bus.js'
import { collectSnapshot } from '../collector/bitfinex-rest.js'
import { detectEvents } from '../collector/event-detector.js'
import { generateAllSignals, signalSummary } from '../signal/index.js'
import { evaluateAllStrategies } from '../strategy/index.js'
import { strategyFilter } from '../risk/strategy-filter.js'
import { portfolioFilter } from '../risk/portfolio-filter.js'
import { updatePositionPrices, checkStopLossAndTakeProfit, restorePositions, closePositionDb, closeAllPositions, getPositions } from '../risk/position-manager.js'
import { dryRunExecute } from '../executor/dry-run.js'
import { liveExecute, liveClosePosition } from '../executor/bitfinex-trader.js'
import { dryRunPmBet, livePmBet } from '../executor/polymarket.js'
import { openPosition } from '../risk/position-manager.js'
import { logDecision } from './decision-log.js'
import { initRecorder, recordSnapshot, cleanOldSnapshots, closeRecorder } from './recorder.js'
import { initDecisionLog, closeDecisionLog } from './decision-log.js'
import { reconcile, trackOrder } from '../executor/reconciler.js'
import { generateCid } from '../executor/order-id.js'
import type { AgentConfig } from './config.js'
import type { MarketSnapshot } from '../collector/types.js'
import type { Signal } from '../signal/types.js'
import type { TradeIntent } from '../strategy/types.js'

const log = () => getLogger()

export interface EngineState {
  running: boolean
  lastSnapshot: MarketSnapshot | null
  lastSignals: Signal[]
  lastIntents: TradeIntent[]
  tickCount: number
}

const state: EngineState = {
  running: false,
  lastSnapshot: null,
  lastSignals: [],
  lastIntents: [],
  tickCount: 0,
}

export function getEngineState(): EngineState {
  return state
}

// ── Per-strategy tick interval tracking ──
const lastStrategyTick = new Map<string, number>()

const STRATEGY_CONFIG_KEYS: Record<string, string> = {
  'smart-follow': 'smart_follow',
  'funding-arb': 'funding_arb',
  'liq-hunter': 'liq_hunter',
  'ob-sniper': 'ob_sniper',
  'pm-hedge': 'pm_hedge',
}

function shouldRunStrategy(strategyId: string, cfg: AgentConfig): boolean {
  const cfgKey = STRATEGY_CONFIG_KEYS[strategyId]
  if (!cfgKey) return true
  const sCfg = (cfg as unknown as Record<string, Record<string, unknown>>)[cfgKey]
  if (!sCfg?.enabled) return false
  const interval = (sCfg.tick_interval as number) || 0
  if (interval <= 0) return true
  const lastTick = lastStrategyTick.get(strategyId) || 0
  const now = Date.now()
  if (now - lastTick < interval * 1000) return false
  lastStrategyTick.set(strategyId, now)
  return true
}

// ── Scan-only (no trading) ──
export async function runOnce(cfg: AgentConfig): Promise<{ snapshot: MarketSnapshot; signals: Signal[] }> {
  log().debug('Collecting snapshot...')
  const snapshot = await collectSnapshot(cfg)
  detectEvents(snapshot)

  const signals = generateAllSignals(snapshot)
  const summary = signalSummary(signals)

  state.lastSnapshot = snapshot
  state.lastSignals = signals
  state.tickCount++

  eventBus.emit('snapshot:updated', snapshot)
  eventBus.emit('signal:generated', signals)

  if (cfg.recorder.enabled) {
    recordSnapshot(snapshot, signals)
  }

  log().info({
    tick: state.tickCount,
    price: snapshot.ticker.lastPrice,
    direction: summary.direction,
    confidence: summary.confidence.toFixed(1),
    signals: signals.length,
    bullish: summary.bullish,
    bearish: summary.bearish,
  }, 'Tick complete')

  return { snapshot, signals }
}

// ── Full tick: collect → signal → strategy → risk → execute ──
async function runFullTick(cfg: AgentConfig) {
  // Guard: refuse to run if engine is stopped
  if (!state.running) return

  const { snapshot, signals } = await runOnce(cfg)
  const price = snapshot.ticker.lastPrice

  // Bail early if stopped during collection
  if (!state.running) return

  // Update open positions
  updatePositionPrices(price)

  // Check stop loss / take profit
  const closed = checkStopLossAndTakeProfit(price)
  for (const c of closed) {
    log().info({ posId: c.posId, pnl: c.pnl, reason: c.reason }, 'Position closed')
  }

  // Evaluate strategies (respecting per-strategy tick_interval)
  const allIntents = evaluateAllStrategies(signals, snapshot, cfg)
  const intents = allIntents.filter(i => shouldRunStrategy(i.strategy, cfg))
  state.lastIntents = intents

  // Risk filter + execute
  for (const intent of intents) {
    if (!state.running) break // stop mid-loop if engine shutting down

    // Assign a CID to the intent for idempotent tracking
    const cid = generateCid(intent.strategy)
    intent.meta = { ...intent.meta, cid }

    const sf = strategyFilter(intent, cfg)
    const pf = sf.passed ? portfolioFilter(intent, cfg) : { passed: false, reason: sf.reason }
    const riskResult = { passed: sf.passed && pf.passed, reason: sf.reason || pf.reason }

    if (riskResult.passed) {
      let result
      const isPmBet = intent.meta?.pmBet === true
      if (isPmBet) {
        // PM bets use Polymarket executor, not Bitfinex
        result = cfg.engine.mode === 'live'
          ? await livePmBet(intent)
          : dryRunPmBet(intent)
      } else if (cfg.engine.mode === 'live') {
        result = await liveExecute(intent, cfg)
      } else {
        result = dryRunExecute(intent, snapshot)
      }

      // Track order — use CID as the key, store exchange ID separately
      trackOrder({
        cid,
        exchangeOrderId: result.exchangeOrderId,
        strategyId: intent.strategy,
        direction: intent.direction,
        instrument: intent.instrument,
        size: result.fillSize || 0,
        price: result.fillPrice || intent.entryPrice,
        orderType: cfg.risk.order_type,
        status: result.success ? 'FILLED' : 'REJECTED',
        fillPrice: result.fillPrice,
        fillSize: result.fillSize,
        fee: result.fee,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        retryCount: 0,
      })

      if (result.success) {
        openPosition(intent, result)
        eventBus.emit('order:filled', { intent, result })
      }

      logDecision({
        timestamp: Date.now(),
        strategy: intent.strategy,
        signalsSnapshot: signals.map(s => ({ id: s.id, module: s.module, direction: s.direction, confidence: s.confidence })),
        configSnapshot: { mode: cfg.engine.mode },
        intent,
        riskFilterResult: riskResult,
        executionResult: result,
      })
    } else {
      log().debug({ strategy: intent.strategy, reason: riskResult.reason }, 'Intent rejected by risk filter')
      logDecision({
        timestamp: Date.now(),
        strategy: intent.strategy,
        signalsSnapshot: signals.map(s => ({ id: s.id, module: s.module, direction: s.direction, confidence: s.confidence })),
        configSnapshot: { mode: cfg.engine.mode },
        intent,
        riskFilterResult: riskResult,
        executionResult: null,
      })
    }
  }

  // Periodic reconciliation
  if (state.tickCount % 30 === 0) {
    await reconcile()
  }
}

// ── Engine lifecycle ──

// Stored handler refs so we can unbind on stop
type Handler = (...args: unknown[]) => void
const eventHandlers: { event: string; handler: Handler }[] = []

function bindEvent(event: Parameters<typeof eventBus.on>[0], handler: Handler) {
  eventBus.on(event, handler)
  eventHandlers.push({ event, handler })
}

function unbindAllEvents() {
  for (const { event, handler } of eventHandlers) {
    eventBus.off(event as Parameters<typeof eventBus.off>[0], handler)
  }
  eventHandlers.length = 0
}

export async function startEngine(cfg: AgentConfig, intervalSec = 10) {
  if (state.running) {
    log().warn('Engine already running')
    return
  }

  state.running = true

  if (cfg.recorder.enabled) {
    initRecorder()
    cleanOldSnapshots(cfg.recorder.retention_days)
  }
  initDecisionLog()
  restorePositions()

  log().info({ mode: cfg.engine.mode, interval: intervalSec }, 'Engine started')

  let tickInFlight = false
  let tickInflightPromise: Promise<void> | null = null

  const guardedTick = async (source: string) => {
    if (!state.running) return
    if (tickInFlight) {
      log().warn({ source }, 'Tick still in-flight, skipping')
      return
    }
    tickInFlight = true
    const p = (async () => {
      try {
        await runFullTick(cfg)
      } catch (err) {
        log().error({ err, source }, 'Tick error')
      } finally {
        tickInFlight = false
        tickInflightPromise = null
      }
    })()
    tickInflightPromise = p
    await p
  }

  // Wire event-detector urgent events through the same guarded tick
  bindEvent('event:liq_cascade', () => {
    log().warn('Urgent event: liq_cascade — triggering immediate tick')
    guardedTick('liq_cascade')
  })
  bindEvent('event:wall_break', () => {
    log().info('Urgent event: wall_break — triggering immediate tick')
    guardedTick('wall_break')
  })

  // Spread extreme: pause market orders for 60s
  let spreadPauseUntil = 0
  const savedOrderType = cfg.risk.order_type
  bindEvent('event:spread_extreme', (...args: unknown[]) => {
    const data = args[0] as { spreadPct: number } | undefined
    const pct = data?.spreadPct ?? 0
    log().warn({ spreadPct: pct.toFixed(4) }, 'Spread extreme — forcing limit-only for 60s')
    spreadPauseUntil = Date.now() + 60_000
    cfg.risk.order_type = 'limit'
    setTimeout(() => {
      if (Date.now() >= spreadPauseUntil && state.running) {
        cfg.risk.order_type = savedOrderType
        log().info('Spread extreme pause expired, restoring order type')
      }
    }, 60_000)
  })

  // Initial tick
  await guardedTick('initial')

  // Scheduled ticks
  const timer = setInterval(() => guardedTick('scheduled'), intervalSec * 1000)

  // Store shutdown resolver so stopEngine() can return a promise
  stopResolve = null
  stopPromise = new Promise<void>(resolve => { stopResolve = resolve })

  bindEvent('engine:stop', () => {
    // 1. Prevent new ticks
    state.running = false
    clearInterval(timer)

    // 2. Unbind event listeners immediately to prevent new urgent ticks
    unbindAllEvents()

    // 3. Wait for in-flight tick, then close positions and clean up
    const finish = async () => {
      // Wait for any in-flight tick to complete
      if (tickInflightPromise) {
        log().info('Waiting for in-flight tick to complete...')
        await tickInflightPromise
      }

      // Close all open positions
      const positions = getPositions()
      if (positions.length > 0) {
        const lastPrice = state.lastSnapshot?.ticker.lastPrice ?? 0

        // In live mode, send real close orders to the exchange first
        if (cfg.engine.mode === 'live') {
          log().info({ count: positions.length }, 'Sending exchange close orders for all positions')
          const closeResults = await Promise.allSettled(
            positions.map(pos =>
              liveClosePosition(pos.instrument, pos.direction, pos.size)
            )
          )
          for (let i = 0; i < closeResults.length; i++) {
            const r = closeResults[i]
            const pos = positions[i]
            if (r.status === 'fulfilled' && r.value.success) {
              log().info({ posId: pos.id, instrument: pos.instrument }, 'Exchange close order sent')
            } else {
              const err = r.status === 'rejected' ? r.reason : r.value.error
              log().error({ posId: pos.id, err }, 'Exchange close order FAILED — manual intervention needed')
            }
          }
        }

        // Update local state
        if (lastPrice > 0) {
          log().info({ count: positions.length, price: lastPrice }, 'Closing positions in local ledger')
          const totalPnl = closeAllPositions(lastPrice)
          log().info({ totalPnl: totalPnl.toFixed(2) }, 'All positions closed locally')
        } else {
          log().warn('No last price available — local positions NOT closed')
        }
      }

      // Restore order type if modified by spread pause
      cfg.risk.order_type = savedOrderType

      closeRecorder()
      closeDecisionLog()
      closePositionDb()
      log().info('Engine stopped — graceful shutdown complete')

      if (stopResolve) stopResolve()
    }
    finish().catch(err => {
      log().error({ err }, 'Error during graceful shutdown')
      if (stopResolve) stopResolve()
    })
  })
}

// Module-level stop promise so stopEngine() can be awaited
let stopPromise: Promise<void> | null = null
let stopResolve: (() => void) | null = null

export async function stopEngine(): Promise<void> {
  eventBus.emit('engine:stop')
  if (stopPromise) await stopPromise
}

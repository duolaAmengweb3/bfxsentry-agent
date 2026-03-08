/**
 * Polymarket Executor — executes PM bets via Polymarket CLI.
 *
 * In dry-run mode: logs the bet without executing.
 * In live mode: calls `polymarket market-order` via child_process.
 *
 * Requires Polymarket CLI installed: `brew install polymarket-cli`
 * and configured with API keys via `polymarket auth`.
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { getLogger } from '../core/logger.js'
import type { TradeIntent, ExecutionResult } from '../strategy/types.js'

const execFileAsync = promisify(execFile)
const log = () => getLogger()

// Try to find polymarket CLI
const PM_CLI_PATHS = [
  '/opt/homebrew/bin/polymarket',
  '/usr/local/bin/polymarket',
  'polymarket',
]

async function findPmCli(): Promise<string> {
  for (const path of PM_CLI_PATHS) {
    try {
      await execFileAsync(path, ['--version'])
      return path
    } catch { /* try next */ }
  }
  throw new Error('Polymarket CLI not found. Install via: brew install polymarket-cli')
}

/**
 * Dry-run PM bet — just logs it.
 */
export function dryRunPmBet(intent: TradeIntent): ExecutionResult {
  const meta = intent.meta || {}
  const stakeUsdc = (meta.stakeUsdc as number) || 100
  const outcome = meta.pmOutcome as string || 'unknown'

  log().info({
    strategy: 'pm-hedge',
    outcome,
    stakeUsdc,
    confidence: (meta.signalConfidence as number)?.toFixed(1),
    direction: intent.direction,
    mode: 'DRY-RUN',
  }, `[DRY-RUN] PM BET: Buy ${outcome} for $${stakeUsdc}`)

  return {
    success: true,
    orderId: intent.id,
    fillPrice: 0.50, // simulated 50c per share
    fillSize: stakeUsdc / 0.50, // number of shares
    fee: stakeUsdc * 0.02, // ~2% PM fee
    timestamp: Date.now(),
  }
}

/**
 * Live PM bet — executes via Polymarket CLI.
 *
 * Uses `polymarket market-order` to buy Yes shares on the relevant market.
 * The CLI handles authentication and order routing.
 */
export async function livePmBet(intent: TradeIntent): Promise<ExecutionResult> {
  const meta = intent.meta || {}
  const stakeUsdc = (meta.stakeUsdc as number) || 100
  const outcome = meta.pmOutcome as string || 'unknown'
  const direction = meta.signalDirection as string || 'long'

  try {
    const cli = await findPmCli()

    // Build the market order command
    // polymarket market-order --market "Will BTC go up?" --outcome Yes --amount 100
    const marketQuery = direction === 'long'
      ? 'Will Bitcoin go up'
      : 'Will Bitcoin go down'

    const args = [
      'market-order',
      '--market', marketQuery,
      '--outcome', 'Yes',
      '--amount', stakeUsdc.toString(),
      '--json',
    ]

    log().info({
      cli,
      args: args.join(' '),
      stakeUsdc,
    }, `[LIVE] Executing PM bet: ${outcome}`)

    const { stdout, stderr } = await execFileAsync(cli, args, { timeout: 30_000 })

    if (stderr) {
      log().warn({ stderr }, 'PM CLI stderr')
    }

    // Parse CLI output
    let result: Record<string, unknown> = {}
    try {
      result = JSON.parse(stdout)
    } catch {
      log().info({ stdout }, 'PM CLI raw output')
    }

    return {
      success: true,
      orderId: (result.orderId as string) || intent.id,
      exchangeOrderId: result.orderId as string,
      fillPrice: (result.avgPrice as number) || 0.50,
      fillSize: (result.shares as number) || stakeUsdc / 0.50,
      fee: (result.fee as number) || stakeUsdc * 0.02,
      timestamp: Date.now(),
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log().error({ err: msg }, 'PM bet execution failed')

    return {
      success: false,
      error: msg,
      timestamp: Date.now(),
    }
  }
}

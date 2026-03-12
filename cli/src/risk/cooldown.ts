interface CooldownEntry {
  strategy: string
  direction: 'long' | 'short'
  reason: string
  expiresAt: number
}

const cooldowns: CooldownEntry[] = []

export function addCooldown(strategy: string, direction: 'long' | 'short', durationSec: number, reason: string) {
  cooldowns.push({
    strategy,
    direction,
    reason,
    expiresAt: Date.now() + durationSec * 1000,
  })
}

export function isCoolingDown(strategy: string, direction: 'long' | 'short'): { cooling: boolean; reason?: string; remainingSec?: number } {
  const now = Date.now()
  // Clean expired
  for (let i = cooldowns.length - 1; i >= 0; i--) {
    if (cooldowns[i].expiresAt <= now) cooldowns.splice(i, 1)
  }

  const active = cooldowns.find(c => c.strategy === strategy && c.direction === direction)
  if (active) {
    return {
      cooling: true,
      reason: active.reason,
      remainingSec: Math.ceil((active.expiresAt - now) / 1000),
    }
  }
  return { cooling: false }
}

export function clearCooldowns() {
  cooldowns.length = 0
}

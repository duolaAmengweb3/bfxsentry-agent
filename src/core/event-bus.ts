import { EventEmitter } from 'node:events'

export type EventType =
  | 'snapshot:updated'
  | 'event:liq_cascade'
  | 'event:wall_break'
  | 'event:spread_extreme'
  | 'signal:generated'
  | 'intent:created'
  | 'order:submitted'
  | 'order:filled'
  | 'engine:tick'
  | 'engine:stop'

class TypedEventBus {
  private emitter = new EventEmitter()

  constructor() {
    this.emitter.setMaxListeners(50)
  }

  on(event: EventType, handler: (...args: unknown[]) => void) {
    this.emitter.on(event, handler)
  }

  off(event: EventType, handler: (...args: unknown[]) => void) {
    this.emitter.off(event, handler)
  }

  emit(event: EventType, ...args: unknown[]) {
    this.emitter.emit(event, ...args)
  }

  once(event: EventType, handler: (...args: unknown[]) => void) {
    this.emitter.once(event, handler)
  }
}

export const eventBus = new TypedEventBus()

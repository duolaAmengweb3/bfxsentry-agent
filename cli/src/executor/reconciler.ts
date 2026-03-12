import { getLogger } from '../core/logger.js'
import type { Order, OrderStatus } from './types.js'

const log = () => getLogger()

// In-memory order store (will be persisted to SQLite in future)
const orders = new Map<string, Order>()

export function trackOrder(order: Order) {
  orders.set(order.cid, order)
}

export function getOrder(cid: string): Order | undefined {
  return orders.get(cid)
}

export function updateOrderStatus(cid: string, status: OrderStatus, updates?: Partial<Order>) {
  const order = orders.get(cid)
  if (!order) return
  order.status = status
  order.updatedAt = Date.now()
  if (updates) Object.assign(order, updates)
}

export function getPendingOrders(): Order[] {
  return [...orders.values()].filter(o => o.status === 'PENDING' || o.status === 'ACCEPTED')
}

export function getRecentOrders(limit = 20): Order[] {
  return [...orders.values()]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
}

// Reconciliation: compare local state vs exchange state
// In a full implementation, this would call Bitfinex auth API
export async function reconcile() {
  const pending = getPendingOrders()
  if (pending.length === 0) return

  log().info({ count: pending.length }, 'Reconciling pending orders')

  for (const order of pending) {
    const ageSec = (Date.now() - order.createdAt) / 1000

    // Timeout orders older than 5 minutes
    if (ageSec > 300 && order.status === 'PENDING') {
      updateOrderStatus(order.cid, 'TIMEOUT')
      log().warn({ cid: order.cid, ageSec }, 'Order timed out')
    }
  }
}

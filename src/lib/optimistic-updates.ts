/**
 * Optimistic UI update utilities
 * These helpers provide immediate UI feedback before blockchain confirmations
 */

export interface OptimisticUpdate<T> {
  id: string
  data: T
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
}

/**
 * Create an optimistic update that can be tracked
 */
export function createOptimisticUpdate<T>(data: T): OptimisticUpdate<T> {
  return {
    id: `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    data,
    timestamp: Date.now(),
    status: 'pending',
  }
}

/**
 * Merge optimistic updates with actual data
 * Optimistic updates are shown first, then actual data
 */
export function mergeWithOptimistic<T extends { id?: string }>(
  actualData: T[],
  optimisticUpdates: OptimisticUpdate<T>[]
): T[] {
  const pendingUpdates = optimisticUpdates
    .filter((update) => update.status === 'pending')
    .map((update) => update.data)

  return [...pendingUpdates, ...actualData]
}

/**
 * Remove optimistic update after confirmation
 */
export function removeOptimisticUpdate<T>(
  updates: OptimisticUpdate<T>[],
  id: string
): OptimisticUpdate<T>[] {
  return updates.filter((update) => update.id !== id)
}

/**
 * Update optimistic update status
 */
export function updateOptimisticStatus<T>(
  updates: OptimisticUpdate<T>[],
  id: string,
  status: 'confirmed' | 'failed'
): OptimisticUpdate<T>[] {
  return updates.map((update) =>
    update.id === id ? { ...update, status } : update
  )
}

/**
 * Clean up old optimistic updates (older than 5 minutes)
 */
export function cleanupOldOptimisticUpdates<T>(
  updates: OptimisticUpdate<T>[]
): OptimisticUpdate<T>[] {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  return updates.filter((update) => update.timestamp > fiveMinutesAgo)
}

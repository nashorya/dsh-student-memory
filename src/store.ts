import type { L1Live, L2Pinned } from './types.ts'

/**
 * Session-local pin/live state. Replaced by storageDomain in M2.
 * A new plugin load starts empty (disk-derived later).
 */
export class MemoryStore {
  pinned: L2Pinned = {}
  live: L1Live['live'] = {}
  recall: NonNullable<L1Live['recall']> = []

  pin(next: L2Pinned): void {
    this.pinned = { ...next }
  }

  setLive(next: L1Live['live']): void {
    this.live = { ...next }
  }

  setRecall(next: NonNullable<L1Live['recall']>): void {
    this.recall = [...next]
  }
}

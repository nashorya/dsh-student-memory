import type { L1Live, L2Pinned, RecalledLesson } from './types.ts'

/**
 * Session-local pin/near-field/recall. Runtime owns the live copy;
 * this store is the typed shape for the three dynamic layers.
 */
export class MemoryStore {
  pinned: L2Pinned = {}
  nearField: L1Live = {}
  recall: RecalledLesson[] = []

  pin(next: L2Pinned): void {
    this.pinned = { ...next }
  }

  setNearField(next: L1Live): void {
    this.nearField = { ...next }
  }

  setRecall(next: RecalledLesson[]): void {
    this.recall = [...next]
  }
}

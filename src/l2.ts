import type { L2Pinned } from './types.ts'

/**
 * Pinned L2 body. Empty when nothing is pinned so the system-prompt section drops.
 */
export function renderL2(pinned: L2Pinned): string {
  const parts: string[] = []
  const wm = pinned.workingMemory?.trim()
  if (wm) parts.push(`## Working memory\n\n${wm}`)
  const ledger = pinned.taskLedger?.trim()
  if (ledger) parts.push(`## Task ledger\n\n${ledger}`)
  return parts.join('\n\n')
}

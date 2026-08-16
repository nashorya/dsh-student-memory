import type { L1Live } from './types.ts'

/**
 * Per-assembly L1 body. Built only from the current payload — callers must not
 * pass previous-turn text. Empty string contributes nothing to the snapshot.
 */
export function renderL1(input: L1Live): string {
  const parts: string[] = []
  const live = input.live ?? {}
  const liveLines = Object.entries(live)
    .filter(([, value]) => value.trim().length > 0)
    .map(([key, value]) => `- ${key}: ${value.trim()}`)
  if (liveLines.length > 0) {
    parts.push(`## Live\n\n${liveLines.join('\n')}`)
  }
  const recall = (input.recall ?? []).filter((item) => item.summary.trim().length > 0)
  if (recall.length > 0) {
    const lines = recall.map((item) => `- ${item.id}: ${item.summary.trim()}`)
    parts.push(`## Recall\n\n${lines.join('\n')}`)
  }
  const arcs = (input.openArcs ?? []).filter((id) => id.trim().length > 0)
  if (arcs.length > 0) {
    parts.push(`## Open arcs\n\n${arcs.map((id) => `- ${id}`).join('\n')}`)
  }
  if (input.harvest?.trim()) {
    parts.push(input.harvest.trim())
  }
  if (input.watermark) {
    parts.push(input.watermark)
  }
  return parts.join('\n\n')
}

import type { Adr, L2Pinned, TodoItem } from './types.ts'

export function renderL2(
  pinned: L2Pinned,
  board: { adrs?: Adr[]; todos?: TodoItem[] } = {},
): string {
  const parts: string[] = []
  const adrs = board.adrs ?? []
  if (adrs.length > 0) {
    parts.push(`## ADR\n\n${adrs.map((adr) => `- ${adr.id} ${adr.status} ${adr.title}`).join('\n')}`)
  }
  const todos = board.todos ?? []
  if (todos.length > 0) {
    parts.push(`## Todo\n\n${todos.map((todo) => `- [${todo.status}] ${todo.adrId} ${todo.content}`).join('\n')}`)
  }
  const wm = pinned.workingMemory?.trim()
  if (wm) parts.push(`## Working memory\n\n${wm}`)
  const ledger = pinned.taskLedger?.trim()
  if (ledger) parts.push(`## Task ledger\n\n${ledger}`)
  return parts.join('\n\n')
}

import type { L2Pinned, Stage, TodoItem } from './types.ts'

export function renderL2Summary(
  pinned: L2Pinned,
  board: { stages?: Stage[]; todos?: TodoItem[] } = {},
): string {
  const parts: string[] = []
  const wm = pinned.workingMemory?.trim()
  if (wm) parts.push(`workingMemory:\n${wm}`)

  const ledger = pinned.taskLedger?.trim()
  if (ledger) parts.push(`taskLedger:\n${ledger}`)

  const doingStage = (board.stages ?? []).find((stage) => stage.status === 'doing')
  const stageTodos = (board.todos ?? []).filter((todo) => {
    if (doingStage) return todo.stageId === doingStage.id && todo.status !== 'done'
    return todo.status !== 'done'
  })
  if (stageTodos.length > 0) {
    const heading = doingStage ? `stage ${doingStage.title}` : 'todolist'
    parts.push(`${heading}:\n${stageTodos.map((todo) => `- [${todo.status}] ${todo.content}`).join('\n')}`)
  }

  const errors = (pinned.recentErrors ?? []).map((line) => line.trim()).filter(Boolean)
  if (errors.length > 0) {
    parts.push(`recentErrors:\n${errors.map((line) => `- ${line}`).join('\n')}`)
  }

  return parts.join('\n\n')
}

/** @deprecated use renderL2Summary */
export function renderL2(
  pinned: L2Pinned,
  board: { todos?: TodoItem[]; stages?: Stage[] } = {},
): string {
  return renderL2Summary(pinned, board)
}

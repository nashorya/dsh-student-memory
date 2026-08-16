import { join } from 'node:path'
import { truncateL1 } from './budget.ts'
import { FilePersist, MemoryPersist } from './persist.ts'
import { observationFromExec, writeLessonTool } from './tool.ts'
import { StudentMemoryRuntime } from './runtime.ts'
import {
  DEFAULT_L1_BUDGET,
  L1_CONTEXT,
  L1_ORDER,
  L2_ORDER,
  L2_SECTION,
} from './types.ts'
import type { StudentMemoryConfig } from './types.ts'

export { applyL1Budget, truncateL1 } from './budget.ts'
export { renderL1 } from './l1.ts'
export { renderL2 } from './l2.ts'
export { StudentMemoryRuntime, ARC_REMINDER, HARVEST_PROMPT } from './runtime.ts'
export { writeLessonTool } from './tool.ts'
export { renderReceipt, renderSidebar } from './receipt.ts'
export { renderDashboard } from './dashboard.ts'
export { verdictOf } from './verdict.ts'
export { recallLessons } from './recall.ts'
export {
  DEFAULT_L1_BUDGET,
  DEFAULT_WATERMARK,
  L1_CONTEXT,
  L1_ORDER,
  L2_ORDER,
  L2_SECTION,
} from './types.ts'
export type { Adr, AssembledPrompt, L1Live, L2Pinned, StudentMemoryConfig, TodoItem } from './types.ts'
export type { Lesson, LessonDraft, LessonTrust } from './lesson.ts'

export const name = 'student-memory'
export const inject = ['systemPrompt', 'tools']

export interface StudentMemoryContext {
  systemPrompt: {
    section(section: {
      name: string
      order: number
      text: string | (() => string)
    }): () => void
    context(context: {
      name: string
      order: number
      text: string | ((assemble: unknown) => string)
    }): () => void
  }
  on(event: string, listener: (...args: unknown[]) => unknown): () => void
  tools: { register(tool: unknown): unknown }
}

export function defaultMemoryDir(): string {
  return join(process.cwd(), '.dsh-student-memory')
}

export function apply(ctx: StudentMemoryContext, config: StudentMemoryConfig | null | undefined = {}): StudentMemoryRuntime {
  const options = config ?? {}
  const persistMode = options.persist ?? 'file'
  const storePath = options.storePath ?? join(defaultMemoryDir(), 'lessons.json')
  const dashboardPath = options.dashboardPath
    ?? (persistMode === 'file' ? join(defaultMemoryDir(), 'dashboard.html') : undefined)
  const persist = persistMode === 'file' ? new FilePersist(storePath) : new MemoryPersist()
  const runtime = new StudentMemoryRuntime(persist, { ...options, storePath, dashboardPath })
  void runtime.boot()
  if (dashboardPath) console.info(`[student-memory] ${dashboardPath}`)
  const budget = options.l1BudgetChars ?? DEFAULT_L1_BUDGET

  ctx.systemPrompt.section({
    name: L2_SECTION,
    order: L2_ORDER,
    text: () => runtime.l2Text(),
  })

  ctx.systemPrompt.context({
    name: L1_CONTEXT,
    order: L1_ORDER,
    text: () => truncateL1(runtime.l1Text(), budget),
  })

  ctx.on('tools/result', ((exec: Record<string, unknown>, result: Record<string, unknown>) => {
    const note = runtime.observeTool(observationFromExec(exec, result))
    if (note.reminder) {
      runtime.pinned = {
        ...runtime.pinned,
        taskLedger: [runtime.pinned.taskLedger, note.reminder].filter(Boolean).join('\n'),
      }
    }
  }) as never)

  ctx.on('agent/turn-stopping', (() => {
    runtime.requestHarvest()
  }) as never)

  ctx.tools.register(writeLessonTool(runtime))

  return runtime
}

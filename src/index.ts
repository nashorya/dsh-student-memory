import { homedir } from 'node:os'
import { join } from 'node:path'
import { applyL1Budget } from './budget.ts'
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

export { applyL1Budget } from './budget.ts'
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
export type { AssembledPrompt, L1Live, L2Pinned, StudentMemoryConfig } from './types.ts'
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
  return join(homedir(), '.dsh', 'student-memory')
}

export function apply(ctx: StudentMemoryContext, config: StudentMemoryConfig = {}): StudentMemoryRuntime {
  const persistMode = config.persist ?? 'file'
  const storePath = config.storePath ?? join(defaultMemoryDir(), 'lessons.json')
  const dashboardPath = config.dashboardPath ?? join(defaultMemoryDir(), 'dashboard.html')
  const persist = persistMode === 'file' ? new FilePersist(storePath) : new MemoryPersist()
  const runtime = new StudentMemoryRuntime(persist, { ...config, storePath, dashboardPath })
  void runtime.boot()
  const budget = config.l1BudgetChars ?? DEFAULT_L1_BUDGET

  ctx.systemPrompt.section({
    name: L2_SECTION,
    order: L2_ORDER,
    text: () => runtime.l2Text(),
  })

  ctx.systemPrompt.context({
    name: L1_CONTEXT,
    order: L1_ORDER,
    text: () => runtime.l1Text(),
  })

  ctx.on('system-prompt/assemble', (async (
    _assembly: { sections: { name: string; text: string }[]; contexts: { name: string; text: string }[] },
    _assembleContext: unknown,
    next: () => Promise<{ sections: { name: string; text: string }[]; contexts: { name: string; text: string }[] }>,
  ) => {
    const trimmed = applyL1Budget(await next(), budget)
    void runtime.flushDashboard()
    return trimmed
  }) as never)

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

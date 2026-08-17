import { join } from 'node:path'
import { truncateL1 } from './budget.ts'
import { excludeConflictingPlugins } from './exclude.ts'
import { dropPriorTurns } from './history.ts'
import type { HistorySession } from './history.ts'
import { FilePersist, MemoryPersist } from './persist.ts'
import { observationFromExec, planStepTool, writeLessonTool } from './tool.ts'
import { StudentMemoryRuntime } from './runtime.ts'
import { registerMemoryRoutes } from './web.ts'
import type { MemoryWebServer } from './web.ts'
import {
  L0_ORDER,
  L0_SECTION,
  L1_CONTEXT,
  L1_ORDER,
  L1_SAFETY_CHARS,
} from './types.ts'
import type { StudentMemoryConfig } from './types.ts'

export { applyL1Budget, truncateL1 } from './budget.ts'
export { assembleLayers } from './assemble.ts'
export { EXCLUDED_PLUGINS, excludeConflictingPlugins, matchesExcluded } from './exclude.ts'
export { dropPriorTurns, PRIOR_TURN_STUB } from './history.ts'
export { selectPriorTurnRange } from './surface-policy.ts'
export { renderL0 } from './l0.ts'
export { renderL1 } from './l1.ts'
export { renderL2, renderL2Summary } from './l2.ts'
export { StudentMemoryRuntime, ARC_REMINDER, HARVEST_PROMPT } from './runtime.ts'
export { planStepTool, writeLessonTool } from './tool.ts'
export { renderReceipt, renderSidebar, usedRecallIds } from './receipt.ts'
export { renderDashboard } from './dashboard.ts'
export { verdictOf } from './verdict.ts'
export { lessonCards, recallLessons } from './recall.ts'
export {
  CACHE_PREFIX_BREAKPOINT,
  DEFAULT_L1_BUDGET,
  L0_ORDER,
  L0_SECTION,
  L1_CONTEXT,
  L1_ORDER,
  L1_SAFETY_CHARS,
} from './types.ts'
export type { Adr, AssembledPrompt, L1Live, L2Pinned, Stage, StudentMemoryConfig, TodoItem } from './types.ts'
export type { Lesson, LessonDraft, LessonTrust } from './lesson.ts'

export const name = 'student-memory'
export const inject = ['systemPrompt', 'tools', 'webServer']

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
  loader?: { entries(): Iterable<{
    id?: string
    disabled?: boolean
    options?: { id?: string; name?: string }
    update(options: { disabled: boolean }): Promise<unknown>
  }> }
  webServer?: MemoryWebServer
}

export function defaultMemoryDir(): string {
  return join(process.cwd(), '.dsh-student-memory')
}

/** Join text blocks from a session `assistant/message` event; '' when not one. */
export function assistantTextFromEvent(event: unknown): string {
  const rec = event as { type?: unknown; data?: { message?: { content?: unknown } } } | null
  if (!rec || rec.type !== 'assistant/message') return ''
  const content = rec.data?.message?.content
  if (!Array.isArray(content)) return ''
  return content
    .filter((block): block is { type: string; text: string } =>
      !!block && typeof block === 'object'
      && (block as { type?: unknown }).type === 'text'
      && typeof (block as { text?: unknown }).text === 'string')
    .map((block) => block.text)
    .join('')
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
  const excluded = excludeConflictingPlugins(ctx)
  const budget = options.l1BudgetChars ?? L1_SAFETY_CHARS

  ctx.systemPrompt.section({
    name: L0_SECTION,
    order: L0_ORDER,
    text: () => runtime.l0Text(),
  })

  ctx.systemPrompt.context({
    name: L1_CONTEXT,
    order: L1_ORDER,
    text: () => truncateL1(runtime.l1Text({ consumeHarvest: true }), budget),
  })

  ctx.on('tools/result', ((exec: Record<string, unknown>, result: Record<string, unknown>) => {
    runtime.observeTool(observationFromExec(exec, result))
  }) as never)

  ctx.on('session/event', ((_session: unknown, event: unknown) => {
    const text = assistantTextFromEvent(event)
    if (text) runtime.noteModelText(text)
  }) as never)

  ctx.on('agent/pre-step', ((event: unknown, next?: unknown) => {
    return excluded.then(() => {
      const session = (event as { agent?: { session?: HistorySession } } | null)?.agent?.session
      if (session) dropPriorTurns(session)
      return typeof next === 'function' ? (next as () => unknown)() : undefined
    })
  }) as never)

  ctx.tools.register(writeLessonTool(runtime))
  ctx.tools.register(planStepTool(runtime))
  if (ctx.webServer) registerMemoryRoutes(ctx.webServer, runtime)

  return runtime
}

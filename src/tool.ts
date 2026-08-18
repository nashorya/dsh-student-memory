import type { LessonDraft } from './lesson.ts'
import type { StudentMemoryRuntime } from './runtime.ts'
import type { ToolObservation } from './arc.ts'

export const WRITE_LESSON_DESCRIPTION =
  'Record a lesson after a wrong-then-right correction. Use an arcId from Open arcs in the current runtime context. Fill only semantic fields.'

export function asDraft(args: Record<string, unknown> | null | undefined): LessonDraft {
  const rec = args && typeof args === 'object' ? args : {}
  const str = (key: string) => typeof rec[key] === 'string' ? rec[key] as string : ''
  return {
    arcId: str('arcId'),
    cause: str('cause'),
    fixPattern: str('fixPattern'),
    contrast: str('contrast'),
    doNotApplyWhen: str('doNotApplyWhen'),
  }
}

export function planStepTool(getRuntime: () => StudentMemoryRuntime) {
  return {
    name: 'plan_step',
    description: 'Write the todolist for one stage. Replaces that stage\'s todos. Requires an existing ADR stage from propose_adr.',
    parameters: {
      type: 'object',
      properties: {
        stageId: { type: 'string', description: 'Stage id to plan.' },
        todos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              status: { type: 'string', enum: ['pending', 'doing', 'done'] },
            },
            required: ['content'],
          },
        },
      },
      required: ['stageId', 'todos'],
    },
    output: {
      schema: { type: 'string' },
      render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
    },
    async execute(args: Record<string, unknown> | null | undefined) {
      const rec = args && typeof args === 'object' ? args : {}
      const stageId = typeof rec.stageId === 'string' ? rec.stageId : ''
      const raw = Array.isArray(rec.todos) ? rec.todos : []
      const todos = raw.flatMap((row) => {
        const item = row && typeof row === 'object' ? row as Record<string, unknown> : {}
        const content = String(item.content ?? '').trim()
        if (!content) return []
        const status: 'pending' | 'doing' | 'done' | undefined =
          item.status === 'doing' || item.status === 'done' || item.status === 'pending'
            ? item.status
            : undefined
        return [{ content, ...(status ? { status } : {}) }]
      })
      return getRuntime().planStep(stageId, todos)
    },
  }
}

export function writeLessonTool(getRuntime: () => StudentMemoryRuntime) {
  return {
    name: 'write_lesson',
    description: WRITE_LESSON_DESCRIPTION,
    parameters: {
      type: 'object',
      properties: {
        arcId: { type: 'string', description: 'Arc id from Open arcs.' },
        cause: { type: 'string', description: 'True cause. No line numbers.' },
        fixPattern: { type: 'string', description: 'How the later correction fixed it.' },
        contrast: { type: 'string', description: 'Wrong path vs correct path.' },
        doNotApplyWhen: { type: 'string', description: 'Where this lesson must not apply.' },
      },
      required: ['arcId', 'cause', 'fixPattern'],
    },
    output: {
      schema: { type: 'string' },
      render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
    },
    async execute(args: Record<string, unknown> | null | undefined) {
      const result = getRuntime().recordLesson(asDraft(args))
      if (!result.ok) throw new Error(result.text)
      return result.text
    },
  }
}

export function proposeAdrTool(getRuntime: () => StudentMemoryRuntime) {
  return {
    name: 'propose_adr',
    description: 'Propose the ADR for the current request or plan. Call this before any implementation.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'One-line decision or goal.' },
        context: { type: 'string', description: 'What was asked or planned, and why an ADR is needed now.' },
        decision: { type: 'string', description: 'Chosen approach. Omit if still deciding.' },
      },
      required: ['title', 'context'],
    },
    output: {
      schema: { type: 'string' },
      render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
    },
    async execute(args: Record<string, unknown> | null | undefined) {
      const rec = args && typeof args === 'object' ? args : {}
      return getRuntime().proposeAdr({
        title: String(rec.title ?? ''),
        context: String(rec.context ?? ''),
        decision: typeof rec.decision === 'string' ? rec.decision : undefined,
      })
    },
  }
}

export function updateIndexTool(getRuntime: () => StudentMemoryRuntime) {
  return {
    name: 'update_index',
    description: 'Replace INDEX.md for this workspace. Keep the ADR list, bug list, and current status accurate.',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Full markdown for INDEX.md.' },
      },
      required: ['content'],
    },
    output: {
      schema: { type: 'string' },
      render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
    },
    async execute(args: Record<string, unknown> | null | undefined) {
      const rec = args && typeof args === 'object' ? args : {}
      return getRuntime().updateIndex(String(rec.content ?? ''))
    },
  }
}

export function appendBuglogTool(getRuntime: () => StudentMemoryRuntime) {
  return {
    name: 'append_buglog',
    description: 'Append a defect or regression to this workspace buglog.md.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short defect title.' },
        detail: { type: 'string', description: 'Repro, cause, and current status.' },
        status: { type: 'string', description: 'open | investigating | fixed' },
      },
      required: ['title', 'detail'],
    },
    output: {
      schema: { type: 'string' },
      render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
    },
    async execute(args: Record<string, unknown> | null | undefined) {
      const rec = args && typeof args === 'object' ? args : {}
      return getRuntime().appendBuglog({
        title: String(rec.title ?? ''),
        detail: String(rec.detail ?? ''),
        status: typeof rec.status === 'string' ? rec.status : 'open',
      })
    },
  }
}

export function observationFromExec(
  exec?: { name?: string; toolName?: string; id?: string; toolCallId?: string; args?: unknown } | null,
  result?: { isError?: boolean; content?: unknown; error?: unknown } | null,
): ToolObservation {
  return {
    toolCallId: String(exec?.toolCallId ?? exec?.id ?? 'unknown'),
    toolName: String(exec?.toolName ?? exec?.name ?? 'unknown'),
    isError: result?.isError === true,
    argsText: typeof exec?.args === 'string' ? exec.args : JSON.stringify(exec?.args ?? ''),
    resultText: typeof result?.content === 'string'
      ? result.content
      : JSON.stringify(result?.content ?? result?.error ?? ''),
  }
}

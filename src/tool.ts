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

export function writeLessonTool(runtime: StudentMemoryRuntime) {
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
      const result = runtime.recordLesson(asDraft(args))
      if (!result.ok) throw new Error(result.text)
      return result.text
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

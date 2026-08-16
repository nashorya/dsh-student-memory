import type { LessonDraft } from './lesson.ts'
import type { StudentMemoryRuntime } from './runtime.ts'
import type { ToolObservation } from './arc.ts'

export const WRITE_LESSON_DESCRIPTION =
  'Record a lesson after a wrong-then-right correction. Use an arcId from Open arcs in the current runtime context. Fill only semantic fields.'

export function asDraft(args: Record<string, unknown>): LessonDraft {
  const str = (key: string) => typeof args[key] === 'string' ? args[key] as string : ''
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
      arcId: { type: 'string', required: true, description: 'Arc id issued by the plugin (from Open arcs).' },
      cause: { type: 'string', required: true, description: 'True cause. No line numbers.' },
      fixPattern: { type: 'string', required: true, description: 'How the later correction fixed it.' },
      contrast: { type: 'string', description: 'Wrong path vs correct path.' },
      doNotApplyWhen: { type: 'string', description: 'Where this lesson must not apply.' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
    },
    async execute(args: Record<string, unknown>) {
      const result = runtime.recordLesson(asDraft(args))
      if (!result.ok) throw new Error(result.text)
      return result.text
    },
  }
}

export function observationFromExec(
  exec: { name?: string; toolName?: string; id?: string; toolCallId?: string; args?: unknown },
  result: { isError?: boolean; content?: unknown; error?: unknown },
): ToolObservation {
  return {
    toolCallId: String(exec.toolCallId ?? exec.id ?? 'unknown'),
    toolName: String(exec.toolName ?? exec.name ?? 'unknown'),
    isError: result.isError === true,
    argsText: typeof exec.args === 'string' ? exec.args : JSON.stringify(exec.args ?? ''),
    resultText: typeof result.content === 'string'
      ? result.content
      : JSON.stringify(result.content ?? result.error ?? ''),
  }
}

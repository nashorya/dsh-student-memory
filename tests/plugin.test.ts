import { describe, expect, it } from 'vitest'
import { apply, L1_CONTEXT, L2_SECTION, writeLessonTool } from '../src/index.ts'
import { StudentMemoryRuntime } from '../src/runtime.ts'

function fakeCtx() {
  const sections: Array<{ name: string; order: number; text: () => string }> = []
  const contexts: Array<{ name: string; order: number; text: () => string }> = []
  const waterfalls: Array<(
    assembly: { sections: { name: string; text: string }[]; contexts: { name: string; text: string }[] },
    assembleContext: unknown,
    next: () => Promise<{ sections: { name: string; text: string }[]; contexts: { name: string; text: string }[] }>,
  ) => Promise<{ sections: { name: string; text: string }[]; contexts: { name: string; text: string }[] }>> = []

  return {
    sections,
    contexts,
    waterfalls,
    ctx: {
      tools: { register() { return () => {} } },
      systemPrompt: {
        section(section: { name: string; order: number; text: string | (() => string) }) {
          const text = typeof section.text === 'function' ? section.text : () => section.text as string
          sections.push({ name: section.name, order: section.order, text })
          return () => {}
        },
        context(context: { name: string; order: number; text: string | ((assemble: unknown) => string) }) {
          const text = typeof context.text === 'function'
            ? () => (context.text as () => string)()
            : () => context.text as string
          contexts.push({ name: context.name, order: context.order, text })
          return () => {}
        },
      },
      on(_event: string, listener: (...args: unknown[]) => unknown) {
        waterfalls.push(listener as (typeof waterfalls)[0])
        return () => {}
      },
    },
  }
}

describe('apply', () => {
  it('registers L2 section and L1 context providers that read the live store', () => {
    const { ctx, sections, contexts } = fakeCtx()
    const runtime = apply(ctx, { persist: 'memory' })
    runtime.pinned = { workingMemory: 'Goal: dogfood' }
    runtime.liveQuery = 'spike'
    expect(sections.map((s) => s.name)).toEqual([L2_SECTION])
    expect(contexts.map((c) => c.name)).toEqual([L1_CONTEXT])
    expect(sections[0]?.text()).toContain('Goal: dogfood')
    expect(contexts[0]?.text()).toContain('spike')
    expect(contexts[0]?.text()).toContain('STUDENT_MEMORY_WATERMARK')
  })

  it('truncates L1 in the context provider, not the assemble waterfall', () => {
    const { ctx, contexts } = fakeCtx()
    const runtime = apply(ctx, { persist: 'memory', l1BudgetChars: 8 })
    runtime.liveQuery = 'abcdefghijklmnop'
    const text = contexts[0]?.text() ?? ''
    expect(text).toContain('truncated')
    expect(text.startsWith('## Live')).toBe(true)
  })
})

describe('write_lesson schema', () => {
  it('exposes JSON-Schema properties so the host can Object.keys them', () => {
    const tool = writeLessonTool(new StudentMemoryRuntime())
    const properties = (tool.parameters as { properties?: Record<string, unknown> }).properties
    expect(Object.keys(properties ?? {})).toEqual(expect.arrayContaining(['arcId', 'cause', 'fixPattern']))
  })
})

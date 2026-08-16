import { describe, expect, it } from 'vitest'
import { apply, L1_CONTEXT, L2_SECTION } from '../src/index.ts'

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
    const runtime = apply(ctx)
    runtime.pinned = { workingMemory: 'Goal: dogfood' }
    runtime.liveQuery = 'spike'
    expect(sections.map((s) => s.name)).toEqual([L2_SECTION])
    expect(contexts.map((c) => c.name)).toEqual([L1_CONTEXT])
    expect(sections[0]?.text()).toContain('Goal: dogfood')
    expect(contexts[0]?.text()).toContain('spike')
    expect(contexts[0]?.text()).toContain('STUDENT_MEMORY_WATERMARK')
  })

  it('waterfall trims only L1', async () => {
    const { ctx, waterfalls } = fakeCtx()
    apply(ctx, { l1BudgetChars: 8 })
    const out = await waterfalls[0]!({
      sections: [{ name: L2_SECTION, text: 'keep-me' }],
      contexts: [{ name: L1_CONTEXT, text: 'abcdefghijklmnop' }],
    }, {}, async () => ({
      sections: [{ name: L2_SECTION, text: 'keep-me' }],
      contexts: [{ name: L1_CONTEXT, text: 'abcdefghijklmnop' }],
    }))
    expect(out.sections[0]?.text).toBe('keep-me')
    expect(out.contexts[0]?.text.startsWith('abcdefgh')).toBe(true)
    expect(out.contexts[0]?.text).toContain('truncated')
  })
})

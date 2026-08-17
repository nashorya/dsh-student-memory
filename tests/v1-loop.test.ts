import { describe, expect, it } from 'vitest'
import { apply } from '../src/index.ts'
import { createLesson } from '../src/lesson.ts'
import { MemoryPersist } from '../src/persist.ts'
import { StudentMemoryRuntime, HARVEST_PROMPT } from '../src/runtime.ts'

function fakeCtx() {
  const sections: Array<{ name: string; text: () => string }> = []
  const contexts: Array<{ name: string; text: () => string }> = []
  const events: string[] = []
  const listeners = new Map<string, (...args: unknown[]) => unknown>()
  return {
    sections,
    contexts,
    events,
    listeners,
    ctx: {
      tools: { register() { return () => {} } },
      systemPrompt: {
        section(section: { name: string; text: string | (() => string) }) {
          sections.push({ name: section.name, text: typeof section.text === 'function' ? section.text : () => section.text as string })
          return () => {}
        },
        context(context: { name: string; text: string | ((assemble: unknown) => string) }) {
          contexts.push({ name: context.name, text: typeof context.text === 'function' ? () => (context.text as () => string)() : () => context.text as string })
          return () => {}
        },
      },
      on(event: string, listener: (...args: unknown[]) => unknown) {
        events.push(event)
        listeners.set(event, listener)
        return () => {}
      },
    },
  }
}

describe('v1 acceptance traces', () => {
  it('该用：同类报错摊卡，引用 used_recall 记到 receipt', async () => {
    const row = createLesson({
      arcId: 'arc_old',
      cause: 'Stale patch anchors fail. Extra.',
      fixPattern: 'Read the file immediately before patching',
      contrast: '',
      doNotApplyWhen: 'Fresh buffer',
    }, 'tests-green')
    const runtime = new StudentMemoryRuntime(new MemoryPersist({
      lessons: [row], adrs: [], stages: [], todos: [],
    }))
    await runtime.boot()
    runtime.observeTool({
      toolCallId: 'e1', toolName: 'bash', isError: true, resultText: 'stale patch anchor rejected',
    })
    expect(runtime.l1Text()).toContain('### lessons')
    expect(runtime.l1Text()).toContain(row.id)
    runtime.noteModelText(`fixed via [[used_recall:${row.id}]]`)
    expect(runtime.receipt()).toContain('用上了')
    expect(runtime.receipt()).toContain(row.id)
  })

  it('不该用：不相关卡片可出现，不引用则不强制', async () => {
    const row = createLesson({
      arcId: 'arc_old',
      cause: 'Network timeout on npm registry',
      fixPattern: 'Retry the request',
      contrast: '',
      doNotApplyWhen: '',
    }, 'isolated')
    const runtime = new StudentMemoryRuntime(new MemoryPersist({
      lessons: [row], adrs: [], stages: [], todos: [],
    }))
    await runtime.boot()
    runtime.observeTool({ toolCallId: 'e1', toolName: 'bash', isError: true, resultText: 'edit failed' })
    expect(runtime.l1Text()).toContain(row.id)
    expect(runtime.receipt()).toContain('没有记到用上')
  })

  it('空库：无 lessons 块，turn 结束不催收', async () => {
    const runtime = new StudentMemoryRuntime(new MemoryPersist())
    await runtime.boot()
    expect(runtime.l1Text()).not.toContain('### lessons')
    expect(runtime.l1Text()).not.toContain(HARVEST_PROMPT)
  })
})

describe('v1 regressions', () => {
  it('L0 bytes stay identical with or without open arcs', () => {
    const a = new StudentMemoryRuntime()
    const before = a.l0Text()
    a.observeTool({ toolCallId: 'e', toolName: 'bash', isError: true, resultText: 'boom' })
    expect(a.l0Text()).toBe(before)
  })

  it('registers a single context and never listens to turn-stopping', () => {
    const { ctx, contexts, events } = fakeCtx()
    apply(ctx, { persist: 'memory' })
    expect(contexts.map((item) => item.name)).toEqual(['student-memory:l1'])
    expect(events).not.toContain('agent/turn-stopping')
    expect(events).toContain('session/event')
  })

  it('session/event assistant text lands used_recall in the receipt', () => {
    const { ctx, listeners } = fakeCtx()
    const runtime = apply(ctx, { persist: 'memory' })
    listeners.get('session/event')!(null, {
      type: 'assistant/message',
      data: { message: { content: [{ type: 'text', text: 'fixed via [[used_recall:L-abc]]' }] } },
    })
    expect(runtime.receipt()).toContain('L-abc')
  })

  it('reminds once on first green and not again', () => {
    const runtime = new StudentMemoryRuntime()
    runtime.observeTool({ toolCallId: 'e', toolName: 'bash', isError: true, argsText: 'vitest', resultText: 'fail' })
    const first = runtime.observeTool({
      toolCallId: 'v', toolName: 'bash', isError: false, argsText: 'vitest', resultText: 'Tests 3 passed',
    })
    const second = runtime.observeTool({
      toolCallId: 'v2', toolName: 'bash', isError: false, argsText: 'vitest', resultText: 'Tests 3 passed',
    })
    expect(first.reminder).toBeTruthy()
    expect(second.reminder).toBeUndefined()
    expect(runtime.l1Text({ consumeHarvest: true })).toContain(HARVEST_PROMPT)
    expect(runtime.l1Text({ consumeHarvest: true })).not.toContain(HARVEST_PROMPT)
  })

  it('plan_step writes the stage list and deriveL1 follows doing todo', () => {
    const runtime = new StudentMemoryRuntime()
    runtime.setAdrs([{ id: 'ADR-001', title: 'Single channel', status: 'accepted' }])
    runtime.setStages([{ id: 's1', adrId: 'ADR-001', title: 'M2', status: 'pending' }])
    runtime.planStep('s1', [
      { content: 'Spread cards', status: 'doing' },
      { content: 'Write receipt', status: 'pending' },
    ])
    expect(runtime.l1Text()).toContain('Current step: Spread cards')
    expect(runtime.l1Text()).toContain('Phase: M2')
    expect(runtime.l1Text()).toContain('Goal: Single channel')
  })
})

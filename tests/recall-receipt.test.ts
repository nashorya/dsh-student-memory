import { describe, expect, it } from 'vitest'
import { createLesson, renderLesson } from '../src/lesson.ts'
import { lessonCards } from '../src/recall.ts'
import { renderReceipt, renderSidebar } from '../src/receipt.ts'
import { StudentMemoryRuntime } from '../src/runtime.ts'
import { MemoryPersist } from '../src/persist.ts'

function lesson(cause: string, fix: string, trust: 'tests-green' | 'isolated' = 'isolated', at = '2026-08-16T00:00:00.000Z') {
  return {
    ...createLesson({
      arcId: 'arc_1',
      cause,
      fixPattern: fix,
      contrast: '',
      doNotApplyWhen: 'Not this file',
    }, trust, new Date(at)),
    createdAt: at,
  }
}

describe('lessonCards', () => {
  it('spreads the full library, session-new first', () => {
    const older = lesson('Hashline rejects stale anchors', 'Re-read before retrying the edit', 'isolated', '2026-08-01T00:00:00.000Z')
    const newer = lesson('Unrelated network timeout', 'Retry the request', 'tests-green', '2026-08-16T00:00:00.000Z')
    const cards = lessonCards([older, newer], [older.id])
    expect(cards).toHaveLength(2)
    expect(cards[0]?.id).toBe(older.id)
    expect(cards[0]?.summary).toContain('Hashline')
    expect(cards[0]?.summary).toContain('trust: isolated')
    expect(cards[0]?.summary).toContain('Do not apply when')
    expect(renderLesson(older)).not.toBe('')
  })

  it('does not inject a lesson whose render is empty', () => {
    const blank = { ...lesson('x', 'y'), cause: '', fixPattern: '' }
    expect(lessonCards([blank])).toEqual([])
  })
})

describe('receipt + sidebar', () => {
  it('tells the truth about isolation vs tests-green and used cards', () => {
    const text = renderReceipt([
      lesson('a', 'b', 'tests-green'),
      lesson('c', 'd', 'isolated'),
    ], ['lesson_used'])
    expect(text).toContain('有测试转绿背书')
    expect(text).toContain('还在隔离区')
    expect(text).toContain('用上了')
    expect(text).toContain('lesson_used')
  })

  it('empty session does not invent a used lesson', () => {
    expect(renderReceipt([])).toContain('这次没有记下新的 lesson')
    expect(renderSidebar({ injected: [], learned: [] })).toContain('本拍没有摊开')
  })
})

describe('runtime cards into L1 on open arc', () => {
  it('spreads cards after a tool error and records used_recall', async () => {
    const row = lesson('Stale patch anchors fail', 'Read the file immediately before patching', 'tests-green')
    const persist = new MemoryPersist({
      lessons: [row],
      adrs: [],
      stages: [],
      todos: [],
    })
    const runtime = new StudentMemoryRuntime(persist)
    await runtime.boot()
    expect(runtime.l1Text()).not.toContain('### lessons')
    runtime.observeTool({ toolCallId: 'e', toolName: 'bash', isError: true, resultText: 'stale anchor' })
    expect(runtime.l1Text()).toContain('### lessons')
    expect(runtime.l1Text()).toContain(row.id)
    runtime.noteModelText(`I used [[used_recall:${row.id}]]`)
    expect(runtime.receipt()).toContain(row.id)
    expect(runtime.receipt()).toContain('用上了')
  })
})

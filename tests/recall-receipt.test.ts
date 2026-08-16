import { describe, expect, it } from 'vitest'
import { createLesson, renderLesson } from '../src/lesson.ts'
import { recallLessons } from '../src/recall.ts'
import { renderReceipt, renderSidebar } from '../src/receipt.ts'
import { StudentMemoryRuntime } from '../src/runtime.ts'
import { MemoryPersist } from '../src/persist.ts'

function lesson(cause: string, fix: string, trust: 'tests-green' | 'isolated' = 'isolated') {
  return createLesson({
    arcId: 'arc_1',
    cause,
    fixPattern: fix,
    contrast: '',
    doNotApplyWhen: '',
  }, trust)
}

describe('recall', () => {
  it('returns matching non-empty lessons with a watermark token', () => {
    const rows = [
      lesson('Hashline rejects stale anchors', 'Re-read before retrying the edit'),
      lesson('Unrelated network timeout', 'Retry the request'),
    ]
    const hit = recallLessons(rows, 'stale hashline edit')
    expect(hit).toHaveLength(1)
    expect(hit[0]?.summary).toContain('Hashline')
    expect(hit[0]?.summary).toContain('⟦sm:')
    expect(renderLesson(rows[0]!)).not.toBe('')
  })

  it('does not inject a lesson whose render is empty', () => {
    const blank = { ...lesson('x', 'y'), cause: '', fixPattern: '' }
    expect(recallLessons([blank], 'x y')).toEqual([])
  })
})

describe('receipt + sidebar', () => {
  it('tells the truth about isolation vs tests-green', () => {
    const text = renderReceipt([
      lesson('a', 'b', 'tests-green'),
      lesson('c', 'd', 'isolated'),
    ])
    expect(text).toContain('有测试转绿背书')
    expect(text).toContain('还在隔离区')
  })

  it('empty session is an honest notebook, not a dead QA machine', () => {
    expect(renderReceipt([])).toContain('能用的笔记本')
    expect(renderSidebar({ injected: [], learned: [] })).toContain('本轮没有注入')
  })
})

describe('runtime recall into L1', () => {
  it('puts recalled watermarked text into the L1 body', async () => {
    const persist = new MemoryPersist({
      lessons: [lesson('Stale patch anchors fail', 'Read the file immediately before patching', 'tests-green')],
      adrs: [],
      todos: [],
    })
    const runtime = new StudentMemoryRuntime(persist, { watermark: false })
    await runtime.boot()
    runtime.refreshRecall('stale patch anchors')
    const l1 = runtime.l1Text()
    expect(l1).toContain('## Recall')
    expect(l1).toContain('⟦sm:')
    expect(runtime.sidebar()).toContain('本轮注入')
  })
})

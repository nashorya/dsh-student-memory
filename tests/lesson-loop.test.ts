import { describe, expect, it } from 'vitest'
import { applyObservation, nextArcId } from '../src/arc.ts'
import { writeLesson } from '../src/write-lesson.ts'
import { verdictOf } from '../src/verdict.ts'
import { renderLesson } from '../src/lesson.ts'
import { MemoryPersist } from '../src/persist.ts'
import { StudentMemoryRuntime } from '../src/runtime.ts'

describe('arc + verdict + write_lesson', () => {
  it('issues an arc on tool error and refuses write without that arcId', () => {
    let n = 1
    const arcs = applyObservation([], {
      toolCallId: 'e1',
      toolName: 'bash',
      isError: true,
      argsText: 'vitest',
    }, () => nextArcId(n++))
    expect(arcs[0]?.arcId).toBe('arc_1')
    const refused = writeLesson({
      arcId: 'arc_nope',
      cause: 'x',
      fixPattern: 'y',
      contrast: '',
      doNotApplyWhen: '',
    }, arcs)
    expect(refused.ok).toBe(false)
  })

  it('promotes on tests-green and isolates when there is no verify signal', () => {
    let n = 1
    const afterError = applyObservation([], {
      toolCallId: 'e1', toolName: 'bash', isError: true, argsText: 'pnpm test',
    }, () => nextArcId(n++))
    const afterGreen = applyObservation(afterError, {
      toolCallId: 'v1', toolName: 'bash', isError: false, argsText: 'pnpm test', resultText: 'Tests 3 passed',
    }, () => nextArcId(n++))
    expect(verdictOf(afterGreen[0]!.signals)).toBe('tests-green')
    expect(verdictOf(afterError[0]!.signals)).toBe('isolated')

    const written = writeLesson({
      arcId: afterGreen[0]!.arcId,
      cause: 'Patch applied to the stale buffer',
      fixPattern: 'Re-read the file then patch',
      contrast: 'Guessed oldText vs fresh read',
      doNotApplyWhen: 'The file was not just edited',
    }, afterGreen)
    expect(written.ok).toBe(true)
    if (written.ok) {
      expect(written.lesson.status).toBe('promoted')
      expect(written.lesson.trust).toBe('tests-green')
      expect(renderLesson(written.lesson)).toContain('Cause:')
    }
  })

  it('rejects empty cause/fix so no template-born lesson is stored', () => {
    const arcs = applyObservation([], {
      toolCallId: 'e1', toolName: 'bash', isError: true,
    }, () => 'arc_1')
    const empty = writeLesson({
      arcId: 'arc_1', cause: '  ', fixPattern: '', contrast: 'x', doNotApplyWhen: '',
    }, arcs)
    expect(empty.ok).toBe(false)
  })
})

describe('StudentMemoryRuntime', () => {
  it('persists a promoted lesson and rebuilds from disk-like persist', async () => {
    const persist = new MemoryPersist()
    const a = new StudentMemoryRuntime(persist)
    await a.boot()
    a.observeTool({ toolCallId: 'e', toolName: 'bash', isError: true, argsText: 'vitest' })
    a.observeTool({ toolCallId: 'v', toolName: 'bash', isError: false, argsText: 'vitest run' })
    const arcId = a.openArcs()[0]!.arcId
    const recorded = a.recordLesson({
      arcId,
      cause: 'Stale import',
      fixPattern: 'Point the import at the new module',
      contrast: '',
      doNotApplyWhen: '',
    })
    expect(recorded.ok).toBe(true)
    expect(a.receipt()).toContain('有测试转绿背书')

    const b = new StudentMemoryRuntime(persist)
    await b.boot()
    expect(b.allLessons()).toHaveLength(1)
    expect(b.allLessons()[0]?.cause).toBe('Stale import')
  })
})

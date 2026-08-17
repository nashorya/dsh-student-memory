import { describe, expect, it } from 'vitest'
import { assembleLayers, deriveL1 } from '../src/assemble.ts'
import { renderL0 } from '../src/l0.ts'
import { CACHE_PREFIX_BREAKPOINT } from '../src/types.ts'

describe('assembleLayers', () => {
  it('emits only l0+l1 and keeps L0 static', () => {
    const empty = assembleLayers({})
    const withArcs = assembleLayers({ openArcs: ['arc_1'], harvest: 'write now' })
    expect(empty.l0).toBe(renderL0())
    expect(withArcs.l0).toBe(empty.l0)
    expect(empty.l0).toContain(CACHE_PREFIX_BREAKPOINT)
    expect(empty.l0).not.toContain('openArcs')
    expect(empty.l0).not.toContain('STUDENT_MEMORY_WATERMARK')
    expect(Object.keys(empty)).toEqual(['l0', 'l1'])
    expect(withArcs.l1).toContain('### openArcs')
  })
})

describe('deriveL1', () => {
  it('uses doing stage as Phase and doing todo as Current step', () => {
    expect(deriveL1({
      adrs: [{ id: 'ADR-001', title: 'Align layers', status: 'accepted' }],
      stages: [{ id: 's1', adrId: 'ADR-001', title: 'Split recall', status: 'doing' }],
      todos: [{ id: 't1', adrId: 'ADR-001', stageId: 's1', content: 'Write cards', status: 'doing' }],
    })).toMatchObject({
      goal: 'Align layers',
      phase: 'Split recall',
      currentStep: 'Write cards',
    })
  })
})

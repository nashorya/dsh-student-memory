import { describe, expect, it } from 'vitest'
import { firstSentence, renderL1 } from '../src/l1.ts'

describe('renderL1', () => {
  it('returns empty string when nothing is assembled', () => {
    expect(renderL1({})).toBe('')
  })

  it('renders the five blocks in order without a lessons dump into taskSpec', () => {
    const text = renderL1({
      goal: 'Align layers',
      phase: 'M2',
      currentStep: 'Split recall',
      hardConstraints: 'No fork',
      l2Summary: 'workingMemory:\n- [doing] Split recall',
      openArcs: ['arc_1'],
      harvest: 'write now',
      lessons: [{ id: 'lesson_1', summary: 'Re-read first / trust: isolated' }],
    })
    expect(text.indexOf('### taskSpec')).toBeLessThan(text.indexOf('### hardConstraints'))
    expect(text.indexOf('### hardConstraints')).toBeLessThan(text.indexOf('### l2Summary'))
    expect(text.indexOf('### l2Summary')).toBeLessThan(text.indexOf('### openArcs'))
    expect(text.indexOf('### openArcs')).toBeLessThan(text.indexOf('### lessons'))
    expect(text).toContain('Goal: Align layers')
    expect(text).toContain('Phase: M2')
    expect(text).toContain('[[used_recall:<id>]]')
    expect(text).toContain('[lesson_1]')
  })

  it('takes the first sentence of a cause', () => {
    expect(firstSentence('锚点过期。后面还有一堆。')).toBe('锚点过期。')
  })
})

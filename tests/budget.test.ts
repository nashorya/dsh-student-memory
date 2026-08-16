import { describe, expect, it } from 'vitest'
import { applyL1Budget } from '../src/budget.ts'
import type { AssembledPrompt } from '../src/types.ts'

function assembly(l1: string): AssembledPrompt {
  return {
    sections: [{ name: 'student-memory:l2', text: 'pinned' }],
    contexts: [
      { name: 'approval:policy', text: 'ask' },
      { name: 'student-memory:l1', text: l1 },
    ],
  }
}

describe('applyL1Budget', () => {
  it('leaves other contexts and L2 sections untouched', () => {
    const out = applyL1Budget(assembly('short'), 10)
    expect(out.sections).toEqual([{ name: 'student-memory:l2', text: 'pinned' }])
    expect(out.contexts.find((c) => c.name === 'approval:policy')?.text).toBe('ask')
  })

  it('truncates only the L1 context and appends a note', () => {
    const long = 'x'.repeat(40)
    const out = applyL1Budget(assembly(long), 10)
    const l1 = out.contexts.find((c) => c.name === 'student-memory:l1')
    expect(l1?.text.startsWith('xxxxxxxxxx')).toBe(true)
    expect(l1?.text).toContain('truncated')
    expect(l1?.text.length).toBeGreaterThan(10)
  })

  it('treats a missing assembly as empty', () => {
    expect(applyL1Budget(undefined, 10)).toEqual({ sections: [], contexts: [] })
  })

  it('does nothing when L1 is absent or already under budget', () => {
    expect(applyL1Budget(assembly('ok'), 100).contexts[1]?.text).toBe('ok')
    const noL1 = { sections: [], contexts: [{ name: 'approval:policy', text: 'ask' }] }
    expect(applyL1Budget(noL1, 10)).toEqual(noL1)
  })
})

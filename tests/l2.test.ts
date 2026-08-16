import { describe, expect, it } from 'vitest'
import { renderL2 } from '../src/l2.ts'
import type { L2Pinned } from '../src/types.ts'

describe('renderL2', () => {
  it('returns empty string when nothing is pinned', () => {
    expect(renderL2({})).toBe('')
  })

  it('renders working memory and ledger as an independent section body', () => {
    const pinned: L2Pinned = {
      workingMemory: 'Goal: ship the plugin.\nStep: write L2 renderer.',
      taskLedger: '- confirmed: dsh context() is the L1 seam',
    }
    const text = renderL2(pinned)
    expect(text).toContain('## Working memory')
    expect(text).toContain('Goal: ship the plugin.')
    expect(text).toContain('## Task ledger')
    expect(text).toContain('confirmed: dsh context() is the L1 seam')
    expect(text).not.toContain('STUDENT_MEMORY_WATERMARK')
  })

  it('renders ADR and its todos', () => {
    const text = renderL2({}, {
      adrs: [{ id: 'ADR-001', title: 'Pin L1 to user-role snapshot', status: 'accepted' }],
      todos: [
        { id: 't1', adrId: 'ADR-001', content: 'Register context()', status: 'done' },
        { id: 't2', adrId: 'ADR-001', content: 'Wire assemble waterfall', status: 'doing' },
      ],
    })
    expect(text).toContain('## ADR')
    expect(text).toContain('ADR-001 accepted Pin L1 to user-role snapshot')
    expect(text).toContain('## Todo')
    expect(text).toContain('[doing] ADR-001 Wire assemble waterfall')
  })
})

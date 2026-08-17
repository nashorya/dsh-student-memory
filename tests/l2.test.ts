import { describe, expect, it } from 'vitest'
import { renderL2Summary } from '../src/l2.ts'

describe('renderL2Summary', () => {
  it('returns empty string when nothing is pinned', () => {
    expect(renderL2Summary({})).toBe('')
  })

  it('renders current-stage todos and recent errors', () => {
    const text = renderL2Summary(
      { recentErrors: ['bash error'] },
      {
        stages: [{ id: 's1', adrId: 'ADR-001', title: 'Wire cards', status: 'doing' }],
        todos: [
          { id: 't1', adrId: 'ADR-001', stageId: 's1', content: 'Open arc', status: 'done' },
          { id: 't2', adrId: 'ADR-001', stageId: 's1', content: 'Spread cards', status: 'doing' },
        ],
      },
    )
    expect(text).toContain('stage Wire cards')
    expect(text).toContain('[doing] Spread cards')
    expect(text).not.toContain('Open arc')
    expect(text).toContain('recentErrors')
    expect(text).not.toContain('## ADR')
  })
})

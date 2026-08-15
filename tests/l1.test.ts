import { describe, expect, it } from 'vitest'
import { renderL1 } from '../src/l1.ts'

describe('renderL1', () => {
  it('returns empty string when live state and recall are empty and watermark is off', () => {
    expect(renderL1({ watermark: false })).toBe('')
  })

  it('rebuilds from the current live payload only (no previous-turn residue)', () => {
    const first = renderL1({
      live: { task: 'round-1', note: 'alpha' },
      watermark: 'STUDENT_MEMORY_WATERMARK',
    })
    const second = renderL1({
      live: { task: 'round-2', note: 'beta' },
      watermark: 'STUDENT_MEMORY_WATERMARK',
    })
    expect(first).toContain('round-1')
    expect(first).not.toContain('round-2')
    expect(second).toContain('round-2')
    expect(second).not.toContain('round-1')
    expect(second).toContain('STUDENT_MEMORY_WATERMARK')
  })

  it('renders recall lines without mixing them into the watermark', () => {
    const text = renderL1({
      recall: [{ id: 'lesson_1', summary: 'Re-read before retrying the edit.' }],
      watermark: false,
    })
    expect(text).toContain('lesson_1')
    expect(text).toContain('Re-read before retrying the edit.')
    expect(text).not.toContain('STUDENT_MEMORY_WATERMARK')
  })
})

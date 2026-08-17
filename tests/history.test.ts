import { describe, expect, it } from 'vitest'
import { dropPriorTurns, PRIOR_TURN_STUB } from '../src/history.ts'
import type { HistorySession } from '../src/history.ts'
import type { LogEvent } from '../src/surface-policy.ts'

function session(events: LogEvent[], nodes: number[]): HistorySession & { appended: Array<{ type: string; data: Record<string, unknown> }> } {
  const log: LogEvent[] = [...events]
  const appended: Array<{ type: string; data: Record<string, unknown> }> = []
  return {
    appended,
    get events() { return log },
    surface: { nodes },
    append(type, data) {
      const event = { type, seq: log.length + 10, data: { turn: data.turn as number | null | undefined } }
      log.push(event)
      appended.push({ type, data })
      return { seq: event.seq }
    },
  }
}

describe('dropPriorTurns', () => {
  it('replaces prior-turn surface with a stub checkpoint', () => {
    const s = session(
      [
        { type: 'turn/start', seq: 1, data: { turn: 1 } },
        { type: 'turn/end', seq: 4, data: { turn: 1 } },
        { type: 'turn/start', seq: 5, data: { turn: 2 } },
      ],
      [2, 3, 6],
    )
    expect(dropPriorTurns(s)).toBe(true)
    expect(s.appended.map((row) => row.type)).toEqual([
      'compaction/start',
      'compaction/summary',
      'user/message',
      'compaction/end',
    ])
    expect(s.appended[2]?.data.content).toEqual([{ type: 'text', text: PRIOR_TURN_STUB }])
    expect((s.appended[2]?.data.source as { plugin?: string }).plugin).toBe('compact')
    expect(s.appended[0]?.data.turn).toBe(2)
  })

  it('is a no-op on the first turn', () => {
    const s = session(
      [{ type: 'turn/start', seq: 1, data: { turn: 1 } }],
      [2],
    )
    expect(dropPriorTurns(s)).toBe(false)
    expect(s.appended).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import { openTurnOf, selectPriorTurnRange } from '../src/surface-policy.ts'

describe('selectPriorTurnRange', () => {
  it('returns null on the first turn', () => {
    expect(selectPriorTurnRange(
      [{ type: 'turn/start', seq: 1, data: { turn: 1 } }],
      [2, 3],
    )).toBeNull()
  })

  it('selects surface nodes before the current turn/start', () => {
    const range = selectPriorTurnRange(
      [
        { type: 'turn/start', seq: 1, data: { turn: 1 } },
        { type: 'turn/end', seq: 4, data: { turn: 1 } },
        { type: 'turn/start', seq: 5, data: { turn: 2 } },
      ],
      [2, 3, 6],
    )
    expect(range).toEqual({ start: 2, end: 3, shadowedSeqs: [2, 3] })
  })

  it('does not select between turns', () => {
    expect(selectPriorTurnRange(
      [
        { type: 'turn/start', seq: 1, data: { turn: 1 } },
        { type: 'turn/end', seq: 4, data: { turn: 1 } },
      ],
      [2, 3],
    )).toBeNull()
  })
})

describe('openTurnOf', () => {
  it('reads the latest open turn', () => {
    expect(openTurnOf([
      { type: 'turn/start', seq: 1, data: { turn: 1 } },
      { type: 'turn/end', seq: 2, data: { turn: 1 } },
      { type: 'turn/start', seq: 3, data: { turn: 2 } },
    ])).toBe(2)
    expect(openTurnOf([
      { type: 'turn/start', seq: 1, data: { turn: 1 } },
      { type: 'turn/end', seq: 2, data: { turn: 1 } },
    ])).toBeNull()
  })
})

export interface LogEvent {
  type: string
  seq: number
  data?: { turn?: number | null }
}

export interface PriorTurnRange {
  start: number
  end: number
  shadowedSeqs: number[]
}

/** Open turn number, or null when the log is between turns. */
export function openTurnOf(events: readonly LogEvent[]): number | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (!event) continue
    if (event.type === 'turn/start') {
      return typeof event.data?.turn === 'number' ? event.data.turn : null
    }
    if (event.type === 'turn/end') return null
  }
  return null
}

/**
 * Surface span belonging to earlier turns. Current-turn nodes (seq >= the
 * latest turn/start) stay. Null when there is nothing older to drop.
 */
export function selectPriorTurnRange(
  events: readonly LogEvent[],
  surfaceNodes: readonly number[],
): PriorTurnRange | null {
  if (surfaceNodes.length === 0) return null
  let turnStartSeq: number | undefined
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (!event) continue
    if (event.type === 'turn/start') {
      turnStartSeq = event.seq
      break
    }
    if (event.type === 'turn/end') return null
  }
  if (turnStartSeq === undefined) return null
  const keepFrom = surfaceNodes.findIndex((seq) => seq >= turnStartSeq)
  const shadowedSeqs = keepFrom === -1
    ? [...surfaceNodes]
    : surfaceNodes.slice(0, keepFrom)
  if (shadowedSeqs.length === 0) return null
  return {
    start: shadowedSeqs[0]!,
    end: shadowedSeqs[shadowedSeqs.length - 1]!,
    shadowedSeqs,
  }
}

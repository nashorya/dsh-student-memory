import { randomUUID } from 'node:crypto'
import { openTurnOf, selectPriorTurnRange } from './surface-policy.ts'
import type { LogEvent } from './surface-policy.ts'

export const PRIOR_TURN_STUB = '[student-memory: completed task archived to L2]'

export interface HistorySession {
  events: readonly LogEvent[]
  surface: { nodes: readonly number[] }
  append(
    type: string,
    data: Record<string, unknown>,
    opts?: { surfaceOp?: { op: 'replace'; start: number; end: number }; sourceEventSeqs?: number[] },
  ): { seq: number }
}

/**
 * Replace earlier-turn surface nodes with a stub checkpoint.
 * Current-turn user/tool messages stay. Returns false when there is nothing to drop.
 */
export function dropPriorTurns(session: HistorySession): boolean {
  const range = selectPriorTurnRange(session.events, session.surface.nodes)
  const turn = openTurnOf(session.events)
  if (!range || turn === null) return false
  const compactionId = `sm_${randomUUID()}`
  let started = false
  try {
    const startEvent = session.append('compaction/start', { compactionId, turn })
    started = true
    const summaryEvent = session.append('compaction/summary', {
      compactionId,
      summary: [{ type: 'text', text: PRIOR_TURN_STUB }],
      shadowedRange: { start: range.start, end: range.end },
      shadowedSeqs: [...range.shadowedSeqs],
      shadowedTokenCount: 0,
      provider: 'student-memory',
      model: 'none',
    })
    session.append('user/message', {
      id: randomUUID(),
      role: 'user',
      content: [{ type: 'text', text: PRIOR_TURN_STUB }],
      source: { kind: 'plugin', plugin: 'compact', compactionId },
    }, {
      surfaceOp: { op: 'replace', start: range.start, end: range.end },
      sourceEventSeqs: [startEvent.seq, summaryEvent.seq, ...range.shadowedSeqs],
    })
    session.append('compaction/end', { compactionId, turn })
    return true
  } catch (error) {
    if (started) {
      try {
        session.append('compaction/end', {
          compactionId,
          turn,
          error: error instanceof Error ? error.message : String(error),
        })
      } catch {
        // Lock stays busy if close fails — same as dsh compaction.
      }
    }
    return false
  }
}

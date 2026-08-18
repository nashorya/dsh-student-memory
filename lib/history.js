import { randomUUID } from "node:crypto";
import { openTurnOf, selectPriorTurnRange } from "./surface-policy.js";
const PRIOR_TURN_STUB = "[student-memory: prior turns dropped]";
function dropPriorTurns(session) {
  const range = selectPriorTurnRange(session.events, session.surface.nodes);
  const turn = openTurnOf(session.events);
  if (!range || turn === null) return false;
  const compactionId = `sm_${randomUUID()}`;
  let started = false;
  try {
    const startEvent = session.append("compaction/start", { compactionId, turn });
    started = true;
    const summaryEvent = session.append("compaction/summary", {
      compactionId,
      summary: [{ type: "text", text: PRIOR_TURN_STUB }],
      shadowedRange: { start: range.start, end: range.end },
      shadowedSeqs: [...range.shadowedSeqs],
      shadowedTokenCount: 0,
      provider: "student-memory",
      model: "none"
    });
    session.append("user/message", {
      id: randomUUID(),
      role: "user",
      content: [{ type: "text", text: PRIOR_TURN_STUB }],
      source: { kind: "plugin", plugin: "compact", compactionId }
    }, {
      surfaceOp: { op: "replace", start: range.start, end: range.end },
      sourceEventSeqs: [startEvent.seq, summaryEvent.seq, ...range.shadowedSeqs]
    });
    session.append("compaction/end", { compactionId, turn });
    return true;
  } catch (error) {
    if (started) {
      try {
        session.append("compaction/end", {
          compactionId,
          turn,
          error: error instanceof Error ? error.message : String(error)
        });
      } catch {
      }
    }
    return false;
  }
}
export {
  PRIOR_TURN_STUB,
  dropPriorTurns
};

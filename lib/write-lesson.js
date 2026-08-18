import { createLesson, renderLesson } from "./lesson.js";
import { verdictOf } from "./verdict.js";
function writeLesson(draft, arcs, now = /* @__PURE__ */ new Date()) {
  const arc = arcs.find((item) => item.arcId === draft.arcId && !item.consumed);
  if (!arc) {
    return { ok: false, error: `Unknown or already-used arc "${draft.arcId}"` };
  }
  if (!renderLesson(draft)) {
    return { ok: false, error: "cause and fixPattern are required; empty lessons are not stored" };
  }
  const lesson = createLesson(draft, verdictOf(arc.signals), now);
  return { ok: true, lesson };
}
export {
  writeLesson
};

import { createLesson, renderLesson } from './lesson.ts'
import type { Lesson, LessonDraft } from './lesson.ts'
import { verdictOf } from './verdict.ts'
import type { Arc } from './arc.ts'

export type WriteLessonResult =
  | { ok: true; lesson: Lesson }
  | { ok: false; error: string }

export function writeLesson(
  draft: LessonDraft,
  arcs: Arc[],
  now = new Date(),
): WriteLessonResult {
  const arc = arcs.find((item) => item.arcId === draft.arcId && !item.consumed)
  if (!arc) {
    return { ok: false, error: `Unknown or already-used arc "${draft.arcId}"` }
  }
  if (!renderLesson(draft)) {
    return { ok: false, error: 'cause and fixPattern are required; empty lessons are not stored' }
  }
  const lesson = createLesson(draft, verdictOf(arc.signals), now)
  return { ok: true, lesson }
}

import { renderLesson } from './lesson.ts'
import type { Lesson } from './lesson.ts'
import { firstSentence } from './l1.ts'
import type { RecalledLesson } from './types.ts'

export function cardSummary(lesson: Lesson): string {
  const cause = firstSentence(lesson.cause)
  const boundary = lesson.doNotApplyWhen.trim()
  const lines = [cause]
  if (boundary) lines.push(`Do not apply when: ${boundary}`)
  lines.push(`trust: ${lesson.trust}`)
  return lines.join(' / ')
}

/** Full library as short cards. Session-new first, then newest createdAt. */
export function lessonCards(
  lessons: readonly Lesson[],
  sessionIds: readonly string[] = [],
): RecalledLesson[] {
  const session = new Set(sessionIds)
  return [...lessons]
    .filter((lesson) => renderLesson(lesson).length > 0)
    .sort((a, b) => {
      const aSession = session.has(a.id) ? 0 : 1
      const bSession = session.has(b.id) ? 0 : 1
      if (aSession !== bSession) return aSession - bSession
      return b.createdAt.localeCompare(a.createdAt)
    })
    .map((lesson) => ({ id: lesson.id, summary: cardSummary(lesson) }))
}

/** @deprecated use lessonCards */
export function recallLessons(
  lessons: readonly Lesson[],
  _query = '',
  _limit = 10,
): RecalledLesson[] {
  return lessonCards(lessons)
}

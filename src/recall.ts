import { renderLesson } from './lesson.ts'
import type { Lesson } from './lesson.ts'
import type { RecalledLesson } from './types.ts'

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with'])

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter((part) => part.length >= 2 && !STOP.has(part))
}

export function scoreLesson(lesson: Lesson, query: string): number {
  const body = renderLesson(lesson)
  if (!body) return 0
  const q = new Set(tokens(query))
  if (q.size === 0) return 0
  const hay = new Set(tokens(`${body} ${lesson.id}`))
  let hit = 0
  for (const token of q) {
    if (hay.has(token)) hit += 1
  }
  return hit / q.size
}

export function recallLessons(
  lessons: readonly Lesson[],
  query: string,
  limit = 10,
): RecalledLesson[] {
  return lessons
    .map((lesson) => ({ lesson, score: scoreLesson(lesson, query) }))
    .filter((row) => row.score > 0 && renderLesson(row.lesson).length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ lesson, score }) => ({
      id: lesson.id,
      summary: `${renderLesson(lesson)}\n${lesson.watermark}`,
      reason: `和当前任务「${query.trim()}」有 ${Math.round(score * 100)}% 词重叠，所以塞进本轮 L1。`,
    }))
}

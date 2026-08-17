import { CACHE_PREFIX_BREAKPOINT } from './types.ts'

const WRITE_LESSON_CONTRACT = `### writeLessonContract
- Only write a lesson via write_lesson.
- Fill semantic fields only; use a listed open arcId.
- Do not invent an arcId.
- Empty cause or fixPattern is rejected.
- Do not use "then I called X" as a fixPattern.`.trim()

export function renderL0(): string {
  return `${WRITE_LESSON_CONTRACT}\n\n${CACHE_PREFIX_BREAKPOINT}`
}

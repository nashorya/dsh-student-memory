export type LessonTrust = 'tests-green' | 'tsc-ci' | 'isolated'
export type LessonStatus = 'promoted' | 'isolated'

export interface Lesson {
  id: string
  arcId: string
  cause: string
  fixPattern: string
  contrast: string
  doNotApplyWhen: string
  trust: LessonTrust
  status: LessonStatus
  watermark: string
  createdAt: string
}

export interface LessonDraft {
  arcId: string
  cause: string
  fixPattern: string
  contrast: string
  doNotApplyWhen: string
}

export function renderLesson(lesson: Pick<Lesson, 'cause' | 'fixPattern' | 'contrast' | 'doNotApplyWhen'>): string {
  const cause = lesson.cause.trim()
  const fix = lesson.fixPattern.trim()
  if (!cause || !fix) return ''
  const lines = [`Cause: ${cause}`, `Fix: ${fix}`]
  const contrast = lesson.contrast.trim()
  if (contrast) lines.push(`Contrast: ${contrast}`)
  const boundary = lesson.doNotApplyWhen.trim()
  if (boundary) lines.push(`Do not apply when: ${boundary}`)
  return lines.join('\n')
}

export function lessonWatermark(id: string): string {
  return `⟦sm:${id}⟧`
}

export function createLesson(draft: LessonDraft, trust: LessonTrust, now = new Date()): Lesson {
  const id = `lesson_${now.getTime().toString(36)}`
  return {
    id,
    arcId: draft.arcId,
    cause: draft.cause.trim(),
    fixPattern: draft.fixPattern.trim(),
    contrast: draft.contrast.trim(),
    doNotApplyWhen: draft.doNotApplyWhen.trim(),
    trust,
    status: trust === 'isolated' ? 'isolated' : 'promoted',
    watermark: lessonWatermark(id),
    createdAt: now.toISOString(),
  }
}

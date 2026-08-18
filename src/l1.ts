import type { L1Live, RecalledLesson } from './types.ts'

const LESSON_CITATION = `RECALL CITATION RULE:
- Recalled items have stable IDs.
- If a card materially informs an action, cite [[used_recall:<id>]].
- Do not cite an item merely because it was shown.`

export function firstSentence(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  const match = trimmed.match(/^.+?[。.!？?]/u)
  return (match?.[0] ?? trimmed.split('\n')[0] ?? trimmed).trim()
}

export function renderLessonCard(item: RecalledLesson): string {
  return `- [${item.id}] ${item.summary.trim()}`
}

export function renderL1(input: L1Live = {}): string {
  const spec: string[] = []
  if (input.goal?.trim()) spec.push(`Goal: ${input.goal.trim()}`)
  if (input.phase?.trim()) spec.push(`Phase: ${input.phase.trim()}`)
  if (input.currentStep?.trim()) spec.push(`Current step: ${input.currentStep.trim()}`)
  const parts: string[] = []
  if (input.adrRequired || !input.goal?.trim()) {
    parts.push('### adrRequired\n本请求还没有 ADR。先调用 propose_adr，再实施。')
  }
  if (spec.length > 0) parts.push(`### taskSpec\n${spec.join('\n')}`)

  const hard = input.hardConstraints?.trim()
  if (hard) parts.push(`### hardConstraints\nHARD CONSTRAINTS:\n${hard}`)

  const summary = input.l2Summary?.trim()
  if (summary) parts.push(`### l2Summary\n${summary}`)

  const arcs = (input.openArcs ?? []).filter((id) => id.trim().length > 0)
  if (arcs.length > 0 || input.harvest?.trim()) {
    const lines = [...arcs.map((id) => `- ${id}`)]
    if (input.harvest?.trim()) lines.push(input.harvest.trim())
    parts.push(`### openArcs\n${lines.join('\n')}`)
  }

  const lessons = (input.lessons ?? []).filter((item) => item.summary.trim().length > 0)
  if (lessons.length > 0) {
    parts.push(`### lessons\n${LESSON_CITATION}\n${lessons.map(renderLessonCard).join('\n')}`)
  }

  return parts.join('\n\n')
}

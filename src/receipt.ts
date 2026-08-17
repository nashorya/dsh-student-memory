import type { Lesson } from './lesson.ts'

const TRUST_LINE: Record<Lesson['trust'], string> = {
  'tests-green': '有测试转绿背书',
  'tsc-ci': '有 tsc/CI 通过背书',
  isolated: '还在隔离区',
}

export function usedRecallIds(text: string): string[] {
  return [...text.matchAll(/\[\[used_recall:([^\]]+)\]\]/g)].map((match) => match[1]!).filter(Boolean)
}

export function renderReceipt(lessons: readonly Lesson[], used: readonly string[] = []): string {
  const learned = lessons.length === 0
    ? '这次没有记下新的 lesson。'
    : `这次我学到了这 ${lessons.length} 条：\n${lessons.map((lesson) => `- ${lesson.id}: ${TRUST_LINE[lesson.trust]}`).join('\n')}`
  const usedLine = used.length === 0
    ? '没有记到用上哪条旧经验。'
    : `用上了：\n${used.map((id) => `- ${id}`).join('\n')}`
  return `${learned}\n${usedLine}`
}

export function renderSidebar(input: {
  injected: readonly string[]
  learned: readonly Lesson[]
  used?: readonly string[]
}): string {
  const injected = input.injected.length === 0
    ? '本拍没有摊开 lesson 卡片。'
    : `本拍卡片：\n${input.injected.map((id) => `- ${id}`).join('\n')}`
  return `${injected}\n\n${renderReceipt(input.learned, input.used ?? [])}`
}

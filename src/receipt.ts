import type { Lesson } from './lesson.ts'

const TRUST_LINE: Record<Lesson['trust'], string> = {
  'tests-green': '有测试转绿背书',
  'tsc-ci': '有 tsc/CI 通过背书',
  isolated: '还在隔离区',
}

export function renderReceipt(lessons: readonly Lesson[]): string {
  if (lessons.length === 0) {
    return '这次没有记下新的 lesson。没有验证信号时我是能用的笔记本，不是死掉的质检机。'
  }
  const lines = lessons.map((lesson) => `- ${lesson.id}: ${TRUST_LINE[lesson.trust]}`)
  return `这次我学到了这 ${lessons.length} 条：\n${lines.join('\n')}`
}

export function renderSidebar(input: {
  injected: readonly string[]
  learned: readonly Lesson[]
}): string {
  const injected = input.injected.length === 0
    ? '本轮没有注入 lesson。'
    : `本轮注入：\n${input.injected.map((id) => `- ${id}`).join('\n')}`
  return `${injected}\n\n${renderReceipt(input.learned)}`
}

import type { LessonTrust } from './lesson.ts'
import type { ArcSignal } from './arc.ts'

/**
 * Hard-coded three-level verdict. Not a provider abstraction.
 * tests 红转绿 > tsc/CI 通过 > 无信号隔离。
 */
export function verdictOf(signals: readonly ArcSignal[]): LessonTrust {
  if (signals.includes('tests-green')) return 'tests-green'
  if (signals.includes('tsc-ci')) return 'tsc-ci'
  return 'isolated'
}

import { L1_CONTEXT } from './types.ts'
import type { AssembledPrompt } from './types.ts'

/**
 * Truncate only `student-memory:l1` after assembly. Other contexts and L2 stay.
 */
export function applyL1Budget(
  assembly: AssembledPrompt,
  maxChars: number,
): AssembledPrompt {
  return {
    sections: assembly.sections,
    contexts: assembly.contexts.map((entry) => {
      if (entry.name !== L1_CONTEXT || entry.text.length <= maxChars) return entry
      const kept = entry.text.slice(0, maxChars)
      return {
        name: entry.name,
        text: `${kept}\n\n[student-memory: L1 truncated to ${maxChars} chars]`,
      }
    }),
  }
}

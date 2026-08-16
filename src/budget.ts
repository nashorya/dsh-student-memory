import { L1_CONTEXT } from './types.ts'
import type { AssembledPrompt } from './types.ts'

export function truncateL1(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}\n\n[student-memory: L1 truncated to ${maxChars} chars]`
}

/**
 * Truncate only `student-memory:l1`. Extra assembly fields (tools, variables)
 * must be copied through — the host interpolates {{cwd}}/{{model}} from them.
 */
export function applyL1Budget<T extends AssembledPrompt>(
  assembly: T | null | undefined,
  maxChars: number,
): T | { sections: []; contexts: [] } {
  if (!assembly) return { sections: [], contexts: [] }
  const contexts = assembly.contexts ?? []
  return {
    ...assembly,
    contexts: contexts.map((entry) => {
      if (entry.name !== L1_CONTEXT) return entry
      return { ...entry, text: truncateL1(entry.text, maxChars) }
    }),
  }
}

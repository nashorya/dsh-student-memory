import { applyL1Budget } from './budget.ts'
import { renderL1 } from './l1.ts'
import { renderL2 } from './l2.ts'
import { MemoryStore } from './store.ts'
import {
  DEFAULT_L1_BUDGET,
  DEFAULT_WATERMARK,
  L1_CONTEXT,
  L1_ORDER,
  L2_ORDER,
  L2_SECTION,
} from './types.ts'
import type { StudentMemoryConfig } from './types.ts'

export { applyL1Budget } from './budget.ts'
export { renderL1 } from './l1.ts'
export { renderL2 } from './l2.ts'
export { MemoryStore } from './store.ts'
export {
  DEFAULT_L1_BUDGET,
  DEFAULT_WATERMARK,
  L1_CONTEXT,
  L1_ORDER,
  L2_ORDER,
  L2_SECTION,
} from './types.ts'
export type { AssembledPrompt, L1Live, L2Pinned, StudentMemoryConfig } from './types.ts'

export const name = 'student-memory'
export const inject = ['systemPrompt']

/** Minimal ctx surface we touch. Avoids a hard dep on unpublished dsh types. */
export interface StudentMemoryContext {
  systemPrompt: {
    section(section: {
      name: string
      order: number
      text: string | (() => string)
    }): () => void
    context(context: {
      name: string
      order: number
      text: string | ((assemble: unknown) => string)
    }): () => void
  }
  on(
    event: 'system-prompt/assemble',
    listener: (
      assembly: { sections: { name: string; text: string }[]; contexts: { name: string; text: string }[] },
      assembleContext: unknown,
      next: () => Promise<{ sections: { name: string; text: string }[]; contexts: { name: string; text: string }[] }>,
    ) => Promise<{ sections: { name: string; text: string }[]; contexts: { name: string; text: string }[] }>,
  ): () => void
}

export function apply(ctx: StudentMemoryContext, config: StudentMemoryConfig = {}): MemoryStore {
  const store = new MemoryStore()
  const budget = config.l1BudgetChars ?? DEFAULT_L1_BUDGET
  const watermark = config.watermark === undefined ? DEFAULT_WATERMARK : config.watermark

  ctx.systemPrompt.section({
    name: L2_SECTION,
    order: L2_ORDER,
    text: () => renderL2(store.pinned),
  })

  ctx.systemPrompt.context({
    name: L1_CONTEXT,
    order: L1_ORDER,
    text: () => renderL1({
      live: store.live,
      recall: store.recall,
      watermark,
    }),
  })

  ctx.on('system-prompt/assemble', async (assembly, _assembleContext, next) => {
    const resolved = await next()
    return applyL1Budget(resolved, budget)
  })

  return store
}

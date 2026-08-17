import { renderL0 } from './l0.ts'
import { renderL1 } from './l1.ts'
import { renderL2Summary } from './l2.ts'
import type { Adr, L1Live, L2Pinned, RecalledLesson, Stage, TodoItem } from './types.ts'

export interface AssembleInput {
  adrs?: Adr[]
  stages?: Stage[]
  todos?: TodoItem[]
  pinned?: L2Pinned
  liveQuery?: string
  recall?: RecalledLesson[]
  harvest?: string
  openArcs?: string[]
  recentErrors?: string[]
}

export interface AssembledLayers {
  l0: string
  l1: string
}

export function deriveL1(input: AssembleInput): L1Live {
  const adrs = input.adrs ?? []
  const stages = input.stages ?? []
  const todos = input.todos ?? []
  const adr = adrs.find((item) => item.status === 'accepted') ?? adrs[0]
  const doing = todos.find((todo) => todo.status === 'doing')
  const stage = doing
    ? stages.find((item) => item.id === doing.stageId)
    : stages.find((item) => item.status === 'doing')
  const query = input.liveQuery?.trim()
  return {
    goal: adr?.title.trim() || (!doing ? query : undefined),
    phase: stage?.title.trim(),
    currentStep: doing?.content.trim() || (adr && query ? query : undefined),
    hardConstraints: input.pinned?.hardConstraints,
    l2Summary: renderL2Summary({
      ...input.pinned,
      recentErrors: input.recentErrors ?? input.pinned?.recentErrors,
    }, { stages, todos }),
    openArcs: input.openArcs,
    harvest: input.harvest,
    lessons: input.recall,
  }
}

export function assembleLayers(input: AssembleInput): AssembledLayers {
  return {
    l0: renderL0(),
    l1: renderL1(deriveL1(input)),
  }
}

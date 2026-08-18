export interface Adr {
  id: string
  title: string
  status: 'proposed' | 'accepted' | 'superseded'
}

export interface Stage {
  id: string
  adrId: string
  title: string
  status: 'pending' | 'doing' | 'done'
}

export interface TodoItem {
  id: string
  adrId: string
  stageId: string
  content: string
  status: 'pending' | 'doing' | 'done'
}

export interface L2Pinned {
  workingMemory?: string
  taskLedger?: string
  hardConstraints?: string
  recentErrors?: string[]
  recentSignals?: string[]
}

export interface RecalledLesson {
  id: string
  summary: string
}

export interface L1Live {
  goal?: string
  phase?: string
  currentStep?: string
  hardConstraints?: string
  l2Summary?: string
  openArcs?: string[]
  harvest?: string
  lessons?: RecalledLesson[]
  /** True when this user turn still needs propose_adr before implementation. */
  adrRequired?: boolean
}

export interface AssembledSection {
  name: string
  text: string
}

export interface AssembledPrompt {
  sections: AssembledSection[]
  contexts: AssembledSection[]
}

export interface StudentMemoryConfig {
  l1BudgetChars?: number
  persist?: 'memory' | 'file'
  storePath?: string
  dashboardPath?: string
  workspaceDir?: string
}

export const L0_SECTION = 'student-memory:l0'
export const L1_CONTEXT = 'student-memory:l1'
export const L0_ORDER = 50
export const L1_ORDER = 200
export const L1_SAFETY_CHARS = 12000
export const DEFAULT_L1_BUDGET = L1_SAFETY_CHARS

export const CACHE_PREFIX_BREAKPOINT =
  '### cache_prefix_breakpoint\n# Static prefix ends; dynamic task context follows.'

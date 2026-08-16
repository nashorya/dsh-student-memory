export interface L2Pinned {
  workingMemory?: string
  taskLedger?: string
}

export interface RecalledLesson {
  id: string
  summary: string
}

export interface L1Live {
  live?: Record<string, string>
  recall?: RecalledLesson[]
  openArcs?: string[]
  harvest?: string
  watermark?: string | false
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
  watermark?: string | false
  persist?: 'memory' | 'file'
  /** JSON file used when persist=file. Rebuilt on boot. */
  storePath?: string
  /** Static HTML board. Defaults next to storePath. */
  dashboardPath?: string
}

export const L2_SECTION = 'student-memory:l2'
export const L1_CONTEXT = 'student-memory:l1'
export const L2_ORDER = 50
export const L1_ORDER = 200
export const DEFAULT_L1_BUDGET = 2000
export const DEFAULT_WATERMARK = 'STUDENT_MEMORY_WATERMARK'

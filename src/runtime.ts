import { applyObservation, nextArcId, openArcs } from './arc.ts'
import type { Arc, ToolObservation } from './arc.ts'
import type { Lesson, LessonDraft } from './lesson.ts'
import { MemoryPersist } from './persist.ts'
import type { LessonPersist } from './persist.ts'
import { recallLessons } from './recall.ts'
import { writeDashboard } from './dashboard.ts'
import type { DashboardSnapshot } from './dashboard.ts'
import { renderReceipt, renderSidebar } from './receipt.ts'
import { writeLesson } from './write-lesson.ts'
import { renderL1 } from './l1.ts'
import { renderL2 } from './l2.ts'
import type { L2Pinned, RecalledLesson, StudentMemoryConfig } from './types.ts'
import { DEFAULT_WATERMARK } from './types.ts'

export const HARVEST_PROMPT =
  '回顾本次先错后改对的地方，逐条调用 write_lesson（填当前开放的 arcId）后再结束。'

export const ARC_REMINDER =
  '你刚完成一次先错后改对。立即调用 write_lesson，只填语义字段，arcId 用下面列出的值。'

export class StudentMemoryRuntime {
  pinned: L2Pinned = {}
  liveQuery = ''
  private arcs: Arc[] = []
  private lessons: Lesson[] = []
  private sessionLearned: Lesson[] = []
  private lastRecall: RecalledLesson[] = []
  private arcSeq = 1
  private harvest = false

  constructor(
    private readonly persist: LessonPersist = new MemoryPersist(),
    private readonly config: StudentMemoryConfig = {},
  ) {}

  async boot(): Promise<void> {
    this.lessons = await this.persist.load()
    await this.flushDashboard()
  }

  snapshot(): DashboardSnapshot {
    return {
      updatedAt: new Date().toISOString(),
      l2: this.l2Text(),
      l1: this.l1Text(),
      l3: [...this.lastRecall],
      lessons: this.allLessons(),
      sessionLearnedIds: this.sessionLearned.map((item) => item.id),
      receipt: this.receipt(),
      dashboardPath: this.config.dashboardPath,
    }
  }

  async flushDashboard(): Promise<void> {
    if (!this.config.dashboardPath) return
    await writeDashboard(this.config.dashboardPath, this.snapshot())
  }

  allLessons(): Lesson[] {
    return [...this.lessons]
  }

  sessionLessons(): Lesson[] {
    return [...this.sessionLearned]
  }

  openArcs(): Arc[] {
    return openArcs(this.arcs)
  }

  observeTool(obs: ToolObservation): { reminder?: string } {
    const before = this.openArcs().length
    this.arcs = applyObservation(this.arcs, obs, () => nextArcId(this.arcSeq++))
    const opened = this.openArcs()
    if (opened.length > before) this.harvest = true
    const closedGreen = opened.some((arc) =>
      arc.signals.includes('tests-green') || arc.signals.includes('tsc-ci'))
    void this.flushDashboard()
    if (closedGreen && opened.length > 0) {
      return { reminder: ARC_REMINDER }
    }
    return {}
  }

  recordLesson(draft: LessonDraft): { ok: true; text: string } | { ok: false; text: string } {
    const result = writeLesson(draft, this.arcs)
    if (!result.ok) return { ok: false, text: result.error }
    this.lessons = [...this.lessons, result.lesson]
    this.sessionLearned = [...this.sessionLearned, result.lesson]
    this.arcs = this.arcs.map((arc) =>
      arc.arcId === draft.arcId ? { ...arc, consumed: true } : arc)
    if (this.openArcs().length === 0) this.harvest = false
    void this.persist.save(this.lessons)
    void this.flushDashboard()
    return { ok: true, text: `Recorded ${result.lesson.id} (${result.lesson.status}, ${result.lesson.trust}).` }
  }

  refreshRecall(query: string): RecalledLesson[] {
    this.liveQuery = query
    this.lastRecall = recallLessons(this.lessons, query)
    void this.flushDashboard()
    return this.lastRecall
  }

  requestHarvest(): boolean {
    const needed = this.openArcs().length > 0
    this.harvest = needed
    void this.flushDashboard()
    return needed
  }

  l2Text(): string {
    return renderL2(this.pinned)
  }

  l1Text(): string {
    const watermark = this.config.watermark === undefined
      ? DEFAULT_WATERMARK
      : this.config.watermark
    const live: Record<string, string> = {}
    if (this.liveQuery) live.query = this.liveQuery
    const open = this.openArcs()
    if (open.length > 0) {
      live.openArcs = open.map((arc) => `${arc.arcId} [${arc.signals.join(',')}]`).join('; ')
    }
    if (this.harvest && open.length > 0) live.harvest = HARVEST_PROMPT
    return renderL1({
      live,
      recall: this.lastRecall,
      openArcs: open.map((arc) => arc.arcId),
      harvest: this.harvest ? HARVEST_PROMPT : undefined,
      watermark,
    })
  }

  receipt(): string {
    return renderReceipt(this.sessionLearned)
  }

  sidebar(): string {
    return renderSidebar({
      injected: this.lastRecall.map((item) => item.id),
      learned: this.sessionLearned,
    })
  }
}

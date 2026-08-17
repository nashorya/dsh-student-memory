import { applyObservation, nextArcId, openArcs } from './arc.ts'
import type { Arc, ToolObservation } from './arc.ts'
import type { Lesson, LessonDraft } from './lesson.ts'
import { MemoryPersist } from './persist.ts'
import type { BoardPersist } from './persist.ts'
import { lessonCards } from './recall.ts'
import { writeDashboard } from './dashboard.ts'
import type { DashboardSnapshot } from './dashboard.ts'
import { renderReceipt, renderSidebar, usedRecallIds } from './receipt.ts'
import { writeLesson } from './write-lesson.ts'
import { assembleLayers } from './assemble.ts'
import type { AssembledLayers } from './assemble.ts'
import type { Adr, L2Pinned, RecalledLesson, Stage, StudentMemoryConfig, TodoItem } from './types.ts'

export const HARVEST_PROMPT =
  '回顾本次先错后改对的地方，逐条调用 write_lesson（填当前开放的 arcId）后再结束。'

export const ARC_REMINDER =
  '你刚完成一次先错后改对。立即调用 write_lesson，只填语义字段，arcId 用下面列出的值。'

export class StudentMemoryRuntime {
  pinned: L2Pinned = {}
  liveQuery = ''
  private arcs: Arc[] = []
  private lessons: Lesson[] = []
  private adrs: Adr[] = []
  private stages: Stage[] = []
  private todos: TodoItem[] = []
  private sessionLearned: Lesson[] = []
  private lastRecall: RecalledLesson[] = []
  private usedIds: string[] = []
  private reminded = new Set<string>()
  private harvestPulse = false
  private arcSeq = 1
  private todoSeq = 1
  private moves: string[] = []

  constructor(
    private readonly persist: BoardPersist = new MemoryPersist(),
    private readonly config: StudentMemoryConfig = {},
  ) {}

  async boot(): Promise<void> {
    const board = await this.persist.load()
    this.lessons = board.lessons
    this.adrs = board.adrs
    this.stages = board.stages
    this.todos = board.todos
    await this.flushDashboard()
  }

  snapshot(): DashboardSnapshot {
    const doing = this.todos.find((todo) => todo.status === 'doing')
    const stage = doing
      ? this.stages.find((item) => item.id === doing.stageId)
      : this.stages.find((item) => item.status === 'doing')
    const adr = doing
      ? this.adrs.find((item) => item.id === doing.adrId)
      : this.adrs[0]
    const now = [
      adr ? adr.title : '',
      stage ? stage.title : '',
      doing ? doing.content : '',
    ].filter(Boolean).join('\n')

    return {
      updatedAt: new Date().toISOString(),
      now,
      moves: [...this.moves],
      workset: this.l1Text(),
      lessons: this.allLessons(),
      adrs: [...this.adrs],
      stages: [...this.stages],
      todos: [...this.todos],
      openArcs: this.openArcs(),
      recalled: [...this.lastRecall],
      usedIds: [...this.usedIds],
      sessionLearned: this.sessionLessons(),
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

  setAdrs(adrs: Adr[]): void {
    this.adrs = [...adrs]
    void this.persistBoard()
  }

  setStages(stages: Stage[]): void {
    this.stages = [...stages]
    void this.persistBoard()
  }

  setTodos(todos: TodoItem[]): void {
    this.todos = [...todos]
    void this.persistBoard()
  }

  planStep(stageId: string, todos: Array<{ content: string; status?: TodoItem['status'] }>): string {
    const stage = this.stages.find((item) => item.id === stageId)
    if (!stage) return `Unknown stage "${stageId}"`
    const next = todos.map((todo) => ({
      id: `todo_${this.todoSeq++}`,
      adrId: stage.adrId,
      stageId,
      content: todo.content,
      status: todo.status ?? 'pending',
    }))
    this.todos = [...this.todos.filter((todo) => todo.stageId !== stageId), ...next]
    const doing = next.some((todo) => todo.status === 'doing')
    this.stages = this.stages.map((item) => item.id === stageId
      ? { ...item, status: doing ? 'doing' : item.status }
      : item)
    void this.persistBoard()
    return `Planned ${next.length} todos for ${stageId}.`
  }

  observeTool(obs: ToolObservation): { reminder?: string } {
    const beforeIds = new Set(this.openArcs().map((arc) => arc.arcId))
    this.arcs = applyObservation(this.arcs, obs, () => nextArcId(this.arcSeq++))
    const opened = this.openArcs()
    if (opened.some((arc) => !beforeIds.has(arc.arcId))) this.refreshCards()
    this.moves.push(obs.isError ? `${obs.toolName} error` : `${obs.toolName} ok`)
    if (this.moves.length > 16) this.moves = this.moves.slice(-16)
    let reminder: string | undefined
    for (const arc of opened) {
      const green = arc.signals.includes('tests-green') || arc.signals.includes('tsc-ci')
      if (green && !this.reminded.has(arc.arcId)) {
        this.reminded.add(arc.arcId)
        this.harvestPulse = true
        reminder = ARC_REMINDER
      }
    }
    void this.flushDashboard()
    return reminder ? { reminder } : {}
  }

  recordLesson(draft: LessonDraft): { ok: true; text: string } | { ok: false; text: string } {
    const result = writeLesson(draft, this.arcs)
    if (!result.ok) return { ok: false, text: result.error }
    this.lessons = [...this.lessons, result.lesson]
    this.sessionLearned = [...this.sessionLearned, result.lesson]
    this.moves.push(`write_lesson ${result.lesson.id} ${result.lesson.trust}`)
    this.arcs = this.arcs.map((arc) =>
      arc.arcId === draft.arcId ? { ...arc, consumed: true } : arc)
    this.harvestPulse = false
    this.refreshCards()
    void this.persistBoard()
    return { ok: true, text: `Recorded ${result.lesson.id} (${result.lesson.status}, ${result.lesson.trust}).` }
  }

  noteModelText(text: string): string[] {
    const found = usedRecallIds(text)
    if (found.length > 0) {
      this.usedIds = [...new Set([...this.usedIds, ...found])]
      void this.flushDashboard()
    }
    return found
  }

  refreshCards(): RecalledLesson[] {
    this.lastRecall = this.openArcs().length === 0
      ? []
      : lessonCards(this.lessons, this.sessionLearned.map((lesson) => lesson.id))
    void this.flushDashboard()
    return this.lastRecall
  }

  layers(options: { consumeHarvest?: boolean } = {}): AssembledLayers {
    const open = this.openArcs()
    const harvest = this.harvestPulse ? HARVEST_PROMPT : undefined
    if (options.consumeHarvest && this.harvestPulse) this.harvestPulse = false
    return assembleLayers({
      adrs: this.adrs,
      stages: this.stages,
      todos: this.todos,
      pinned: this.pinned,
      liveQuery: this.liveQuery,
      recall: this.lastRecall,
      harvest,
      openArcs: open.map((arc) => arc.arcId),
      recentErrors: this.pinned.recentErrors ?? this.moves.filter((move) => move.endsWith('error')),
    })
  }

  l0Text(): string {
    return this.layers().l0
  }

  l1Text(options: { consumeHarvest?: boolean } = {}): string {
    return this.layers(options).l1
  }

  receipt(): string {
    return renderReceipt(this.sessionLearned, this.usedIds)
  }

  sidebar(): string {
    return renderSidebar({
      injected: this.lastRecall.map((item) => item.id),
      learned: this.sessionLearned,
      used: this.usedIds,
    })
  }

  private async persistBoard(): Promise<void> {
    await this.persist.save({
      lessons: this.lessons,
      adrs: this.adrs,
      stages: this.stages,
      todos: this.todos,
    })
    await this.flushDashboard()
  }
}

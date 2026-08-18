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
import { renderL2Summary } from './l2.ts'
import type { Adr, L2Pinned, RecalledLesson, Stage, StudentMemoryConfig, TodoItem } from './types.ts'
import {
  formatAdrEntry,
  formatBugEntry,
  loadWorkspaceDocs,
  prependAdr,
  prependBuglog,
  writeIndex,
  type WorkspaceDocs,
} from './docs.ts'

export const HARVEST_PROMPT =
  '回顾本次先错后改对的地方，逐条调用 write_lesson（填当前开放的 arcId）后再结束。'

export const ARC_REMINDER =
  '你刚完成一次先错后改对。立即调用 write_lesson，只填语义字段，arcId 用下面列出的值。'

const INDEX_STUB_HINT = '（还没有）'

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
  private adrSeq = 1
  private stageSeq = 1
  private moves: string[] = []
  private docs: WorkspaceDocs = { index: '', adr: '', buglog: '' }
  private lastUserAt = 0
  private coveredUntil = 0
  private archivedKey = ''

  constructor(
    private readonly persist: BoardPersist = new MemoryPersist(),
    private readonly config: StudentMemoryConfig = {},
  ) {}

  get workspaceDir(): string | undefined {
    return this.config.workspaceDir
  }

  async boot(): Promise<void> {
    const board = await this.persist.load()
    this.lessons = board.lessons
    this.adrs = board.adrs
    this.stages = board.stages
    this.todos = board.todos
    this.adrSeq = nextSeq(this.adrs.map((item) => item.id), 'adr_')
    this.stageSeq = nextSeq(this.stages.map((item) => item.id), 'stage_')
    this.todoSeq = nextSeq(this.todos.map((item) => item.id), 'todo_')
    this.pinned = { ...board.pinned }
    this.archivedKey = board.archivedKey ?? ''
    if (this.config.workspaceDir) {
      this.docs = await loadWorkspaceDocs(this.config.workspaceDir)
    }
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
      workspaceDir: this.config.workspaceDir,
      indexMd: this.docs.index,
      adrMd: this.docs.adr,
      buglogMd: this.docs.buglog,
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
    if (this.needsAdr()) {
      return '本请求还没有 ADR。先调用 propose_adr，再 plan_step。'
    }
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
    const allDone = next.length > 0 && next.every((todo) => todo.status === 'done')
    this.stages = this.stages.map((item) => item.id === stageId
      ? { ...item, status: doing ? 'doing' : allDone ? 'done' : item.status }
      : item)
    void this.persistBoard()
    return `Planned ${next.length} todos for ${stageId}.`
  }

  async proposeAdr(input: { title: string; context: string; decision?: string }): Promise<string> {
    const title = input.title.trim()
    const context = input.context.trim()
    if (!title || !context) return 'title 和 context 都不能为空。'
    const existing = this.adrs.find((item) => item.title === title && item.status !== 'superseded')
    if (existing) {
      this.coveredUntil = Date.now()
      const stage = this.stages.find((item) => item.adrId === existing.id)
      return `已有 ADR ${existing.id}（${existing.status}）${stage ? `，阶段 ${stage.id}` : ''}。继续维护 INDEX 与 buglog。`
    }
    const id = `adr_${this.adrSeq++}`
    const stageId = `stage_${this.stageSeq++}`
    const adr: Adr = { id, title, status: 'accepted' }
    const stage: Stage = { id: stageId, adrId: id, title: '实施', status: 'doing' }
    this.adrs = [adr, ...this.adrs]
    this.stages = [stage, ...this.stages]
    this.coveredUntil = Date.now()
    const at = new Date().toISOString()
    const entry = formatAdrEntry({
      id, title, context, decision: input.decision, status: adr.status, at,
    })
    if (this.config.workspaceDir) {
      this.docs.adr = await prependAdr(this.config.workspaceDir, entry)
      if (!this.docs.index.includes(id)) {
        this.docs.index = upsertIndexLine(this.docs.index, `- ${id} ${title} · accepted`)
        await writeIndex(this.config.workspaceDir, this.docs.index)
      }
    }
    this.moves.push(`propose_adr ${id}`)
    await this.persistBoard()
    return `已记录 ${id}。阶段 ${stageId}。用 plan_step 写该阶段待办，并更新 INDEX。`
  }

  async updateIndex(content: string): Promise<string> {
    const text = content.trim()
    if (!text) return 'INDEX 内容不能为空。'
    if (!this.config.workspaceDir) return '当前没有工作区，无法写 INDEX.md。'
    this.docs.index = text
    await writeIndex(this.config.workspaceDir, text)
    this.moves.push('update_index')
    await this.flushDashboard()
    return 'INDEX.md 已更新。'
  }

  async appendBuglog(input: { title: string; detail: string; status: string }): Promise<string> {
    const title = input.title.trim()
    const detail = input.detail.trim()
    if (!title || !detail) return 'title 和 detail 都不能为空。'
    if (!this.config.workspaceDir) return '当前没有工作区，无法写 buglog.md。'
    const entry = formatBugEntry({
      title,
      detail,
      status: input.status.trim() || 'open',
      at: new Date().toISOString(),
    })
    this.docs.buglog = await prependBuglog(this.config.workspaceDir, entry)
    if (!this.docs.index.includes(title)) {
      this.docs.index = upsertIndexLine(this.docs.index, `- bug: ${title} · ${input.status.trim() || 'open'}`)
      await writeIndex(this.config.workspaceDir, this.docs.index)
    }
    this.moves.push(`append_buglog ${title}`)
    await this.flushDashboard()
    return 'buglog.md 已追加。'
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

  noteUserTurn(): void {
    this.lastUserAt = Date.now()
  }

  needsAdr(): boolean {
    return this.adrs.length === 0 || this.lastUserAt > this.coveredUntil
  }

  /** True only when live ADR work is finished and not yet archived to L2. */
  shouldArchiveHistory(): boolean {
    if (!this.isTaskComplete()) return false
    return this.taskArchiveKey() !== this.archivedKey
  }

  isTaskComplete(): boolean {
    const live = this.adrs.filter((item) => item.status !== 'superseded')
    if (live.length === 0) return false
    const ids = new Set(live.map((item) => item.id))
    const stages = this.stages.filter((item) => ids.has(item.adrId))
    const todos = this.todos.filter((item) => ids.has(item.adrId))
    const openTodos = todos.filter((item) => item.status !== 'done')
    const openStages = stages.filter((item) => item.status !== 'done')
    if (todos.length > 0) return openTodos.length === 0
    return stages.length > 0 && openStages.length === 0
  }

  archiveToL2(): string {
    const live = this.adrs.filter((item) => item.status !== 'superseded')
    const ledger = live.map((adr) => {
      const stages = this.stages.filter((item) => item.adrId === adr.id)
      const todos = this.todos.filter((item) => item.adrId === adr.id)
      const stageLines = stages.map((stage) => `  - ${stage.title} [${stage.status}]`)
      const todoLines = todos.map((todo) => `  - [${todo.status}] ${todo.content}`)
      return [`${adr.id} ${adr.title} [${adr.status}]`, ...stageLines, ...todoLines].join('\n')
    }).join('\n')
    this.pinned = {
      ...this.pinned,
      workingMemory: this.snapshot().now || live.map((item) => item.title).join('\n'),
      taskLedger: ledger,
    }
    this.archivedKey = this.taskArchiveKey()
    this.moves.push('archive_l2')
    void this.persistBoard()
    return renderL2Summary(this.pinned, { stages: this.stages, todos: this.todos })
  }

  private taskArchiveKey(): string {
    return this.adrs
      .filter((item) => item.status !== 'superseded')
      .map((item) => item.id)
      .sort()
      .join(',')
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
      adrRequired: this.needsAdr(),
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
      pinned: this.pinned,
      archivedKey: this.archivedKey,
    })
    await this.flushDashboard()
  }
}

function nextSeq(ids: string[], prefix: string): number {
  let max = 0
  for (const id of ids) {
    if (!id.startsWith(prefix)) continue
    const n = Number(id.slice(prefix.length))
    if (Number.isFinite(n) && n > max) max = n
  }
  return max + 1
}

function upsertIndexLine(index: string, line: string): string {
  const body = index.trim() || '# Index'
  if (body.includes(line)) return body + '\n'
  if (body.includes(INDEX_STUB_HINT)) {
    return body.replace(INDEX_STUB_HINT, line)
  }
  return `${body.trimEnd()}\n${line}\n`
}

import { applyObservation, nextArcId, openArcs } from "./arc.js";
import { MemoryPersist } from "./persist.js";
import { lessonCards } from "./recall.js";
import { writeDashboard } from "./dashboard.js";
import { renderReceipt, renderSidebar, usedRecallIds } from "./receipt.js";
import { writeLesson } from "./write-lesson.js";
import { assembleLayers } from "./assemble.js";
import { renderL2Summary } from "./l2.js";
import {
  formatAdrEntry,
  formatBugEntry,
  loadWorkspaceDocs,
  prependAdr,
  prependBuglog,
  writeIndex
} from "./docs.js";
const HARVEST_PROMPT = "\u56DE\u987E\u672C\u6B21\u5148\u9519\u540E\u6539\u5BF9\u7684\u5730\u65B9\uFF0C\u9010\u6761\u8C03\u7528 write_lesson\uFF08\u586B\u5F53\u524D\u5F00\u653E\u7684 arcId\uFF09\u540E\u518D\u7ED3\u675F\u3002";
const ARC_REMINDER = "\u4F60\u521A\u5B8C\u6210\u4E00\u6B21\u5148\u9519\u540E\u6539\u5BF9\u3002\u7ACB\u5373\u8C03\u7528 write_lesson\uFF0C\u53EA\u586B\u8BED\u4E49\u5B57\u6BB5\uFF0CarcId \u7528\u4E0B\u9762\u5217\u51FA\u7684\u503C\u3002";
const INDEX_STUB_HINT = "\uFF08\u8FD8\u6CA1\u6709\uFF09";
class StudentMemoryRuntime {
  constructor(persist = new MemoryPersist(), config = {}) {
    this.persist = persist;
    this.config = config;
  }
  persist;
  config;
  pinned = {};
  liveQuery = "";
  arcs = [];
  lessons = [];
  adrs = [];
  stages = [];
  todos = [];
  sessionLearned = [];
  lastRecall = [];
  usedIds = [];
  reminded = /* @__PURE__ */ new Set();
  harvestPulse = false;
  arcSeq = 1;
  todoSeq = 1;
  adrSeq = 1;
  stageSeq = 1;
  moves = [];
  docs = { index: "", adr: "", buglog: "" };
  lastUserAt = 0;
  coveredUntil = 0;
  archivedKey = "";
  get workspaceDir() {
    return this.config.workspaceDir;
  }
  async boot() {
    const board = await this.persist.load();
    this.lessons = board.lessons;
    this.adrs = board.adrs;
    this.stages = board.stages;
    this.todos = board.todos;
    this.adrSeq = nextSeq(this.adrs.map((item) => item.id), "adr_");
    this.stageSeq = nextSeq(this.stages.map((item) => item.id), "stage_");
    this.todoSeq = nextSeq(this.todos.map((item) => item.id), "todo_");
    this.pinned = { ...board.pinned };
    this.archivedKey = board.archivedKey ?? "";
    if (this.config.workspaceDir) {
      this.docs = await loadWorkspaceDocs(this.config.workspaceDir);
    }
    await this.flushDashboard();
  }
  snapshot() {
    const doing = this.todos.find((todo) => todo.status === "doing");
    const stage = doing ? this.stages.find((item) => item.id === doing.stageId) : this.stages.find((item) => item.status === "doing");
    const adr = doing ? this.adrs.find((item) => item.id === doing.adrId) : this.adrs[0];
    const now = [
      adr ? adr.title : "",
      stage ? stage.title : "",
      doing ? doing.content : ""
    ].filter(Boolean).join("\n");
    return {
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
      buglogMd: this.docs.buglog
    };
  }
  async flushDashboard() {
    if (!this.config.dashboardPath) return;
    await writeDashboard(this.config.dashboardPath, this.snapshot());
  }
  allLessons() {
    return [...this.lessons];
  }
  sessionLessons() {
    return [...this.sessionLearned];
  }
  openArcs() {
    return openArcs(this.arcs);
  }
  setAdrs(adrs) {
    this.adrs = [...adrs];
    void this.persistBoard();
  }
  setStages(stages) {
    this.stages = [...stages];
    void this.persistBoard();
  }
  setTodos(todos) {
    this.todos = [...todos];
    void this.persistBoard();
  }
  planStep(stageId, todos) {
    if (this.needsAdr()) {
      return "\u672C\u8BF7\u6C42\u8FD8\u6CA1\u6709 ADR\u3002\u5148\u8C03\u7528 propose_adr\uFF0C\u518D plan_step\u3002";
    }
    const stage = this.stages.find((item) => item.id === stageId);
    if (!stage) return `Unknown stage "${stageId}"`;
    const next = todos.map((todo) => ({
      id: `todo_${this.todoSeq++}`,
      adrId: stage.adrId,
      stageId,
      content: todo.content,
      status: todo.status ?? "pending"
    }));
    this.todos = [...this.todos.filter((todo) => todo.stageId !== stageId), ...next];
    const doing = next.some((todo) => todo.status === "doing");
    const allDone = next.length > 0 && next.every((todo) => todo.status === "done");
    this.stages = this.stages.map((item) => item.id === stageId ? { ...item, status: doing ? "doing" : allDone ? "done" : item.status } : item);
    void this.persistBoard();
    return `Planned ${next.length} todos for ${stageId}.`;
  }
  async proposeAdr(input) {
    const title = input.title.trim();
    const context = input.context.trim();
    if (!title || !context) return "title \u548C context \u90FD\u4E0D\u80FD\u4E3A\u7A7A\u3002";
    const existing = this.adrs.find((item) => item.title === title && item.status !== "superseded");
    if (existing) {
      this.coveredUntil = Date.now();
      const stage2 = this.stages.find((item) => item.adrId === existing.id);
      return `\u5DF2\u6709 ADR ${existing.id}\uFF08${existing.status}\uFF09${stage2 ? `\uFF0C\u9636\u6BB5 ${stage2.id}` : ""}\u3002\u7EE7\u7EED\u7EF4\u62A4 INDEX \u4E0E buglog\u3002`;
    }
    const id = `adr_${this.adrSeq++}`;
    const stageId = `stage_${this.stageSeq++}`;
    const adr = { id, title, status: "accepted" };
    const stage = { id: stageId, adrId: id, title: "\u5B9E\u65BD", status: "doing" };
    this.adrs = [adr, ...this.adrs];
    this.stages = [stage, ...this.stages];
    this.coveredUntil = Date.now();
    const at = (/* @__PURE__ */ new Date()).toISOString();
    const entry = formatAdrEntry({
      id,
      title,
      context,
      decision: input.decision,
      status: adr.status,
      at
    });
    if (this.config.workspaceDir) {
      this.docs.adr = await prependAdr(this.config.workspaceDir, entry);
      if (!this.docs.index.includes(id)) {
        this.docs.index = upsertIndexLine(this.docs.index, `- ${id} ${title} \xB7 accepted`);
        await writeIndex(this.config.workspaceDir, this.docs.index);
      }
    }
    this.moves.push(`propose_adr ${id}`);
    await this.persistBoard();
    return `\u5DF2\u8BB0\u5F55 ${id}\u3002\u9636\u6BB5 ${stageId}\u3002\u7528 plan_step \u5199\u8BE5\u9636\u6BB5\u5F85\u529E\uFF0C\u5E76\u66F4\u65B0 INDEX\u3002`;
  }
  async updateIndex(content) {
    const text = content.trim();
    if (!text) return "INDEX \u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A\u3002";
    if (!this.config.workspaceDir) return "\u5F53\u524D\u6CA1\u6709\u5DE5\u4F5C\u533A\uFF0C\u65E0\u6CD5\u5199 INDEX.md\u3002";
    this.docs.index = text;
    await writeIndex(this.config.workspaceDir, text);
    this.moves.push("update_index");
    await this.flushDashboard();
    return "INDEX.md \u5DF2\u66F4\u65B0\u3002";
  }
  async appendBuglog(input) {
    const title = input.title.trim();
    const detail = input.detail.trim();
    if (!title || !detail) return "title \u548C detail \u90FD\u4E0D\u80FD\u4E3A\u7A7A\u3002";
    if (!this.config.workspaceDir) return "\u5F53\u524D\u6CA1\u6709\u5DE5\u4F5C\u533A\uFF0C\u65E0\u6CD5\u5199 buglog.md\u3002";
    const entry = formatBugEntry({
      title,
      detail,
      status: input.status.trim() || "open",
      at: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.docs.buglog = await prependBuglog(this.config.workspaceDir, entry);
    if (!this.docs.index.includes(title)) {
      this.docs.index = upsertIndexLine(this.docs.index, `- bug: ${title} \xB7 ${input.status.trim() || "open"}`);
      await writeIndex(this.config.workspaceDir, this.docs.index);
    }
    this.moves.push(`append_buglog ${title}`);
    await this.flushDashboard();
    return "buglog.md \u5DF2\u8FFD\u52A0\u3002";
  }
  observeTool(obs) {
    const beforeIds = new Set(this.openArcs().map((arc) => arc.arcId));
    this.arcs = applyObservation(this.arcs, obs, () => nextArcId(this.arcSeq++));
    const opened = this.openArcs();
    if (opened.some((arc) => !beforeIds.has(arc.arcId))) this.refreshCards();
    this.moves.push(obs.isError ? `${obs.toolName} error` : `${obs.toolName} ok`);
    if (this.moves.length > 16) this.moves = this.moves.slice(-16);
    let reminder;
    for (const arc of opened) {
      const green = arc.signals.includes("tests-green") || arc.signals.includes("tsc-ci");
      if (green && !this.reminded.has(arc.arcId)) {
        this.reminded.add(arc.arcId);
        this.harvestPulse = true;
        reminder = ARC_REMINDER;
      }
    }
    void this.flushDashboard();
    return reminder ? { reminder } : {};
  }
  recordLesson(draft) {
    const result = writeLesson(draft, this.arcs);
    if (!result.ok) return { ok: false, text: result.error };
    this.lessons = [...this.lessons, result.lesson];
    this.sessionLearned = [...this.sessionLearned, result.lesson];
    this.moves.push(`write_lesson ${result.lesson.id} ${result.lesson.trust}`);
    this.arcs = this.arcs.map((arc) => arc.arcId === draft.arcId ? { ...arc, consumed: true } : arc);
    this.harvestPulse = false;
    this.refreshCards();
    void this.persistBoard();
    return { ok: true, text: `Recorded ${result.lesson.id} (${result.lesson.status}, ${result.lesson.trust}).` };
  }
  noteModelText(text) {
    const found = usedRecallIds(text);
    if (found.length > 0) {
      this.usedIds = [.../* @__PURE__ */ new Set([...this.usedIds, ...found])];
      void this.flushDashboard();
    }
    return found;
  }
  noteUserTurn() {
    this.lastUserAt = Date.now();
  }
  needsAdr() {
    return this.adrs.length === 0 || this.lastUserAt > this.coveredUntil;
  }
  /** True only when live ADR work is finished and not yet archived to L2. */
  shouldArchiveHistory() {
    if (!this.isTaskComplete()) return false;
    return this.taskArchiveKey() !== this.archivedKey;
  }
  isTaskComplete() {
    const live = this.adrs.filter((item) => item.status !== "superseded");
    if (live.length === 0) return false;
    const ids = new Set(live.map((item) => item.id));
    const stages = this.stages.filter((item) => ids.has(item.adrId));
    const todos = this.todos.filter((item) => ids.has(item.adrId));
    const openTodos = todos.filter((item) => item.status !== "done");
    const openStages = stages.filter((item) => item.status !== "done");
    if (todos.length > 0) return openTodos.length === 0;
    return stages.length > 0 && openStages.length === 0;
  }
  archiveToL2() {
    const live = this.adrs.filter((item) => item.status !== "superseded");
    const ledger = live.map((adr) => {
      const stages = this.stages.filter((item) => item.adrId === adr.id);
      const todos = this.todos.filter((item) => item.adrId === adr.id);
      const stageLines = stages.map((stage) => `  - ${stage.title} [${stage.status}]`);
      const todoLines = todos.map((todo) => `  - [${todo.status}] ${todo.content}`);
      return [`${adr.id} ${adr.title} [${adr.status}]`, ...stageLines, ...todoLines].join("\n");
    }).join("\n");
    this.pinned = {
      ...this.pinned,
      workingMemory: this.snapshot().now || live.map((item) => item.title).join("\n"),
      taskLedger: ledger
    };
    this.archivedKey = this.taskArchiveKey();
    this.moves.push("archive_l2");
    void this.persistBoard();
    return renderL2Summary(this.pinned, { stages: this.stages, todos: this.todos });
  }
  taskArchiveKey() {
    return this.adrs.filter((item) => item.status !== "superseded").map((item) => item.id).sort().join(",");
  }
  refreshCards() {
    this.lastRecall = this.openArcs().length === 0 ? [] : lessonCards(this.lessons, this.sessionLearned.map((lesson) => lesson.id));
    void this.flushDashboard();
    return this.lastRecall;
  }
  layers(options = {}) {
    const open = this.openArcs();
    const harvest = this.harvestPulse ? HARVEST_PROMPT : void 0;
    if (options.consumeHarvest && this.harvestPulse) this.harvestPulse = false;
    return assembleLayers({
      adrs: this.adrs,
      stages: this.stages,
      todos: this.todos,
      pinned: this.pinned,
      liveQuery: this.liveQuery,
      recall: this.lastRecall,
      harvest,
      openArcs: open.map((arc) => arc.arcId),
      recentErrors: this.pinned.recentErrors ?? this.moves.filter((move) => move.endsWith("error")),
      adrRequired: this.needsAdr()
    });
  }
  l0Text() {
    return this.layers().l0;
  }
  l1Text(options = {}) {
    return this.layers(options).l1;
  }
  receipt() {
    return renderReceipt(this.sessionLearned, this.usedIds);
  }
  sidebar() {
    return renderSidebar({
      injected: this.lastRecall.map((item) => item.id),
      learned: this.sessionLearned,
      used: this.usedIds
    });
  }
  async persistBoard() {
    await this.persist.save({
      lessons: this.lessons,
      adrs: this.adrs,
      stages: this.stages,
      todos: this.todos,
      pinned: this.pinned,
      archivedKey: this.archivedKey
    });
    await this.flushDashboard();
  }
}
function nextSeq(ids, prefix) {
  let max = 0;
  for (const id of ids) {
    if (!id.startsWith(prefix)) continue;
    const n = Number(id.slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}
function upsertIndexLine(index, line) {
  const body = index.trim() || "# Index";
  if (body.includes(line)) return body + "\n";
  if (body.includes(INDEX_STUB_HINT)) {
    return body.replace(INDEX_STUB_HINT, line);
  }
  return `${body.trimEnd()}
${line}
`;
}
export {
  ARC_REMINDER,
  HARVEST_PROMPT,
  StudentMemoryRuntime
};

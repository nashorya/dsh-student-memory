import { truncateL1 } from "./budget.js";
import { excludeConflictingPlugins } from "./exclude.js";
import { dropPriorTurns } from "./history.js";
import { renderL0 } from "./l0.js";
import { renderL1 } from "./l1.js";
import {
  appendBuglogTool,
  observationFromExec,
  planStepTool,
  proposeAdrTool,
  updateIndexTool,
  writeLessonTool
} from "./tool.js";
import { MemoryHub } from "./hub.js";
import { registerMemoryRoutes } from "./web.js";
import {
  L0_ORDER,
  L0_SECTION,
  L1_CONTEXT,
  L1_ORDER,
  L1_SAFETY_CHARS
} from "./types.js";
import { applyL1Budget, truncateL1 as truncateL12 } from "./budget.js";
import { assembleLayers } from "./assemble.js";
import { EXCLUDED_PLUGINS, excludeConflictingPlugins as excludeConflictingPlugins2, matchesExcluded } from "./exclude.js";
import { dropPriorTurns as dropPriorTurns2, PRIOR_TURN_STUB } from "./history.js";
import { selectPriorTurnRange } from "./surface-policy.js";
import { renderL0 as renderL02 } from "./l0.js";
import { renderL1 as renderL12 } from "./l1.js";
import { renderL2, renderL2Summary } from "./l2.js";
import { StudentMemoryRuntime as StudentMemoryRuntime2, ARC_REMINDER, HARVEST_PROMPT } from "./runtime.js";
import { MemoryHub as MemoryHub2 } from "./hub.js";
import {
  planStepTool as planStepTool2,
  writeLessonTool as writeLessonTool2,
  proposeAdrTool as proposeAdrTool2,
  updateIndexTool as updateIndexTool2,
  appendBuglogTool as appendBuglogTool2
} from "./tool.js";
import { renderReceipt, renderSidebar, usedRecallIds } from "./receipt.js";
import { renderDashboard } from "./dashboard.js";
import { verdictOf } from "./verdict.js";
import { lessonCards, recallLessons } from "./recall.js";
import {
  CACHE_PREFIX_BREAKPOINT,
  DEFAULT_L1_BUDGET,
  L0_ORDER as L0_ORDER2,
  L0_SECTION as L0_SECTION2,
  L1_CONTEXT as L1_CONTEXT2,
  L1_ORDER as L1_ORDER2,
  L1_SAFETY_CHARS as L1_SAFETY_CHARS2
} from "./types.js";
const name = "student-memory";
const inject = ["systemPrompt", "tools", "webServer"];
function cwdFromSession(session) {
  const header = session?.header;
  return typeof header?.cwd === "string" ? header.cwd.trim() : "";
}
function isUserMessage(event) {
  return !!event && typeof event === "object" && event.type === "user/message";
}
function assistantTextFromEvent(event) {
  const rec = event;
  if (!rec || rec.type !== "assistant/message") return "";
  const content = rec.data?.message?.content;
  if (!Array.isArray(content)) return "";
  return content.filter((block) => !!block && typeof block === "object" && block.type === "text" && typeof block.text === "string").map((block) => block.text).join("");
}
function apply(ctx, config = {}) {
  const options = config ?? {};
  const hub = new MemoryHub(options);
  const excluded = excludeConflictingPlugins(ctx);
  const budget = options.l1BudgetChars ?? L1_SAFETY_CHARS;
  const requireRuntime = () => {
    const runtime = hub.active();
    if (!runtime) {
      throw new Error("\u5F53\u524D\u6CA1\u6709\u5DE5\u4F5C\u533A\u3002\u5148\u6253\u5F00\u5E26\u5DE5\u4F5C\u533A\u7684\u4F1A\u8BDD\uFF0C\u518D\u8C03\u7528\u5DE5\u5177\u3002");
    }
    return runtime;
  };
  ctx.systemPrompt.section({
    name: L0_SECTION,
    order: L0_ORDER,
    text: () => hub.active()?.l0Text() ?? renderL0()
  });
  ctx.systemPrompt.context({
    name: L1_CONTEXT,
    order: L1_ORDER,
    text: () => truncateL1(
      hub.active()?.l1Text({ consumeHarvest: true }) ?? renderL1({ adrRequired: true }),
      budget
    )
  });
  ctx.on("tools/result", ((exec, result) => {
    hub.active()?.observeTool(observationFromExec(exec, result));
  }));
  ctx.on("session/event", ((session, event) => {
    const cwd = cwdFromSession(session);
    if (cwd) hub.use(cwd);
    const runtime = hub.active();
    if (!runtime) return;
    if (isUserMessage(event)) runtime.noteUserTurn();
    const text = assistantTextFromEvent(event);
    if (text) runtime.noteModelText(text);
  }));
  ctx.on("agent/pre-step", ((event, next) => {
    return excluded.then(() => {
      const session = event?.agent?.session;
      const cwd = cwdFromSession(session);
      if (cwd) hub.use(cwd);
      const runtime = hub.active();
      if (session && runtime?.shouldArchiveHistory()) {
        runtime.archiveToL2();
        dropPriorTurns(session);
      }
      return typeof next === "function" ? next() : void 0;
    });
  }));
  ctx.tools.register(proposeAdrTool(requireRuntime));
  ctx.tools.register(updateIndexTool(requireRuntime));
  ctx.tools.register(appendBuglogTool(requireRuntime));
  ctx.tools.register(writeLessonTool(requireRuntime));
  ctx.tools.register(planStepTool(requireRuntime));
  if (ctx.webServer) registerMemoryRoutes(ctx.webServer, hub);
  return hub;
}
export {
  ARC_REMINDER,
  CACHE_PREFIX_BREAKPOINT,
  DEFAULT_L1_BUDGET,
  EXCLUDED_PLUGINS,
  HARVEST_PROMPT,
  L0_ORDER2 as L0_ORDER,
  L0_SECTION2 as L0_SECTION,
  L1_CONTEXT2 as L1_CONTEXT,
  L1_ORDER2 as L1_ORDER,
  L1_SAFETY_CHARS2 as L1_SAFETY_CHARS,
  MemoryHub2 as MemoryHub,
  PRIOR_TURN_STUB,
  StudentMemoryRuntime2 as StudentMemoryRuntime,
  appendBuglogTool2 as appendBuglogTool,
  apply,
  applyL1Budget,
  assembleLayers,
  assistantTextFromEvent,
  dropPriorTurns2 as dropPriorTurns,
  excludeConflictingPlugins2 as excludeConflictingPlugins,
  inject,
  lessonCards,
  matchesExcluded,
  name,
  planStepTool2 as planStepTool,
  proposeAdrTool2 as proposeAdrTool,
  recallLessons,
  renderDashboard,
  renderL02 as renderL0,
  renderL12 as renderL1,
  renderL2,
  renderL2Summary,
  renderReceipt,
  renderSidebar,
  selectPriorTurnRange,
  truncateL12 as truncateL1,
  updateIndexTool2 as updateIndexTool,
  usedRecallIds,
  verdictOf,
  writeLessonTool2 as writeLessonTool
};

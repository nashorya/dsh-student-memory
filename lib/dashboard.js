import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { renderLesson } from "./lesson.js";
const TRUST_LABEL = {
  "tests-green": "tests-green",
  "tsc-ci": "tsc-ci",
  isolated: "isolated"
};
function esc(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
function chartState(snap) {
  if (snap.openArcs.length > 0) return "\u6D6E\u6807";
  if (snap.sessionLearned.length > 0) return "\u6C89";
  if (snap.workset.includes("### lessons")) return "\u635E";
  return "idle";
}
function adrCard(adr, stages, todos) {
  const mine = stages.filter((stage) => stage.adrId === adr.id);
  const stageBlock = mine.length === 0 ? '<p class="empty">\u2014</p>' : mine.map((stage) => {
    const items = todos.filter((todo) => todo.stageId === stage.id);
    const list = items.length === 0 ? '<p class="empty">\u2014</p>' : `<ul>${items.map((todo) => `<li><code>${esc(todo.status)}</code> ${esc(todo.content)}</li>`).join("")}</ul>`;
    return `<h3>${esc(stage.title)} <span class="tag">${esc(stage.status)}</span></h3>${list}`;
  }).join("");
  return `<article class="card">
    <header><code>${esc(adr.id)}</code><span class="tag">${esc(adr.status)}</span></header>
    <p>${esc(adr.title)}</p>
    ${stageBlock}
  </article>`;
}
function lessonCard(lesson) {
  return `<article class="card">
    <header><code>${esc(lesson.id)}</code><span class="tag">${esc(TRUST_LABEL[lesson.trust])}</span></header>
    <pre>${esc(renderLesson(lesson) || "\u2014")}</pre>
  </article>`;
}
function renderDashboard(snap) {
  const moves = snap.moves.length === 0 ? '<p class="empty">\u2014</p>' : `<ul>${snap.moves.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
  const used = snap.usedIds.length === 0 ? '<p class="empty">\u2014</p>' : `<ul>${snap.usedIds.map((id) => `<li><code>${esc(id)}</code></li>`).join("")}</ul>`;
  const spread = snap.recalled.length === 0 ? '<p class="empty">\u2014</p>' : `<ul>${snap.recalled.map((item) => `<li><code>${esc(item.id)}</code> ${esc(item.summary)}</li>`).join("")}</ul>`;
  const adrBlock = snap.adrs.length === 0 ? '<p class="empty">\u2014</p>' : snap.adrs.map((adr) => adrCard(adr, snap.stages, snap.todos)).join("\n");
  const learned = snap.sessionLearned.length === 0 ? '<p class="empty">\u2014</p>' : snap.sessionLearned.map(lessonCard).join("\n");
  const workspace = snap.workspaceDir?.trim() || "\u2014";
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="4">
  <title>\u770B\u677F</title>
  <style>
    :root { color-scheme: dark; --bg:#0b2436; --fg:#e8f4fb; --muted:#9ec4d8; --card:#123d56; --line:#1d5f86; }
    body { margin: 0; font: 14px/1.45 ui-sans-serif, system-ui; background: var(--bg); color: var(--fg); }
    header { padding: 16px 20px; border-bottom: 1px solid var(--line); }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .meta { color: var(--muted); word-break: break-all; }
    main { padding: 16px 20px 40px; display: grid; gap: 16px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .docs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .pane { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 12px; min-height: 120px; }
    h2 { font-size: 12px; margin: 0 0 8px; color: var(--muted); }
    h3 { font-size: 12px; margin: 8px 0 4px; color: var(--muted); }
    pre { white-space: pre-wrap; word-break: break-word; margin: 0; font: 12px/1.4 ui-monospace, monospace; }
    .card { border: 1px solid var(--line); border-radius: 6px; padding: 8px; margin-bottom: 8px; }
    .card header { display: flex; justify-content: space-between; gap: 8px; padding: 0; border: 0; }
    .tag, .empty, small { color: var(--muted); }
    ul { margin: 0; padding-left: 1.1em; }
    @media (max-width: 1100px) { .docs { grid-template-columns: 1fr; } .row { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <h1>\u770B\u677F</h1>
    <p class="meta">${esc(workspace)}</p>
  </header>
  <main>
    <div class="docs">
      <section class="pane">
        <h2>INDEX</h2>
        <pre>${esc(snap.indexMd || "\u2014")}</pre>
      </section>
      <section class="pane">
        <h2>ADR</h2>
        <pre>${esc(snap.adrMd || "\u2014")}</pre>
      </section>
      <section class="pane">
        <h2>Buglog</h2>
        <pre>${esc(snap.buglogMd || "\u2014")}</pre>
      </section>
    </div>
    <section class="pane">
      <h2>\u5F53\u524D</h2>
      <pre>${esc(snap.now || "\u2014")}</pre>
      <h3>\u6700\u8FD1\u52A8\u4F5C</h3>
      ${moves}
    </section>
    <div class="row">
      <section class="pane">
        <h2>\u4EFB\u52A1</h2>
        ${adrBlock}
      </section>
      <section class="pane">
        <h2>\u7ECF\u9A8C</h2>
        <h3>\u644A\u5F00</h3>
        ${spread}
        <h3>\u672C\u8F6E</h3>
        ${learned}
        <h3>\u5F15\u7528</h3>
        ${used}
        ${snap.lessons.map(lessonCard).join("\n") || '<p class="empty">\u2014</p>'}
      </section>
    </div>
  </main>
</body>
</html>
`;
}
async function writeDashboard(path, snap) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, renderDashboard({ ...snap, dashboardPath: path }), "utf8");
}
export {
  chartState,
  renderDashboard,
  writeDashboard
};

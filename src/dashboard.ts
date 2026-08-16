import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Arc } from './arc.ts'
import type { Lesson, LessonTrust } from './lesson.ts'
import { renderLesson } from './lesson.ts'
import type { Adr, RecalledLesson, TodoItem } from './types.ts'

export interface DashboardSnapshot {
  updatedAt: string
  now: string
  moves: string[]
  l2: string
  l1: string
  l3: RecalledLesson[]
  lessons: Lesson[]
  adrs: Adr[]
  todos: TodoItem[]
  openArcs: Arc[]
  dashboardPath?: string
}

const TRUST_LABEL: Record<LessonTrust, string> = {
  'tests-green': 'tests-green',
  'tsc-ci': 'tsc-ci',
  isolated: 'isolated',
}

function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function pre(label: string, body: string): string {
  return `<section class="pane"><h2>${esc(label)}</h2><pre>${esc(body.trim() || '—')}</pre></section>`
}

function adrCard(adr: Adr, todos: TodoItem[]): string {
  const mine = todos.filter((todo) => todo.adrId === adr.id)
  const items = mine.length === 0
    ? '<p class="empty">—</p>'
    : `<ul>${mine.map((todo) => `<li><code>${esc(todo.status)}</code> ${esc(todo.content)}</li>`).join('')}</ul>`
  return `<article class="card">
    <header><code>${esc(adr.id)}</code><span class="tag">${esc(adr.status)}</span></header>
    <p>${esc(adr.title)}</p>
    <h3>Todo</h3>
    ${items}
  </article>`
}

function lessonCard(lesson: Lesson): string {
  return `<article class="card">
    <header><code>${esc(lesson.id)}</code><span class="tag">${esc(TRUST_LABEL[lesson.trust])}</span></header>
    <pre>${esc(renderLesson(lesson) || '—')}</pre>
  </article>`
}

function column(trust: LessonTrust, lessons: Lesson[]): string {
  const rows = lessons.filter((item) => item.trust === trust)
  return `<section class="col">
    <h2>${esc(TRUST_LABEL[trust])} <small>${rows.length}</small></h2>
    ${rows.length === 0 ? '<p class="empty">—</p>' : rows.map(lessonCard).join('\n')}
  </section>`
}

export function renderDashboard(snap: DashboardSnapshot): string {
  const inject = snap.l3.length === 0
    ? '<p class="empty">—</p>'
    : `<ul>${snap.l3.map((item) => `<li><code>${esc(item.id)}</code><pre>${esc(item.summary)}</pre></li>`).join('')}</ul>`
  const moves = snap.moves.length === 0
    ? '<p class="empty">—</p>'
    : `<ul>${snap.moves.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
  const arcs = snap.openArcs.length === 0
    ? '—'
    : snap.openArcs.map((arc) => `${arc.arcId} ${arc.signals.join(',')}`).join('\n')
  const adrBlock = snap.adrs.length === 0
    ? '<p class="empty">—</p>'
    : snap.adrs.map((adr) => adrCard(adr, snap.todos)).join('\n')

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="4">
  <title>student-memory</title>
  <style>
    :root { color-scheme: dark; --bg:#111; --fg:#eee; --muted:#888; --card:#1a1a1a; --line:#333; }
    body { margin: 0; font: 14px/1.45 ui-sans-serif, system-ui; background: var(--bg); color: var(--fg); }
    header { padding: 16px 20px; border-bottom: 1px solid var(--line); }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .meta { color: var(--muted); }
    main { padding: 16px 20px 40px; display: grid; gap: 16px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .layers, .board { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; }
    .pane, .col { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
    h2 { font-size: 12px; margin: 0 0 8px; color: var(--muted); text-transform: uppercase; }
    h3 { font-size: 12px; margin: 8px 0 4px; color: var(--muted); }
    pre { white-space: pre-wrap; word-break: break-word; margin: 0; font: 12px/1.4 ui-monospace, monospace; }
    .card { border: 1px solid var(--line); border-radius: 6px; padding: 8px; margin-bottom: 8px; }
    .card header { display: flex; justify-content: space-between; gap: 8px; }
    .tag, .empty, small { color: var(--muted); }
    ul { margin: 0; padding-left: 1.1em; }
    @media (max-width: 900px) { .row, .layers, .board { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <h1>student-memory</h1>
    <p class="meta">${esc(snap.updatedAt)}</p>
  </header>
  <main>
    <section class="pane">
      <h2>AI</h2>
      <pre>${esc(snap.now || '—')}</pre>
      <h3>moves</h3>
      ${moves}
      <h3>open arcs</h3>
      <pre>${esc(arcs)}</pre>
    </section>
    <div class="layers">
      ${pre('L2', snap.l2)}
      ${pre('L1', snap.l1)}
      <section class="pane"><h2>L3</h2>${inject}</section>
    </div>
    <div class="row">
      <section class="pane">
        <h2>ADR</h2>
        ${adrBlock}
      </section>
      <section class="pane">
        <h2>Todo</h2>
        ${snap.todos.length === 0
          ? '<p class="empty">—</p>'
          : `<ul>${snap.todos.map((todo) => `<li><code>${esc(todo.adrId)}</code> <code>${esc(todo.status)}</code> ${esc(todo.content)}</li>`).join('')}</ul>`}
      </section>
    </div>
    <div class="board">
      ${column('isolated', snap.lessons)}
      ${column('tsc-ci', snap.lessons)}
      ${column('tests-green', snap.lessons)}
    </div>
  </main>
</body>
</html>
`
}

export async function writeDashboard(path: string, snap: DashboardSnapshot): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, renderDashboard({ ...snap, dashboardPath: path }), 'utf8')
}

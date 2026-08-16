import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Lesson, LessonTrust } from './lesson.ts'
import { renderLesson } from './lesson.ts'
import type { RecalledLesson } from './types.ts'

export interface DashboardSnapshot {
  updatedAt: string
  l2: string
  l1: string
  l3: RecalledLesson[]
  lessons: Lesson[]
  sessionLearnedIds: string[]
  receipt: string
  dashboardPath?: string
}

const TRUST_LABEL: Record<LessonTrust, string> = {
  'tests-green': '测试转绿',
  'tsc-ci': 'tsc / CI',
  isolated: '隔离区',
}

function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function pre(title: string, body: string, empty: string): string {
  const text = body.trim() ? body : empty
  return `<section class="pane"><h2>${esc(title)}</h2><pre>${esc(text)}</pre></section>`
}

function lessonCard(lesson: Lesson): string {
  const body = renderLesson(lesson) || '(空，不会注入)'
  return `<article class="card">
    <header><code>${esc(lesson.id)}</code><span class="tag">${esc(TRUST_LABEL[lesson.trust])}</span></header>
    <pre>${esc(body)}</pre>
    <footer>${esc(lesson.watermark)} · ${esc(lesson.status)}</footer>
  </article>`
}

function column(trust: LessonTrust, lessons: Lesson[]): string {
  const rows = lessons.filter((item) => item.trust === trust)
  return `<section class="col">
    <h2>${esc(TRUST_LABEL[trust])} <small>${rows.length}</small></h2>
    ${rows.length === 0 ? '<p class="empty">空</p>' : rows.map(lessonCard).join('\n')}
  </section>`
}

export function renderDashboard(snap: DashboardSnapshot): string {
  const injected = snap.l3.length === 0
    ? '<p class="empty">本轮没有注入 lesson。</p>'
    : `<ul>${snap.l3.map((item) => `<li><code>${esc(item.id)}</code><pre>${esc(item.summary)}</pre></li>`).join('')}</ul>`

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="3">
  <title>student-memory 看板</title>
  <style>
    :root { color-scheme: light dark; --bg: #111; --fg: #eee; --muted: #888; --card: #1c1c1c; --line: #333; }
    body { margin: 0; font: 14px/1.45 ui-sans-serif, system-ui; background: var(--bg); color: var(--fg); }
    header.top { padding: 16px 20px; border-bottom: 1px solid var(--line); }
    header.top p { color: var(--muted); margin: 4px 0 0; }
    main { padding: 16px 20px 40px; display: grid; gap: 20px; }
    .layers { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .pane, .col { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 12px; min-height: 8rem; }
    h1 { font-size: 18px; margin: 0; }
    h2 { font-size: 13px; letter-spacing: .04em; text-transform: uppercase; margin: 0 0 8px; color: var(--muted); }
    pre { white-space: pre-wrap; word-break: break-word; margin: 0; font: 12px/1.4 ui-monospace, monospace; }
    .card { border: 1px solid var(--line); border-radius: 6px; padding: 8px; margin-bottom: 8px; }
    .card header { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
    .tag { color: var(--muted); font-size: 12px; }
    .empty, footer, small { color: var(--muted); }
    @media (max-width: 900px) { .layers, .board { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header class="top">
    <h1>student-memory 看板</h1>
    <p>更新于 ${esc(snap.updatedAt)} · 本页每 3 秒刷新 · L3 = 召回注入</p>
  </header>
  <main>
    <div class="layers">
      ${pre('L2 钉住', snap.l2, '没有钉住的 working memory / ledger。')}
      ${pre('L1 本轮', snap.l1, '本轮 L1 为空（无 query / 开放弧 / 水印）。')}
      <section class="pane">
        <h2>L3 召回注入</h2>
        ${injected}
      </section>
    </div>
    <section class="pane">
      <h2>本会话小票</h2>
      <pre>${esc(snap.receipt)}</pre>
    </section>
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

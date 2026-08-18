import { renderDashboard } from './dashboard.ts'
import type { MemoryHub } from './hub.ts'
import type { StudentMemoryRuntime } from './runtime.ts'

export interface MemoryHttpResponse {
  writeHead(code: number, headers?: Record<string, string>): void
  end(body?: string): void
}

export interface MemoryWebServer {
  register(route: {
    kind: 'exact' | 'prefix'
    path: string
    handler: (req: unknown, res: MemoryHttpResponse) => void
  }): () => void
}

function requestUrl(req: unknown): URL {
  const raw = typeof req === 'object' && req && 'url' in req
    ? String((req as { url?: string }).url ?? '/')
    : '/'
  return new URL(raw, 'http://127.0.0.1')
}

function workspaceParam(req: unknown): string {
  return requestUrl(req).searchParams.get('workspace')?.trim() ?? ''
}

async function resolveRuntime(hub: MemoryHub, req: unknown): Promise<StudentMemoryRuntime | undefined> {
  const workspace = workspaceParam(req)
  if (workspace) return hub.ready(workspace)
  const active = hub.active()
  if (active) {
    const cwd = active.workspaceDir
    if (cwd) await hub.ready(cwd)
    return active
  }
  const only = hub.list()
  if (only.length === 1) {
    await hub.ready(only[0].cwd)
    return only[0].runtime
  }
  return undefined
}

function listPage(hub: MemoryHub): string {
  const rows = hub.list()
  const links = rows.length === 0
    ? '<p class="empty">—</p>'
    : `<ul>${rows.map(({ cwd }) => {
      const href = `/student-memory?workspace=${encodeURIComponent(cwd)}`
      return `<li><a href="${href}">${cwd.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</a></li>`
    }).join('')}</ul>`
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>看板</title>
  <style>
    :root { color-scheme: dark; --bg:#0b2436; --fg:#e8f4fb; --muted:#9ec4d8; --line:#1d5f86; }
    body { margin: 0; font: 14px/1.45 ui-sans-serif, system-ui; background: var(--bg); color: var(--fg); }
    main { padding: 24px; }
    a { color: #bfe3f5; }
    .empty { color: var(--muted); }
  </style>
</head>
<body>
  <main>
    <h1>看板</h1>
    ${links}
  </main>
</body>
</html>`
}

export function registerMemoryRoutes(web: MemoryWebServer, hub: MemoryHub): () => void {
  const drop: Array<() => void> = []
  drop.push(web.register({
    kind: 'exact',
    path: '/student-memory/workspaces',
    handler(_req, res) {
      res.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      })
      res.end(JSON.stringify({
        active: hub.active()?.workspaceDir ?? null,
        workspaces: hub.list().map(({ cwd }) => cwd),
      }))
    },
  }))
  drop.push(web.register({
    kind: 'exact',
    path: '/student-memory/state',
    async handler(req, res) {
      const runtime = await resolveRuntime(hub, req)
      if (!runtime) {
        res.writeHead(404, {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        })
        res.end(JSON.stringify({ error: 'no workspace', workspaces: hub.list().map(({ cwd }) => cwd) }))
        return
      }
      res.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      })
      res.end(JSON.stringify(runtime.snapshot()))
    },
  }))
  drop.push(web.register({
    kind: 'exact',
    path: '/student-memory',
    async handler(req, res) {
      const runtime = await resolveRuntime(hub, req)
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(runtime ? renderDashboard(runtime.snapshot()) : listPage(hub))
    },
  }))
  return () => {
    for (const dispose of drop) dispose()
  }
}

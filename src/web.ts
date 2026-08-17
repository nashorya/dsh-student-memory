import { renderDashboard } from './dashboard.ts'
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

export function registerMemoryRoutes(web: MemoryWebServer, runtime: StudentMemoryRuntime): () => void {
  const drop: Array<() => void> = []
  drop.push(web.register({
    kind: 'exact',
    path: '/student-memory/state',
    handler(_req, res) {
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
    handler(_req, res) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(renderDashboard(runtime.snapshot()))
    },
  }))
  return () => {
    for (const dispose of drop) dispose()
  }
}

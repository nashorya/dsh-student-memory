import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { registerMemoryRoutes } from '../src/web.ts'
import { StudentMemoryRuntime } from '../src/runtime.ts'

describe('memory web routes', () => {
  it('serves snapshot json', () => {
    const runtime = new StudentMemoryRuntime()
    runtime.setAdrs([{ id: 'ADR-001', title: 'Helm', status: 'accepted' }])
    let body = ''
    let status = 0
    const routes: string[] = []
    registerMemoryRoutes({
      register(route) {
        routes.push(route.path)
        if (route.path === '/student-memory/state') {
          route.handler({}, {
            writeHead(code) { status = code },
            end(chunk) { body = String(chunk) },
          })
        }
        return () => {}
      },
    }, runtime)
    expect(routes).toEqual(['/student-memory/state', '/student-memory'])
    expect(status).toBe(200)
    expect(JSON.parse(body).now).toContain('Helm')
  })
})

describe('client bundle', () => {
  const text = readFileSync(join(import.meta.dirname, '../src/client.js'), 'utf8')

  it('is a ModuleLoader face that takes the details column at a shadowing priority', () => {
    expect(text).toContain('window.__ModuleLoader__.load')
    expect(text).toContain(`name: 'details'`)
    expect(text).toContain('priority: -1')
    expect(text).toContain('舵手')
  })

  it('puts the ADR rail on the left browsing region', () => {
    expect(text).toContain(`name: 'sidebar.workspaces'`)
    expect(text).toContain('已完成')
    expect(text).toContain('当前工作')
    expect(text).toContain('下一步')
    expect(text).not.toContain('sidebar.workspaces.directoryFlow')
  })

  it('draws the sea scene as SVG and shows agents plus token use', () => {
    expect(text).toContain('data-haul')
    expect(text).toContain('preserveAspectRatio')
    expect(text).toContain('还没有子 agent')
    expect(text).toContain('token · 消耗情况')
    expect(text).toContain('缓存命中')
    expect(text).toContain('useProjection')
    expect(text).toContain('openSubagent')
  })

  it('renders tool details itself and never re-declares the shipped seat', () => {
    // Seat declarations are global by name: a duplicate 'conversation.details.tool'
    // declaration crashes ui-conversation at boot.
    expect(text).not.toContain('conversation.details.tool')
    expect(text).toContain('工具调用')
  })

  it('auto-opens the column and offers a reopen button, without fixed positioning', () => {
    expect(text).toContain('openDetails')
    expect(text).toContain(`'conversation.session.header.actions'`)
    expect(text).not.toContain('position:fixed')
  })

  it('reads the fields the snapshot serves', () => {
    for (const field of ['recalled', 'usedIds', 'sessionLearned', 'adrs', 'stages', 'todos', 'openArcs']) {
      expect(text).toContain(`snap.${field}`)
    }
    expect(text).not.toContain('snap.l3')
  })
})

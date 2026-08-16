import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderDashboard } from '../src/dashboard.ts'
import { createLesson } from '../src/lesson.ts'
import { MemoryPersist } from '../src/persist.ts'
import { StudentMemoryRuntime } from '../src/runtime.ts'

describe('renderDashboard', () => {
  it('shows ADR, todo, AI, and L1/L2/L3', () => {
    const isolated = createLesson({
      arcId: 'arc_1', cause: 'Guessed oldText', fixPattern: 'Re-read first',
      contrast: '', doNotApplyWhen: '',
    }, 'isolated')
    const green = createLesson({
      arcId: 'arc_2', cause: 'Stale import', fixPattern: 'Fix the path',
      contrast: '', doNotApplyWhen: '',
    }, 'tests-green')
    const html = renderDashboard({
      updatedAt: '2026-08-16T00:00:00.000Z',
      now: 'ADR ADR-001 Pin L1\ntodo Wire waterfall',
      moves: ['bash error'],
      l2: '## ADR\n\n- ADR-001 accepted Pin L1',
      l1: '## Open arcs\n\n- arc_1',
      l3: [{ id: green.id, summary: `Cause: Stale import\n${green.watermark}` }],
      lessons: [isolated, green],
      adrs: [{ id: 'ADR-001', title: 'Pin L1 to user-role snapshot', status: 'accepted' }],
      todos: [{ id: 't1', adrId: 'ADR-001', content: 'Wire waterfall', status: 'doing' }],
      openArcs: [{ arcId: 'arc_1', openedBy: 'e1', signals: ['tool-error'], consumed: false }],
    })
    expect(html).toContain('ADR')
    expect(html).toContain('ADR-001')
    expect(html).toContain('Pin L1 to user-role snapshot')
    expect(html).toContain('Todo')
    expect(html).toContain('Wire waterfall')
    expect(html).toContain('L2')
    expect(html).toContain('L1')
    expect(html).toContain('L3')
    expect(html).toContain('arc_1')
    expect(html).toContain(green.watermark)
    expect(html).toContain('isolated')
    expect(html).toContain('tests-green')
    expect(html).not.toContain('不是 fork')
    expect(html).not.toContain('选择压')
  })
})

describe('runtime writes dashboard.html', () => {
  it('flushes ADR/todo and layers to disk', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sm-dash-'))
    const dashboardPath = join(dir, 'dashboard.html')
    const runtime = new StudentMemoryRuntime(new MemoryPersist(), {
      dashboardPath,
      watermark: 'STUDENT_MEMORY_WATERMARK',
    })
    await runtime.boot()
    runtime.setAdrs([{ id: 'ADR-001', title: 'See layers', status: 'proposed' }])
    runtime.setTodos([{ id: 't1', adrId: 'ADR-001', content: 'Open dashboard', status: 'doing' }])
    runtime.observeTool({ toolCallId: 'e', toolName: 'bash', isError: true, argsText: 'vitest' })
    await runtime.flushDashboard()
    const html = await readFile(dashboardPath, 'utf8')
    expect(html).toContain('ADR-001')
    expect(html).toContain('See layers')
    expect(html).toContain('Open dashboard')
    expect(html).toContain('STUDENT_MEMORY_WATERMARK')
    expect(html).toContain('L3')
  })
})

import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderDashboard } from '../src/dashboard.ts'
import { createLesson } from '../src/lesson.ts'
import { MemoryPersist } from '../src/persist.ts'
import { StudentMemoryRuntime } from '../src/runtime.ts'

describe('renderDashboard', () => {
  it('shows task view names, not layer codes', () => {
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
      now: 'Pin L1\nWire waterfall',
      moves: ['bash error'],
      workset: '### taskSpec\nGoal: Pin L1',
      lessons: [isolated, green],
      adrs: [{ id: 'ADR-001', title: 'Pin L1 to user-role snapshot', status: 'accepted' }],
      stages: [{ id: 's1', adrId: 'ADR-001', title: 'M1', status: 'doing' }],
      todos: [{ id: 't1', adrId: 'ADR-001', stageId: 's1', content: 'Wire waterfall', status: 'doing' }],
      openArcs: [{ arcId: 'arc_1', openedBy: 'e1', signals: ['tool-error'], consumed: false }],
      recalled: [{ id: green.id, summary: 'Stale import / trust: tests-green' }],
      usedIds: [green.id],
      sessionLearned: [green],
    })
    expect(html).toContain('这轮摊开的卡片')
    expect(html).toContain('舵手')
    expect(html).toContain('潜水')
    expect(html).toContain('深水')
    expect(html).toContain('ADR-001')
    expect(html).toContain('Pin L1 to user-role snapshot')
    expect(html).toContain('Wire waterfall')
    expect(html).toContain(green.id)
    expect(html).toContain('isolated')
    expect(html).toContain('tests-green')
    expect(html).not.toContain('>L0<')
    expect(html).not.toContain('>L1<')
    expect(html).not.toContain('>L2<')
    expect(html).not.toContain('>L3<')
    expect(html).not.toContain('STUDENT_MEMORY_WATERMARK')
    expect(html).not.toContain('不是 fork')
  })
})

describe('runtime writes dashboard.html', () => {
  it('flushes ADR/stage/todo to disk', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sm-dash-'))
    const dashboardPath = join(dir, 'dashboard.html')
    const runtime = new StudentMemoryRuntime(new MemoryPersist(), { dashboardPath })
    await runtime.boot()
    runtime.setAdrs([{ id: 'ADR-001', title: 'See layers', status: 'proposed' }])
    runtime.setStages([{ id: 's1', adrId: 'ADR-001', title: 'Open board', status: 'doing' }])
    runtime.setTodos([{ id: 't1', adrId: 'ADR-001', stageId: 's1', content: 'Open dashboard', status: 'doing' }])
    runtime.observeTool({ toolCallId: 'e', toolName: 'bash', isError: true, argsText: 'vitest' })
    await runtime.flushDashboard()
    const html = await readFile(dashboardPath, 'utf8')
    expect(html).toContain('ADR-001')
    expect(html).toContain('See layers')
    expect(html).toContain('Open dashboard')
    expect(html).toContain('舵手')
  })
})

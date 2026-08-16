import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderDashboard } from '../src/dashboard.ts'
import { createLesson } from '../src/lesson.ts'
import { MemoryPersist } from '../src/persist.ts'
import { StudentMemoryRuntime } from '../src/runtime.ts'

describe('renderDashboard', () => {
  it('shows L2, L1, L3 injection, and lesson columns', () => {
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
      l2: '## Working memory\n\nGoal: ship the board',
      l1: '## Open arcs\n\n- arc_1',
      l3: [{ id: green.id, summary: `Cause: Stale import\n${green.watermark}` }],
      lessons: [isolated, green],
      sessionLearnedIds: [green.id],
      receipt: '这次我学到了这 1 条',
    })
    expect(html).toContain('L2 钉住')
    expect(html).toContain('Goal: ship the board')
    expect(html).toContain('L1 本轮')
    expect(html).toContain('arc_1')
    expect(html).toContain('L3 召回注入')
    expect(html).toContain(green.watermark)
    expect(html).toContain('隔离区')
    expect(html).toContain('测试转绿')
    expect(html).toContain('Guessed oldText')
  })
})

describe('runtime writes dashboard.html', () => {
  it('flushes L1/L2/L3 and the lesson board to disk', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sm-dash-'))
    const dashboardPath = join(dir, 'dashboard.html')
    const persist = new MemoryPersist()
    const runtime = new StudentMemoryRuntime(persist, { dashboardPath, watermark: 'STUDENT_MEMORY_WATERMARK' })
    await runtime.boot()
    runtime.pinned = { workingMemory: 'Goal: see layers' }
    runtime.observeTool({ toolCallId: 'e', toolName: 'bash', isError: true, argsText: 'vitest' })
    runtime.refreshRecall('no-match-zzzz')
    await runtime.flushDashboard()
    const html = await readFile(dashboardPath, 'utf8')
    expect(html).toContain('Goal: see layers')
    expect(html).toContain('STUDENT_MEMORY_WATERMARK')
    expect(html).toContain('本轮没有注入 lesson')
  })
})

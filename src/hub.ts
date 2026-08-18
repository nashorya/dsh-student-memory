import { resolve } from 'node:path'
import { FilePersist, MemoryPersist } from './persist.ts'
import { StudentMemoryRuntime } from './runtime.ts'
import { docPaths } from './docs.ts'
import type { StudentMemoryConfig } from './types.ts'

export class MemoryHub {
  private readonly boards = new Map<string, StudentMemoryRuntime>()
  private readonly booting = new Map<string, Promise<void>>()
  private activeCwd = ''

  constructor(private readonly base: StudentMemoryConfig = {}) {}

  use(workspaceDir: string): StudentMemoryRuntime {
    const key = resolve(workspaceDir)
    this.activeCwd = key
    const existing = this.boards.get(key)
    if (existing) return existing
    const paths = docPaths(key)
    const persist = this.base.persist === 'memory'
      ? new MemoryPersist()
      : new FilePersist(paths.lessons)
    const runtime = new StudentMemoryRuntime(persist, {
      ...this.base,
      workspaceDir: key,
      storePath: paths.lessons,
      dashboardPath: paths.dashboard,
    })
    this.booting.set(key, runtime.boot())
    console.info(`[student-memory] ${paths.dashboard}`)
    this.boards.set(key, runtime)
    return runtime
  }

  async ready(workspaceDir: string): Promise<StudentMemoryRuntime> {
    const runtime = this.use(workspaceDir)
    await this.booting.get(resolve(workspaceDir))
    return runtime
  }

  active(): StudentMemoryRuntime | undefined {
    if (!this.activeCwd) return undefined
    return this.boards.get(this.activeCwd)
  }

  get(workspaceDir: string): StudentMemoryRuntime | undefined {
    return this.boards.get(resolve(workspaceDir))
  }

  list(): Array<{ cwd: string; runtime: StudentMemoryRuntime }> {
    return [...this.boards.entries()].map(([cwd, runtime]) => ({ cwd, runtime }))
  }
}

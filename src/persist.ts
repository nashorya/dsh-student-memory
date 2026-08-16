import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Lesson } from './lesson.ts'
import type { Adr, TodoItem } from './types.ts'

export interface BoardState {
  lessons: Lesson[]
  adrs: Adr[]
  todos: TodoItem[]
}

export interface BoardPersist {
  load(): Promise<BoardState>
  save(state: BoardState): Promise<void>
}

const empty = (): BoardState => ({ lessons: [], adrs: [], todos: [] })

export class MemoryPersist implements BoardPersist {
  constructor(private state: BoardState = empty()) {}

  async load(): Promise<BoardState> {
    return {
      lessons: [...this.state.lessons],
      adrs: [...this.state.adrs],
      todos: [...this.state.todos],
    }
  }

  async save(state: BoardState): Promise<void> {
    this.state = {
      lessons: [...state.lessons],
      adrs: [...state.adrs],
      todos: [...state.todos],
    }
  }
}

export class FilePersist implements BoardPersist {
  constructor(private readonly path: string) {}

  async load(): Promise<BoardState> {
    try {
      const raw = await readFile(this.path, 'utf8')
      const parsed = JSON.parse(raw) as Partial<BoardState> | null
      if (!parsed || typeof parsed !== 'object') return empty()
      return {
        lessons: Array.isArray(parsed.lessons) ? parsed.lessons : [],
        adrs: Array.isArray(parsed.adrs) ? parsed.adrs : [],
        todos: Array.isArray(parsed.todos) ? parsed.todos : [],
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return empty()
      throw err
    }
  }

  async save(state: BoardState): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true })
    await writeFile(this.path, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
  }
}

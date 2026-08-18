import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Lesson } from './lesson.ts'
import type { Adr, L2Pinned, Stage, TodoItem } from './types.ts'

export interface BoardState {
  lessons: Lesson[]
  adrs: Adr[]
  stages: Stage[]
  todos: TodoItem[]
  pinned?: L2Pinned
  archivedKey?: string
}

export interface BoardPersist {
  load(): Promise<BoardState>
  save(state: BoardState): Promise<void>
}

const empty = (): BoardState => ({ lessons: [], adrs: [], stages: [], todos: [], pinned: {}, archivedKey: '' })

function withStageId(todos: TodoItem[]): TodoItem[] {
  return todos.map((todo) => ({
    ...todo,
    stageId: todo.stageId ?? '',
  }))
}

export class MemoryPersist implements BoardPersist {
  constructor(private state: BoardState = empty()) {}

  async load(): Promise<BoardState> {
    return {
      lessons: [...this.state.lessons],
      adrs: [...this.state.adrs],
      stages: [...this.state.stages],
      todos: withStageId(this.state.todos),
      pinned: { ...this.state.pinned },
      archivedKey: this.state.archivedKey ?? '',
    }
  }

  async save(state: BoardState): Promise<void> {
    this.state = {
      lessons: [...state.lessons],
      adrs: [...state.adrs],
      stages: [...state.stages],
      todos: withStageId(state.todos),
      pinned: { ...state.pinned },
      archivedKey: state.archivedKey ?? '',
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
        stages: Array.isArray(parsed.stages) ? parsed.stages : [],
        todos: withStageId(Array.isArray(parsed.todos) ? parsed.todos : []),
        pinned: parsed.pinned && typeof parsed.pinned === 'object' ? parsed.pinned : {},
        archivedKey: typeof parsed.archivedKey === 'string' ? parsed.archivedKey : '',
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

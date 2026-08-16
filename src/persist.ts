import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Lesson } from './lesson.ts'

export interface LessonPersist {
  load(): Promise<Lesson[]>
  save(lessons: Lesson[]): Promise<void>
}

export class MemoryPersist implements LessonPersist {
  constructor(private rows: Lesson[] = []) {}

  async load(): Promise<Lesson[]> {
    return [...this.rows]
  }

  async save(lessons: Lesson[]): Promise<void> {
    this.rows = [...lessons]
  }
}

export class FilePersist implements LessonPersist {
  constructor(private readonly path: string) {}

  async load(): Promise<Lesson[]> {
    try {
      const raw = await readFile(this.path, 'utf8')
      const parsed = JSON.parse(raw) as { lessons?: Lesson[] }
      return Array.isArray(parsed.lessons) ? parsed.lessons : []
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw err
    }
  }

  async save(lessons: Lesson[]): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true })
    await writeFile(this.path, `${JSON.stringify({ lessons }, null, 2)}\n`, 'utf8')
  }
}

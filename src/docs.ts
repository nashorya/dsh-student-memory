import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const BOARD_DIR_NAME = '.dsh-student-memory'

export const INDEX_FILE = 'INDEX.md'
export const ADR_FILE = 'ADR.md'
export const BUGLOG_FILE = 'buglog.md'

const INDEX_STUB = `# Index

## ADR

（还没有）

## Buglog

（还没有）

## Status

未开始
`

const ADR_STUB = `# ADR

按时间倒序记录本工作区的决策。每条请求或规划必须先有 ADR。
`

const BUGLOG_STUB = `# Buglog

按时间倒序记录缺陷与修复。
`

export interface WorkspaceDocs {
  index: string
  adr: string
  buglog: string
}

export function boardDir(workspaceDir: string): string {
  return join(workspaceDir, BOARD_DIR_NAME)
}

export function docPaths(workspaceDir: string): { index: string; adr: string; buglog: string; lessons: string; dashboard: string } {
  const dir = boardDir(workspaceDir)
  return {
    index: join(dir, INDEX_FILE),
    adr: join(dir, ADR_FILE),
    buglog: join(dir, BUGLOG_FILE),
    lessons: join(dir, 'lessons.json'),
    dashboard: join(dir, 'dashboard.html'),
  }
}

async function readOr(path: string, fallback: string): Promise<string> {
  try {
    return await readFile(path, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return fallback
    throw err
  }
}

export async function loadWorkspaceDocs(workspaceDir: string): Promise<WorkspaceDocs> {
  const paths = docPaths(workspaceDir)
  await mkdir(boardDir(workspaceDir), { recursive: true })
  const docs = {
    index: await readOr(paths.index, INDEX_STUB),
    adr: await readOr(paths.adr, ADR_STUB),
    buglog: await readOr(paths.buglog, BUGLOG_STUB),
  }
  await Promise.all([
    writeFile(paths.index, docs.index, 'utf8'),
    writeFile(paths.adr, docs.adr, 'utf8'),
    writeFile(paths.buglog, docs.buglog, 'utf8'),
  ])
  return docs
}

export async function writeIndex(workspaceDir: string, content: string): Promise<void> {
  const paths = docPaths(workspaceDir)
  await mkdir(boardDir(workspaceDir), { recursive: true })
  await writeFile(paths.index, content.trimEnd() + '\n', 'utf8')
}

export async function writeAdrDoc(workspaceDir: string, content: string): Promise<void> {
  const paths = docPaths(workspaceDir)
  await mkdir(boardDir(workspaceDir), { recursive: true })
  await writeFile(paths.adr, content.trimEnd() + '\n', 'utf8')
}

export async function prependAdr(workspaceDir: string, entry: string): Promise<string> {
  const paths = docPaths(workspaceDir)
  await mkdir(boardDir(workspaceDir), { recursive: true })
  const current = await readOr(paths.adr, ADR_STUB)
  const rest = current.replace(/^# ADR\s*/, '').trimStart()
  const next = `# ADR\n\n${entry.trim()}\n${rest ? `\n${rest}` : ''}\n`
  await writeFile(paths.adr, next, 'utf8')
  return next
}

export async function prependBuglog(workspaceDir: string, entry: string): Promise<string> {
  const paths = docPaths(workspaceDir)
  await mkdir(boardDir(workspaceDir), { recursive: true })
  const current = await readOr(paths.buglog, BUGLOG_STUB)
  const rest = current.replace(/^# Buglog\s*/, '').trimStart()
  const next = `# Buglog\n\n${entry.trim()}\n${rest ? `\n${rest}` : ''}\n`
  await writeFile(paths.buglog, next, 'utf8')
  return next
}

export function formatAdrEntry(input: {
  id: string
  title: string
  context: string
  decision?: string
  status: string
  at: string
}): string {
  const decision = input.decision?.trim() || '待实施'
  return [
    `## ${input.id} · ${input.title}`,
    '',
    `- 状态: ${input.status}`,
    `- 时间: ${input.at}`,
    `- 背景: ${input.context.trim()}`,
    `- 决策: ${decision}`,
    '',
  ].join('\n')
}

export function formatBugEntry(input: {
  title: string
  detail: string
  status: string
  at: string
}): string {
  return [
    `## ${input.at} · ${input.title}`,
    '',
    `- 状态: ${input.status}`,
    '',
    input.detail.trim(),
    '',
  ].join('\n')
}

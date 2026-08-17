/** Plugins whose history policy fights student-agent. Disabled when we mount. */
export const EXCLUDED_PLUGINS = [
  { id: 'compaction-basic', names: ['@deepseek-ai/dsh-compaction-basic'] },
  { id: 'command-compact', names: ['@deepseek-ai/dsh-command-compact'] },
] as const

export interface LoaderEntry {
  id?: string
  disabled?: boolean
  options?: { id?: string; name?: string }
  update(options: { disabled: boolean }): Promise<unknown>
}

export function matchesExcluded(entry: {
  id?: string
  options?: { id?: string; name?: string }
}): boolean {
  const id = entry.options?.id ?? entry.id ?? ''
  const name = entry.options?.name ?? ''
  return EXCLUDED_PLUGINS.some((item) => (
    id === item.id
    || id.endsWith(`/${item.id}`)
    || (item.names as readonly string[]).includes(name)
  ))
}

export async function excludeConflictingPlugins(
  ctx: { loader?: { entries(): Iterable<LoaderEntry> } },
): Promise<string[]> {
  const loader = ctx.loader
  if (!loader?.entries) return []
  const disabled: string[] = []
  for (const entry of loader.entries()) {
    if (!matchesExcluded(entry) || entry.disabled) continue
    await entry.update({ disabled: true })
    disabled.push(entry.options?.id ?? entry.id ?? '')
  }
  return disabled
}

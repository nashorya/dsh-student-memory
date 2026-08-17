import { describe, expect, it } from 'vitest'
import { excludeConflictingPlugins, matchesExcluded } from '../src/exclude.ts'
import { apply } from '../src/index.ts'

describe('matchesExcluded', () => {
  it('matches compaction-basic by id or package name', () => {
    expect(matchesExcluded({ options: { id: 'compaction-basic' } })).toBe(true)
    expect(matchesExcluded({ id: 'group/compaction-basic' })).toBe(true)
    expect(matchesExcluded({ options: { name: '@deepseek-ai/dsh-compaction-basic' } })).toBe(true)
    expect(matchesExcluded({ options: { id: 'token-meter' } })).toBe(false)
  })
})

describe('excludeConflictingPlugins', () => {
  it('disables competing history plugins and leaves others', async () => {
    const updates: string[] = []
    const entries = [
      {
        options: { id: 'compaction-basic', name: '@deepseek-ai/dsh-compaction-basic' },
        disabled: false,
        async update() { updates.push('compaction-basic') },
      },
      {
        options: { id: 'command-compact', name: '@deepseek-ai/dsh-command-compact' },
        disabled: false,
        async update() { updates.push('command-compact') },
      },
      {
        options: { id: 'token-meter' },
        disabled: false,
        async update() { updates.push('token-meter') },
      },
    ]
    const disabled = await excludeConflictingPlugins({ loader: { entries: () => entries } })
    expect(disabled.sort()).toEqual(['command-compact', 'compaction-basic'])
    expect(updates.sort()).toEqual(['command-compact', 'compaction-basic'])
  })
})

describe('apply excludes competitors', () => {
  it('asks the loader to disable compaction-basic on boot', async () => {
    const updates: string[] = []
    const ctx = {
      tools: { register() { return () => {} } },
      systemPrompt: {
        section() { return () => {} },
        context() { return () => {} },
      },
      on() { return () => {} },
      loader: {
        entries: () => [{
          options: { id: 'compaction-basic', name: '@deepseek-ai/dsh-compaction-basic' },
          disabled: false,
          async update() { updates.push('compaction-basic') },
        }],
      },
    }
    apply(ctx, { persist: 'memory' })
    await Promise.resolve()
    await Promise.resolve()
    expect(updates).toEqual(['compaction-basic'])
  })
})

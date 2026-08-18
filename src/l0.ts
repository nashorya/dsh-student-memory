import { CACHE_PREFIX_BREAKPOINT } from './types.ts'

const CONTRACT = `### workspaceBoardContract
- 无论用户给的是规划还是具体要求，先调用 propose_adr，再做别的事。
- 没有覆盖本请求的 ADR 时，禁止写代码、改文件或展开实施步骤。
- 必须持续维护本工作区的 INDEX.md、ADR.md、buglog.md（用 update_index / propose_adr / append_buglog）。
- 缺陷、回归、失败的修复写入 buglog；INDEX 保持 ADR 与缺陷目录最新。
- 经验只通过 write_lesson 写；只填语义字段；arcId 必须来自当前开放弧列表，禁止编造。
- 空 cause 或空 fixPattern 会被拒绝。fixPattern 禁止写成「接着调用了某某工具」。`.trim()

export function renderL0(): string {
  return `${CONTRACT}\n\n${CACHE_PREFIX_BREAKPOINT}`
}

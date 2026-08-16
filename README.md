# dsh-student-memory

dsh 插件。lesson 记忆、L1/L2/L3、ADR、Todo。

上游钉死 `47f943859bef60e4160492346772ded9b24f765a`。安装见 [INSTALL.md](./INSTALL.md)。

## 现在能做什么

| 层 | 行为 |
|---|---|
| L2 | `systemPrompt.section` 钉住 working memory / ledger |
| L1 | `systemPrompt.context` 每轮重建的 user-role 快照（open arcs、召回、收割提醒） |
| 预算 | `system-prompt/assemble` 只裁 L1 |
| 弧线 | `tools/result` 上错误开弧、签发 `arcId`；测试转绿 / tsc 记到弧上 |
| write_lesson | 模型只填语义；必须引用仍开放的 `arcId`；空 cause/fix 不落盘 |
| 判据 | tests 红转绿 → 晋升；tsc/CI → 次级晋升；无信号 → 隔离区 |
| 召回 | 词重叠，空渲染不注入；摘要带 `⟦sm:id⟧` 水印 |
| 小票 | `runtime.receipt()` / `runtime.sidebar()`：学到什么、验证到哪一档 |
| 看板 | 启动目录下 `.dsh-student-memory/dashboard.html`：AI / L1 L2 L3 / ADR / Todo / lesson |
| 落盘 | `.dsh-student-memory/lessons.json` |

还没有独立 React 侧栏组件（ui-slots 要 React 声明合并）。侧栏文案已经能渲染，Web 面板等宿主槽位稳定再挂。

## 开发

```sh
cd /Users/juejuezi/dsh-plugin-v1/student-memory
pnpm test
```

# dsh-student-memory

DeepSeek Harness 社区插件：把 student-agent 的 **选择压**（L1/L2 分层、lesson 准入、会话小票）带进 dsh。不 fork dsh，不改它的核心包。

> 钉死上游：`deepseek-harness` @ `47f943859bef60e4160492346772ded9b24f765a`（见仓库旁 `/Users/juejuezi/dsh-plugin-v1/PIN.md`）。peer 范围 `>=0.1.0-rc.5 <0.2.0`。上游周抛，升主版本再动。

## 现状（v1 / M1）

- **L2** → `ctx.systemPrompt.section('student-memory:l2')`（order 50）
- **L1** → `ctx.systemPrompt.context('student-memory:l1')`（order 200，user-role snapshot，每轮重建并 supersede）
- **预算** → `system-prompt/assemble` waterfall 只裁 L1
- 默认水印 `STUDENT_MEMORY_WATERMARK`（P0 活体验证用；可关）
- **还没有** write_lesson / 弧线 / 小票（M2–M4）

P0 证据：`../SPIKE.md` 或 `student-agent/.scratch/dsh-plugin-spike/notes.md`。

## 开发

```sh
cd /Users/juejuezi/dsh-plugin-v1/student-memory
pnpm add -D vitest typescript @types/node
pnpm test
```

## 挂进本机 dsh（源码 checkout）

```sh
# 在 /Users/juejuezi/dsh-plugin-v1/deepseek-harness
pnpm dsh web --patch /Users/juejuezi/dsh-plugin-v1/student-memory/dev.patch.yml
```

`dev.patch.yml` 用绝对路径指向本包 `src/index.ts`。

# dsh-student-memory

DeepSeek Harness 的学生记忆插件。模型每轮只看见一份 L1 工作集；任务图、旧经验和用量在界面上分栏看。

钉死上游：dsh `47f943859bef60e4160492346772ded9b24f765a`（0.1.0-rc.5 线）。

## 安装

本机已装 dsh、能跑 `dsh web`：

```sh
dsh plugin --profile web add github:nashorya/dsh-student-memory
```

装完重启 web：

```sh
dsh web
```

卸掉：

```sh
dsh plugin --profile web remove dsh-student-memory
```

从源码 checkout 装（开发）：

```sh
dsh plugin --profile web add /path/to/dsh-student-memory
```

Git 源码安装时，pnpm ≥10 可能拦住 `prepare`。按提示把 `allowBuilds` 写进 `~/.dsh/profiles/web/pnpm-workspace.yaml`，再跑一次 `add`。

装上后会关掉 `compaction-basic` 和 `command-compact`，避免旧轮次被卷进摘要。

## 界面

打开一个会话：

- **左栏**：ADR → 阶段 → 待办，按已完成 / 当前工作 / 下一步排。顶部「会话」折叠里还能换会话。
- **中间**：dsh 原生对话。
- **右栏**：子 agent、海上 SVG（捞是取用，沉是写入）、token 消耗（输入 / 输出 / 缓存命中）、本拍状态和工具调用。

会话头上有「舵手」按钮，关掉右栏后可以再打开。看板页也可以直接开：`http://127.0.0.1:3080/student-memory`。

## 模型侧

| 块 | 作用 |
|---|---|
| L0 | `write_lesson` 合同，静态 system 前缀 |
| L1 | 唯一进模型的工作集：目标、阶段、当前步骤、硬约束、任务摘要、开放弧、短卡片 |
| `plan_step` | 给一个阶段整段写 todolist |
| `write_lesson` | 先错后改对之后记一条经验，必须带开放的 `arcId` |

回路：工具报错开弧 → 摊开短卡片 → 测试或 tsc/CI 转绿提醒一次 `write_lesson` → 弧消费、卡片撤走。没有测试也能写，小票会标「还在隔离区」。

数据落在启动目录的 `.dsh-student-memory/lessons.json`。

## 开发

```sh
pnpm install
pnpm test
pnpm typecheck
```

设计稿和实现顺序在 [docs/v1-plan.md](./docs/v1-plan.md)。

## 许可

MIT

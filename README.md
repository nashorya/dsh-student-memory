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

装上后会关掉 `compaction-basic` 和 `command-compact`。对话历史在任务进行中（含暂停/继续）全部保留；只有当前 ADR 的待办都完成后，才把摘要写入 L2 并丢掉已完成任务的旧轮次。

## 界面

打开一个会话：

- **左栏**：ADR → 阶段 → 待办，按已完成 / 当前工作 / 下一步排。顶部「会话」折叠里还能换会话。
- **中间**：dsh 原生对话。
- **右栏**：子 agent、海上 SVG（捞是取用，沉是写入）、token 消耗（输入 / 输出 / 缓存命中）、本拍状态和工具调用。

会话头上有「舵手」按钮，关掉右栏后可以再打开。看板页也可以直接开：`http://127.0.0.1:3080/student-memory`。

## 模型侧

| 块 | 作用 |
|---|---|
| L0 | 合同：每条规划/要求先 `propose_adr`；持续维护 INDEX / ADR / buglog；`write_lesson` 语义约束 |
| L1 | 唯一进模型的工作集；无覆盖本请求的 ADR 时注入 `adrRequired` |
| `propose_adr` | 先记 ADR，再实施 |
| `update_index` | 重写本工作区 `INDEX.md` |
| `append_buglog` | 追加本工作区 `buglog.md` |
| `plan_step` | 给一个阶段整段写 todolist（需已有 ADR） |
| `write_lesson` | 先错后改对之后记一条经验，必须带开放的 `arcId` |

回路：用户消息 → 先 `propose_adr` → `plan_step` / 实施 → 缺陷进 buglog → INDEX 保持目录最新。经验回路仍是：工具报错开弧 → 摊开短卡片 → 转绿提醒 `write_lesson`。

每个工作区各自落盘：`{workspace}/.dsh-student-memory/`（`INDEX.md`、`ADR.md`、`buglog.md`、`lessons.json`、`dashboard.html`）。看板：`/student-memory?workspace=<绝对路径>`。

## 开发

```sh
pnpm install
pnpm test
pnpm typecheck
```

设计稿和实现顺序在 [docs/v1-plan.md](./docs/v1-plan.md)。

## 许可

MIT

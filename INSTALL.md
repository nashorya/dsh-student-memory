# 安装（给在有测试的仓库里用 dsh 的人）

钉死上游：`deepseek-harness` @ `47f943859bef60e4160492346772ded9b24f765a`。上游还在 rc，插件 peer 写成 `>=0.1.0-rc.5 <0.2.0`。升主版本再动。

## 你是谁

第一批用户：用 dsh **code preset**、仓库里**有测试**的人。插件靠测试红转绿给 lesson 盖章。没有测试也能用，只是记下的东西会进隔离区。

## 没有验证信号时我是什么

能用的笔记本，不是死掉的质检机。没有红转绿、没有 tsc/CI，lesson 仍可写，但小票会写明「还在隔离区」。我不会假装已经验证过。

## 源码挂载（开发 / dogfood）

本机已做过一遍：

```sh
cd /Users/juejuezi/dsh-plugin-v1/deepseek-harness
pnpm install
pnpm run build          # lib + web frontend；缺 lib/ 或 dist/ 会起不来
pnpm dsh plugin --profile web add /Users/juejuezi/dsh-plugin-v1/student-memory
pnpm dsh web            # 已验证 http://127.0.0.1:3080 200，插件在 compose 树里
```

`--patch` 开发热路径仍然可用：

```sh
pnpm dsh web --patch /Users/juejuezi/dsh-plugin-v1/student-memory/dev.patch.yml
```

看板：启动 dsh 时的当前目录 `.dsh-student-memory/dashboard.html`

两栏：ADR（需求）、Todo（该 ADR 下的计划）。另有 AI / L1 / L2 / L3。浏览器打开，约 4 秒刷新。

## 以后用 bundle

`package.json` 已声明 `dsh.bundle.patch`。等你愿意发 npm / `dsh plugin add` 时，用 `cordis.patch.yml`，不必再改核心。

## Dogfood 回路（M5）

在一个有 `pnpm test` / `vitest` / `pytest` 的仓库：

1. 故意写错再改对，跑测试：红 → 绿。
2. 上下文里应出现 `Open arcs` 和 `arc_…`。
3. 调 `write_lesson`（只填语义，`arcId` 抄开放弧）。
4. 会话结束看小票：转绿的那条应写「有测试转绿背书」。
5. 下一轮相关任务，L1 Recall 里应出现带 `⟦sm:lesson_…⟧` 的注入。

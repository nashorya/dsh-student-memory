# 安装（给在有测试的仓库里用 dsh 的人）

钉死上游：`deepseek-harness` @ `47f943859bef60e4160492346772ded9b24f765a`。上游还在 rc，插件 peer 写成 `>=0.1.0-rc.5 <0.2.0`。升主版本再动。

## 你是谁

第一批用户：用 dsh **code preset**、仓库里**有测试**的人。插件靠测试红转绿给 lesson 盖章。没有测试也能用，只是记下的东西会进隔离区。

## 没有验证信号时我是什么

能用的笔记本，不是死掉的质检机。没有红转绿、没有 tsc/CI，lesson 仍可写，但小票会写明「还在隔离区」。我不会假装已经验证过。

## 源码挂载（开发 / dogfood）

```sh
# 1. 本机已有钉死的 dsh
cd /Users/juejuezi/dsh-plugin-v1/deepseek-harness
pnpm install   # 只需做一次

# 2. 在一个带测试的真实仓库里打开 Web
pnpm dsh web --patch /Users/juejuezi/dsh-plugin-v1/student-memory/dev.patch.yml
```

可选：在 `dev.patch.yml` 里加 `storePath`，lesson 落到该 JSON，下次会话从磁盘重建。

## 以后用 bundle

`package.json` 已声明 `dsh.bundle.patch`。等你愿意发 npm / `dsh plugin add` 时，用 `cordis.patch.yml`，不必再改核心。

## Dogfood 回路（M5）

在一个有 `pnpm test` / `vitest` / `pytest` 的仓库：

1. 故意写错再改对，跑测试：红 → 绿。
2. 上下文里应出现 `Open arcs` 和 `arc_…`。
3. 调 `write_lesson`（只填语义，`arcId` 抄开放弧）。
4. 会话结束看小票：转绿的那条应写「有测试转绿背书」。
5. 下一轮相关任务，L1 Recall 里应出现带 `⟦sm:lesson_…⟧` 的注入。

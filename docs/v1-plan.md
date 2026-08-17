# student-memory v1 实施计划

状态：可开工（讨论稿 v2 第 8 节已全部裁决，裁决记录见下）  
日期：2026-08-16  
上游：dsh 钉死 `47f9438`；单通道注入已由根目录 SPIKE 验证

---

## 0. 第 8 节裁决记录

| # | 事项 | 裁决 |
|---|---|---|
| 8.1 | 写入触发 | 删除 `turn-stopping` 每轮催收。只在开放弧第一次挂上 `tests-green` / `tsc-ci` 时提醒一次（`observeTool` 现有 `closedGreen` 路径保留）。无绿灯的弧只在产品面显示状态 |
| 8.2 | isolated | 全部进菜单，不过滤。本会话新写的排最前，其余按新近。trust 只是标签 |
| 8.3 | 匹配键 | v1 不建 `Lesson.errorSignature`、不做签名匹配。`Arc.errorText` 照存（`resultText` 截 400 字）。召回 = 全库短卡片摊开，不做检索 |
| 8.4 | trust 判定 | `classifyObservation` 正则不修。trust 降级为纯展示标签，不承担任何筛选/门槛职责 |
| 8.5 | 预算 | 从设计里拿掉。装配按内容，不做块级仲裁、不设卡片条数上限。保留一个宽松的安全截断（12000 字符）防病态膨胀 |
| 8.6 | 验收 | 三条轨迹回放（见第 4 节），不做 20 条对照表 |
| 8.7 | 取数工具 | v1 不做 `fetch_context`。卡片自带刃和边界，先看真实轨迹再定 |

新增裁决（原型讨论产出）：

| # | 事项 | 裁决 |
|---|---|---|
| A | 任务层级 | ADR → 阶段（新实体）→ todo 三层。`TodoItem` 加 `stageId` |
| B | 第一个 L2 写入工具 | `plan_step`：模型进入一个阶段时写该阶段的 todolist，做完翻勾。用户手动改走同一份数据 |
| C | 产品面 | 不提 L1/L2/L3。命名用「舵手 · 本拍工作集 / 潜水 · 任务状态 / 深水 · 过往经验」。催收原文、弧编号、水印不上屏 |

---

## 1. 目标形态（一条回路）

```
工具报错
  → 开弧，存 errorText
  → 全库 lesson 短卡片摊进 L1（本会话新写在前）
  → 模型认亲：用则按它改，不用则过
  → 弧挂上 tests-green / tsc-ci → 一次性提醒 write_lesson
  → 模型写短因果（禁止「接着调用了 X」当 fixPattern）
  → 弧消费，卡片撤下，书沉深水
```

模型每拍看见的 L1（单通道，顺序固定）：

```
### taskSpec        goal（ADR 标题）/ phase（当前阶段）/ currentStep（doing 的 todo）
### hardConstraints （有则出现）
### l2Summary       结构渲染：workingMemory / taskLedger / 当前阶段 todolist / recentErrors
### openArcs        开放弧 id + （仅绿灯关合那一拍）一次催收
### lessons         短卡片：[id] cause 第一句 / Do not apply when / trust 标签
```

L0（system section）只剩静态合同：write_lesson 规则 + 禁止编 arcId + cache breakpoint。

---

## 2. 代码改动（按文件）

| 文件 | 改动 |
|---|---|
| `types.ts` | 加 `Stage { id, adrId, title, status }`；`TodoItem` 加 `stageId`；删 `L2_CONTEXT` / `L3_CONTEXT` 常量及 order；安全截断常量 `L1_SAFETY_CHARS = 12000` |
| `l0.ts` | 只渲染 writeLessonContract + breakpoint。`openArcs` / `harvest` / `watermark` 参数全部移除 |
| `l1.ts` | 渲染上表五块。卡片渲染函数放这里（cause 第一句 + doNotApplyWhen + trust 标签） |
| `l2.ts` | 保留，改为 L1 内部的 `l2Summary` 渲染器（不再单独注入）；增加当前阶段 todolist |
| `l3.ts` | 删除（引用纪律一句并进卡片块头部） |
| `assemble.ts` | `deriveL1` 增加 phase（doing 的 stage）；`assembleLayers` 输出收成 `{ l0, l1 }` |
| `arc.ts` | `Arc` 加 `errorText`；`applyObservation` 开弧时截 `resultText` 前 400 字写入 |
| `recall.ts` | 删 query 打分注入路径；改为 `lessonCards(lessons, sessionIds)`：全库、会话新写在前、按 createdAt 降序 |
| `runtime.ts` | `observeTool`：新开弧 → 重建 `lastRecall`（卡片）；弧消费或再开弧时更新。删 `requestHarvest` 及 `turn-stopping` 用法。`recordLesson` 成功 → 撤当前卡片。`setStages` / stage 持久化 |
| `tool.ts` | `write_lesson` 不改。新增 `plan_step` 工具：`{ stageId, todos: [{ content, status }] }`，整段替换该阶段 todolist |
| `index.ts` | 只注册 L0 section + 一路 L1 context；删 L2/L3 注册；删 `turn-stopping` 监听；安全截断用 `L1_SAFETY_CHARS` |
| `persist.ts` | `BoardState` 加 `stages` |
| `budget.ts` | `truncateL1` 保留当兜底；`applyL1Budget` 相应收窄 |
| `dashboard.ts` / `receipt.ts` | 去层名，改任务视角：目标、ADR+阶段+todo、最近动作（moves）、学到了什么（trust 标签）、这轮用上了哪条（`[[used_recall:]]` 解析已有）、「先错后改还没记」状态 |

不动：`write-lesson.ts` 校验、`verdict.ts`、`history.ts` / `surface-policy.ts`（跨轮摘除）、`exclude.ts`。

---

## 3. 顺序

1. **M1 单通道**：`types` → `l0` → `l1`/`l2` → `assemble` → `index`。此刻功能等价迁移，测试全绿。
2. **M2 回路**：`arc.errorText` → `recall` 卡片 → `runtime`（开弧摊卡、绿灯一次提醒、删催收）→ `tool.plan_step` → `persist.stages`。
3. **M3 产品面**：`dashboard` / `receipt` 任务视角；海图状态接 runtime（idle / 捞 / 沉 / 浮标 = 开放弧）。
4. **M4 验收**：第 4 节三条回放 + 回归测试。

M1、M2 各一次提交，可独立回滚。M3 不阻塞 M2 验收。

---

## 4. 验收（vitest，MemoryPersist 模拟轨迹）

1. **该用**：库中有一条对得上的 lesson，模拟同类报错 → 卡片出现在 L1；模拟模型引用 `[[used_recall:id]]` → receipt 记到「用上了」。
2. **不该用**：库中只有明显不相关的一条 → 卡片可出现，模型不引用时不产生任何强制动作或提示。
3. **空库**：无 lesson → L1 无 lessons 块；turn 结束不出现任何催收文本。

回归：L0 文本在有/无开放弧时字节一致（静态性）；只注册一路 context；绿灯只提醒一次、`turn-stopping` 不再催；卡片排序会话新写在前；`plan_step` 写入后 `deriveL1.currentStep` 跟随 doing todo。

---

## 5. 明确不做（v1）

`fetch_context`、`errorSignature` 匹配、embedding / Memorix、gene、分类、trust 正则修复、块级预算仲裁、卡片条数上限、跨轮召回缓存（弧未消费则卡片自然存续，即 8.6 之外不另建机制）。

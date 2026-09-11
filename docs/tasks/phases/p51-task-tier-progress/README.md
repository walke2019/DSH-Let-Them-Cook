# P51 — 快速任务 / 长任务分层与进度展示

## 背景

P50 真实多人链路已经跑通，但完整 `commander -> researcher -> commander` 约 240 秒。用户需要“可用性更强”：小问题不要每次都进入长工作流，大任务仍然保留多 Agent 自由度和 workflow 并发。

## 实现策略

### 快速任务（默认）

- Composer 默认选择 `快活 / Quick`。
- 有明确 `@角色`：只唤醒被点名角色，最多 2 个，避免工作流 fan-out。
- 没有 `@角色`：只唤醒主 Agent，由主 Agent 做极短判断或追问。
- 适合：问答、小修改、快速确认、单角色检查。

### 长任务

- 用户切换为 `长活 / Long`。
- 保留现有 `workflow_driven`、阶段内多 Agent 并发、SubAgent mailbox 上报、主 Agent 汇总。
- 适合：完整项目开发、调研+实现+QA+文档、多阶段验收。

### 进度展示

- Agent 状态浮窗显示任务层级：快活/长活。
- running 状态展示已耗时 / 预计耗时。
- running 状态展示轻量进度条，帮助用户理解“还在跑，不是卡死”。
- 后端 assignment 写入 `taskTier` 与 `expectedMs`，HUD/账本可继续扩展展示。

## 设计取舍

- 不取消 DSH workflow 多 Agent 并发能力；只是把默认入口改得更省、更快。
- 快速任务不冒充完整工程流程；长任务才进入完整 workflow。
- 不修改 DSH 核心源码，仍然是插件内 API、assignment、agent status 与前端组件协作。

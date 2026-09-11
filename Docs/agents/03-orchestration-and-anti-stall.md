# 03 - 调度编排、防死循环与自愈机制 (Orchestration & Anti-Stall)

本文档规范多智能体协同调度、死锁防范、看门狗超时报警信机制与任务预算控制。

---

## 1. 核心契约与铁律

### 1.1 Universal Master Handoff（完工必回主控）
- 所有由 Commander 派发给 SubAgent 专员（如 `researcher`、`backend`、`frontend`、`qa`、`writer`）的任务，在其执行完毕或遇到错误后，调度引擎强制将下一步发言人设为 `commander`；
- 严禁专员之间擅自无休止私下互转或自激致谢（如“赞同方案”、“感谢支持”），所有交付汇总与收口权归主控。
- 详见：[docs/tasks/phases/p81-workflow-commander-delegation/README.md](../tasks/phases/p81-workflow-commander-delegation/README.md)、[docs/tasks/phases/p87-dialog-continuity-and-stall-prevention/README.md](../tasks/phases/p87-dialog-continuity-and-stall-prevention/README.md)。

### 1.2 阶段流转双语模糊语义识别
- 用户或 Commander 推进工作流阶段时，支持双语模糊识别（包括“通过”、“批准”、“进入下一阶段”、“Approved”、“Proceed”、“LGTM”等）；
- 识别成功后自动推进至下一阶段 DAG，避免严格模式造成的卡顿停滞；
- 详见：[docs/tasks/phases/p87-dialog-continuity-and-stall-prevention/README.md](../tasks/phases/p87-dialog-continuity-and-stall-prevention/README.md)。

### 1.3 任务看门狗超时机制与报警信自愈
- 对每个 member turn 运行设置超时监控；
- 超时后触发看门狗（Watchdog），自动向 Commander 发送报警信（Alarm Mailbox Message），并将任务标记为 `failed: timeout`，由 Commander 自主决策重试或降级；
- 详见：[docs/tasks/phases/p62-runtime-agent-watchdog/README.md](../tasks/phases/p62-runtime-agent-watchdog/README.md)、[docs/tasks/phases/p63-assignment-watchdog-timeout/README.md](../tasks/phases/p63-assignment-watchdog-timeout/README.md)。

### 1.4 Agent turn surface fallback 兼容降级
- 当某些模型或宿主环境缺失显式 `turn/end` 事件时，通过 `session.deriveMessages()` 提取 assistant 最新文本作为降级保底，杜绝中央流无回复假死；
- 详见：[docs/tasks/phases/p78-agent-turn-surface-fallback/README.md](../tasks/phases/p78-agent-turn-surface-fallback/README.md)。

### 1.5 长任务动态 24 轮预算与任务分层
- 快速任务（quick）走单轮短平快链路；
- 复杂项目任务进入 `workflow_driven`，单次大任务交互预算动态扩容至 24 轮，支持深度协作闭环；
- 详见：[docs/tasks/phases/p51-task-tier-progress/README.md](../tasks/phases/p51-task-tier-progress/README.md)、[docs/tasks/phases/p87-dialog-continuity-and-stall-prevention/README.md](../tasks/phases/p87-dialog-continuity-and-stall-prevention/README.md)。

### 1.6 DAG 阶段门禁与 verifyCommand 测试验收
- 工作流每个任务节点可绑定 `verifyCommand`（如 `npm run test:xxx`）和 `qualityContract` 质量契约；
- Commander 在审核通过前必须核验自动化验收命令的执行退出码，确保交付质量真实可靠；
- 详见：[docs/tasks/phases/p2-workflow-task-dag-quality-gate/README.md](../tasks/phases/p2-workflow-task-dag-quality-gate/README.md)。

---

## 2. 自动化回归命令
- `npm run test:workflow-commander-delegation` — 主控分派与回传回归
- `npm run test:dialog-continuity` — 对话连续性与防死锁回归
- `npm run test:runtime-agent-watchdog` — 运行时看门狗回归
- `npm run test:agent-turn-surface-fallback` — 消息兜底降级回归
- `npm run test:real-moderator-loop` — 真实多人链路全周期回归

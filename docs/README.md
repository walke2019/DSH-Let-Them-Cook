# DSH Let Them Cook — 中文技术文档索引

本仓库采用 Agent 原生、契约优先的架构，并将项目文档总量控制在 15 个文件以内。

## 命名契约

- 唯一可安装、发布和注册到 DSH profile 的包名：`@dsh-external/dsh-let-them-cook`。
- `dsh-group-chat` 仅作为内部运行时命名空间，用于 `/dsh-group-chat/api/...`、`.pm-workflow/dsh-group-chat/`、`dsh-group-chat-orchestrator` 以及 CSS/data marker。
- `@dsh-external/dsh-group-chat` 绝不是可安装或可注册的包名。

## 当前运行时契约

- UI 仅使用 DSH 原生右侧栏：guide 元数据、`sidebarRightTabs`、`sidebar.right.pane.tab` 和 `sidebar.right.pane.tab.title`。
- 只能由用户显式打开，插件绝不自动打开。
- 不提供中间会话视图、Overlay、浮动 HUD、自定义缩放/布局操作或视图生命周期适配器。
- 终态 Assignment 解析精确 live parent Agent，调用 `ctx.subagents.start('spawn', ...)`，等待 `SubagentRun.result`，并在 `finally` 中执行 dispose。
- 房间状态持久化于工作区 `.pm-workflow/dsh-group-chat/`；禁止插件私有房间状态 Session 事件。
- 原生 `tool-workflow` run/agent start/end 事件在成功、失败和取消路径严格一次闭合。
- 活跃 Assignment 按 `ownerRoleId + stageId + workflowTaskId` 去重；失败的 system-healer 会消费触发它的相关未读报告。

## 长效文档

- [`README.md`](../README.md) — 英文产品与安装指南。
- [`AGENTS.md`](../AGENTS.md) — 工程宪章。
- [`agents/01-ui-and-lifecycle.md`](./agents/01-ui-and-lifecycle.md) — 原生右侧栏 UI 与生命周期。
- [`agents/02-tools-and-ledger.md`](./agents/02-tools-and-ledger.md) — 原生工具、证据与 Workflow 账本。
- [`agents/03-orchestration-and-anti-stall.md`](./agents/03-orchestration-and-anti-stall.md) — Subagent 生命周期、DAG、去重与自愈。
- [`agents/04-i18n-personas-workspaces.md`](./agents/04-i18n-personas-workspaces.md) — 国际化、Persona 与工作区隔离。
- [`architecture/dispatch-engine.md`](./architecture/dispatch-engine.md) — 调度协议。
- [`architecture/standards-and-extensibility.md`](./architecture/standards-and-extensibility.md) — 扩展接口与发布标准。
- [`architecture/workflow-and-role-personas.md`](./architecture/workflow-and-role-personas.md) — 角色与 Workflow 策略。
- [`architecture/orchestrator-skill-and-policy.md`](./architecture/orchestrator-skill-and-policy.md) — Runtime Skill 策略。
- [`architecture/ecosystem-assessment-and-roadmap.md`](./architecture/ecosystem-assessment-and-roadmap.md) — 当前能力评估与路线图。
- [`TODO.md`](./TODO.md) — 按领域维护的已实现事实与真实后续事项。
- [`tasks/domain-index.md`](./tasks/domain-index.md) — 领域知识索引，指向长期专著、架构说明与验证入口。

## 维护规则

不得新增阶段切片文档。所有知识直接更新到上述长效文档，并使用 `npm test` 与 `npm run preflight` 验证每次变更。

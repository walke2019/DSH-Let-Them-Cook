# DSH Let Them Cook — 领域知识索引

> 唯一可安装、注册和发布的包名是 `@dsh-external/dsh-let-them-cook`；`dsh-group-chat` 仅作为内部运行时命名空间。

本文不是时间线或版本流水，而是长期知识入口。实现事实、架构约束与验证证据必须归入对应领域文档，不再创建按阶段编号的切片文档。

## UI 与生命周期

- **主文档**：[`../agents/01-ui-and-lifecycle.md`](../agents/01-ui-and-lifecycle.md)
- **相关架构**：[`../architecture/standards-and-extensibility.md`](../architecture/standards-and-extensibility.md)
- **核心知识**：DSH 原生右侧栏 guide、显式打开、Fiber 生命周期清理、Session 绑定、任务实时状态与历史分层。
- **验证入口**：`suite-01-room-and-lifecycle.cjs`、`suite-06-e2e-closed-loop.cjs`。

## 工具、账本与权限

- **主文档**：[`../agents/02-tools-and-ledger.md`](../agents/02-tools-and-ledger.md)
- **相关架构**：[`../architecture/dispatch-engine.md`](../architecture/dispatch-engine.md)
- **核心知识**：原生精确工具过滤、工具事件适配、Token 与缓存账本、运行证据、审批事务。
- **验证入口**：`suite-04-tools-and-ledger.cjs`、`suite-06-e2e-closed-loop.cjs`。

## 调度、工作流与防停滞

- **主文档**：[`../agents/03-orchestration-and-anti-stall.md`](../agents/03-orchestration-and-anti-stall.md)
- **相关架构**：[`../architecture/dispatch-engine.md`](../architecture/dispatch-engine.md)、[`../architecture/orchestrator-skill-and-policy.md`](../architecture/orchestrator-skill-and-policy.md)、[`../architecture/workflow-and-role-personas.md`](../architecture/workflow-and-role-personas.md)
- **核心知识**：精确 live parent、原生 one-shot Subagent、Workflow 事件闭合、Assignment 三元组去重、DAG、Mailbox、看门狗和 system-healer。
- **验证入口**：`suite-02-workflow-dag.cjs`、`suite-03-runtime-anti-stall.cjs`、`suite-06-e2e-closed-loop.cjs`。

## 国际化、主题与工作区

- **主文档**：[`../agents/04-i18n-personas-workspaces.md`](../agents/04-i18n-personas-workspaces.md)
- **相关架构**：[`../architecture/workflow-and-role-personas.md`](../architecture/workflow-and-role-personas.md)
- **核心知识**：中英双语运行时、主题 Persona、工作区隔离、`.pm-workflow/dsh-group-chat/` 持久化和 Session 事件边界。
- **验证入口**：`suite-01-room-and-lifecycle.cjs`、`suite-05-personas-and-i18n.cjs`。

## 测试、发布与质量门禁

- **维护入口**：[`../README.md`](../README.md)、[`../architecture/ecosystem-assessment-and-roadmap.md`](../architecture/ecosystem-assessment-and-roadmap.md)
- **核心知识**：`npm run typecheck`、`npm test`、`npm run preflight`、文档与测试数量上限、构建和 Profile 装配契约。
- **发布原则**：确定性测试进入 CI；真实模型长链路作为显式发布资格验证，不伪装成稳定单测。

## 历史废弃方案

以下方向已经由当前契约取代，只保留结论，不维护逐项时间线：

- 中间会话页、Overlay、浮动 HUD、宿主布局改写、自定义拖拽缩放和 Hero 入口。
- 第二输入框或插件自建中央聊天面。
- 工具别名猜测、Prompt 权限降级、自动模型回退和历史上下文隐式兜底。
- 私有房间状态 Session 事件与 Workspace/Session 双轨状态源。
- 将终态历史计入实时运行任务。

## 后续路线图

真实未完成事项统一维护在 [`../TODO.md`](../TODO.md) 的同名领域章节，目前仅包括：

- Host/API 本地化分层；
- 长链路真实模型耐久验证与进度体验；
- 只读 Workflow 诊断与用户确认修复；
- 模板与 Persona 导入导出。

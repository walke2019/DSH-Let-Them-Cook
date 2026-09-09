# P26 — HUD 共享类型文件

## 目标

P25 先把 `GroupChatSideDock` 的账本/邮箱/分派类型复用到 `GroupChatHudRosterPanel`。本阶段进一步把这些类型抽到专用文件，避免 SideDock 依赖某个具体 UI 组件导出的类型，降低组件间耦合。

## 本轮修改

- 新增 `src/client/group-chat-hud-types.ts`。
- 统一承接 HUD 客户端共享类型：
  - `WorkflowTask`
  - `AssignmentEnvelope`
  - `AgentMailboxMessage`
  - `StructuredAgentResult`
  - `GroupMessageData`
  - `RuntimeMetrics`
  - `ModelLedgerData`
  - `LedgerData`
- `GroupChatSideDock.tsx` 从 `group-chat-hud-types.ts` 导入共享类型。
- `GroupChatHudRosterPanel.tsx` 从 `group-chat-hud-types.ts` 导入账本/邮箱/分派/指标类型。
- `GroupChatHudWorkflowPanel.tsx` 从 `group-chat-hud-types.ts` 导入消息、结构化结果、任务类型。

## 验收

- 类型只在 `group-chat-hud-types.ts` 定义。
- SideDock 不再从 RosterPanel 导入类型。
- 子组件继续只通过 props 获取动作回调，保持 HUD 壳层与面板解耦。
- 构建、矩阵、预检、视觉回归全部通过。

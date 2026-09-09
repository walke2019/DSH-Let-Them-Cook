# P25 — SideDock 冗余类型与工具函数清理

## 目标

P21-P24 已把 HUD 顶部、工作流、账本、黑板拆成组件。本阶段继续把 `GroupChatSideDock` 从「巨型组件」收敛为 HUD 壳层，避免已迁移到子组件的账本指标、状态颜色、短 ID 等 helper 留在壳层里形成维护歧义。

## 本轮修改

- `GroupChatHudRosterPanel.tsx` 导出账本/邮箱/分派相关类型：
  - `AssignmentEnvelope`
  - `AgentMailboxMessage`
  - `RuntimeMetrics`
  - `ModelLedgerData`
  - `LedgerData`
- `GroupChatSideDock.tsx` 改为 `import type` 复用这些类型。
- 从 `GroupChatSideDock.tsx` 删除已迁移的重复 helper：
  - `formatDuration`
  - `formatTokens`
  - `metricLine`
  - `mergeMetrics`
  - `statusColor`
  - `shortId`
- `GroupChatSideDock` 当前只保留：HUD 壳层、拖动/缩放、SSE/接口动作、编辑弹窗与子组件委托。

## 验收

- SideDock 不再定义账本指标 helper。
- SideDock 不再重复定义 Assignment/Mailbox/Ledger 类型。
- 账本组件继续拥有官方摘要风格指标与 AvatarBadge 图标。
- 构建、预检、矩阵、浏览器视觉回归全部通过。

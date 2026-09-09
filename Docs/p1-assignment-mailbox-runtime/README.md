# P1：持久 Assignment 与 Agent Mailbox 落地记录

日期：2026-09-08

## 本轮目标

将“主 Agent 分派，SubAgent 回报”的策略从 Prompt 说明推进为房间状态结构：每次唤醒角色时创建可持久化 `AssignmentEnvelope`，SubAgent 完成后向主 Agent mailbox 回传，后续可继续演进为 DAG 和 durable session。

## 已完成

1. `src/types.ts`
   - 新增 `AssignmentEnvelope`。
   - 新增 `AgentMailboxMessage`。
   - `GroupChatRoom` 增加 `assignments` 与 `mailboxes`。
   - `GroupMessageEnvelope.metadata` 增加 `assignmentId`。
   - 事件总线增加 `assignment:updated` 与 `mailbox:new`。

2. `src/engine/room-manager.ts`
   - 默认房间初始化 `assignments: []`、`mailboxes: {}`。
   - 旧工作区房间加载时自动补齐字段。
   - 新增 `createAssignment()`、`markAssignmentRunning()`、`completeAssignment()`、`addMailboxMessage()`、`getMailbox()`。
   - 导出纪要增加任务分派与邮箱摘要。

3. `src/engine/projection.ts`
   - Agent system prompt 注入自己的活跃 assignment 与收件箱摘要。

4. `src/index.ts`
   - 用户消息触发角色时创建 assignment。
   - Agent 接续触发下一角色时创建 assignment。
   - 工作流推进触发下一阶段角色时创建 assignment。
   - Agent 开始执行时 assignment 标记为 `running`。
   - Agent 产出后 assignment 标记为 `completed`。
   - 非主 Agent 产出会写入主 Agent mailbox。
   - assignment/mailbox 状态写入工作区持久化文件。

## 尚未完成

- assignment 还不是完整 DAG；没有 `dependsOn` 和节点级 verify command。
- 子 Agent 仍是单次独立 turn，不是稳定可继续 session。
- mailbox 目前是状态结构和上下文注入，尚未做右侧 HUD 专门展示。

## 下一步

进入 P2：`WorkflowTask` DAG + `verifyCommand` + `qualityContract`。

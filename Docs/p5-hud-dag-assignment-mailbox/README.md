# P5：HUD 展示 WorkflowTask DAG / Assignment / Mailbox

日期：2026-09-08

## 目标

把 P1/P2 已经落地的执行状态结构展示到右侧 HUD，让用户不用打开 JSON，就能看见：阶段任务 DAG、任务状态、负责人、依赖、质量门禁、verifyCommand、assignment 绑定、SubAgent 回传邮箱。

## 已完成

1. `src/client/GroupChatSideDock.tsx`
   - RoomData 增加 `assignments` 与 `mailboxes`。
   - WorkflowStage 增加 `tasks` 类型。
   - 新增 WorkflowTask / AssignmentEnvelope / AgentMailboxMessage 前端类型。
   - SSE 收到 `assignment:updated`、`mailbox:new` 时刷新右侧 HUD。
   - 工作流页顶部显示执行中、待处理、邮箱数量。
   - 每个阶段下展示任务 DAG 卡片：状态、标题、owner、dependsOn、verifyCommand、qualityContract、verification、assignment 状态。
   - 工作流页底部增加最近 Assignment 折叠面板。
   - 工作流页底部增加主 Agent Mailbox 折叠面板。

## 当前边界

- 目前是只读展示，不在 HUD 上直接编辑任务状态。
- 任务状态仍由后端 assignment 生命周期和 `/workflow/task` 接口更新。
- 任务 DAG 是阶段内展示，后续可升级成可视化连线图。

## 下一步

可进入 P6：结构化 Agent 输出协议；或补 UI 小项：HUD 上提供任务状态手动修正、验证输出折叠查看、Mailbox 已读标记。

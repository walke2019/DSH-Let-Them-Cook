# P7 — HUD 结构化结果与人工修正闭环

本阶段把 P6 的结构化 Agent 输出真正落到右侧 HUD，并补齐人工修正/邮箱已读两个最小闭环。

## 已完成

- HUD 从房间消息 `metadata.structuredResult` 聚合 assignment 结果。
- WorkflowTask 卡片显示 `RESULT_STATUS`、`SUMMARY`、`NEXT`、`EVIDENCE`。
- WorkflowTask 卡片提供 `ready / running / passed / failed / request_human` 手动修正按钮，调用 `/workflow/task`。
- Mailbox 支持未读/已读状态展示与单条 `标记已读`，调用 `/mailbox/read`。
- 后端新增 `RoomManager.markMailboxRead()`，并广播 `mailbox:updated` 以刷新 HUD。

## 设计边界

- 仍然保持插件式实现：只新增插件自己的 API、状态与 UI，不修改 DSH 核心源码。
- 结构化块只用于状态机与 HUD 展示；公开聊天内容继续使用剥离后的自然语言。
- 手动修正默认由 commander 执行，作为救火/校正入口，不替代工作流自动判断。

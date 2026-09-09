# P55 双语导出纪要

## 背景
真实 Agent 群聊任务中，commander 指出导出纪要/账本字段仍是中文硬编码，切到英文界面后导出内容不匹配 en-US 业务体验。

## 修复
- `RoomManager.exportMeetingSummary(roomId, locale)` 增加 `zh-CN | en-US` 参数。
- `/dsh-group-chat/api/export?id=...&locale=en-US` 输出英文标题与字段。
- `group_chat_export_summary` 工具增加 `locale` 参数，Agent 可按用户语言导出。

## 覆盖字段
- 标题：Group Chat Collaboration Summary
- Exported at / Theme / Members
- Shared Scratchpad
- Workflow Pipeline
- Agent Roster
- Assignments & Mailbox
- Message Stream
- Token Ledger / Total calls / Total tokens

## 验收
- 中文默认导出保持原语义。
- 英文导出不再使用中文主标题和账本字段。

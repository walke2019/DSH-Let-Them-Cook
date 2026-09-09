# P13 — 扩展对话入口恢复（已让位给 P14）

## 背景

P12 为了恢复 DSH 官方“对话”功能，移除了本插件对 `conversation.view` 的注册。P13 曾把「Agent 群聊」临时放入右侧 HUD，确认 `GroupChatPanel mode="dock"` 不会触发 full 模式的 body 接管。

## 当前状态

用户确认聊天派发应统一回到中间视图区，右侧 HUD 不应重复承载聊天输入。因此 P13 的临时 HUD 对话入口已在 P14 调整为：

- 中间新增安全标签「Agent 群聊」。
- 右侧 HUD 只保留「工作流 / 黑板 / 账本」。
- `GroupChatPanel` 继续使用 `mode="dock"`，但由独立 `GroupChatConversationView` 适配层挂载。

## 验收

- HUD 不再重复显示「Agent 群聊」。
- 扩展对话入口由 P14 的中间安全标签承接。


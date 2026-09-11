# P14 — 安全中间「Agent 群聊」标签

## 背景

P13 把扩展对话临时放回 HUD，避免再次触发官方「对话」视图的 prepare 生命周期冲突。但用户使用路径不理想：聊天派发应统一在中间视图区，右侧 HUD 应保持监控、黑板、账本和配置能力。

## 修复

- 恢复 `conversation.view` 中间标签，但不回到旧的直接挂载方式。
- 新增 `GroupChatConversationTab` 安全适配层：组件对象自带 `prepare()`，并只以 `GroupChatPanel mode="dock"` 渲染。
- `client/index.ts` 不直接导入 `GroupChatPanel`，只注册 `GroupChatConversationView`，降低与官方默认「对话」视图的生命周期耦合。
- 右侧 HUD 移除「Agent 群聊」标签和聊天输入，保留「工作流 / 黑板 / 账本」。
- 不注册 `conversation.composer`；进入中间「Agent 群聊」标签时用组件生命周期标记临时隐藏官方 Composer seat，避免双输入框，切回官方「对话」自动恢复。

## 用户使用方式

1. 中间视图区选择「Agent 群聊」。
2. 在该标签内发送扩展群聊消息、@ 角色或触发工作流。
3. 右侧 HUD 只观察执行态、工作流、共享黑板、角色账本和配置。
4. 切回官方「对话」时，官方源版功能和上下文注入继续独立运行。

## 验收

- `src/client/index.ts` 注册 `conversation.view`，但不直接引用 `GroupChatPanel`。
- `src/client/GroupChatConversationTab.tsx` 暴露 `GroupChatConversationView.prepare()`。
- 中间扩展标签内 `GroupChatPanel` 使用 `mode="dock"`，不会设置 full 模式 body 标记；官方输入区隐藏仅由 `data-dsh-group-chat-tab-active` 作用于当前标签生命周期。
- `GroupChatSideDock` 不再出现「Agent 群聊」标签和 `GroupChatPanel` 导入。


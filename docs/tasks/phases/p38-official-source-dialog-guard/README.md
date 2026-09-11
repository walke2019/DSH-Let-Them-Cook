# P38 — 官方源对话页保护

问题：HUD 是 `shell.overlay` 全局注册，如果用户回到官方源版 `对话` 或 `新会话`，群聊 HUD 仍可能停留在右侧，导致源版页面出现额外输入框/面板，甚至被误判为源对话报错。

## 已完成

- [x] `GroupChatSideDock` 监听 `body[data-dsh-group-chat-tab-active="true"]`。
- [x] 只有中间 `Agent 群聊` 标签激活时才渲染 HUD 和 `群聊副屏` 把手。
- [x] 切回官方 `对话` 或进入官方 `新会话` 时，HUD 完全不渲染，不保留右侧输入框、团队搜索框或账本控件。
- [x] HUD 展开态 body 标记只在扩展标签激活时写入，避免影响官方源版布局。

## 验收

- `node docs/tasks/phases/p38-official-source-dialog-guard/test-p38-official-source-dialog-guard.cjs`
- 浏览器实测官方新会话：官方 composer 正常显示，`.dsh-gc-sidebar-host` 不存在，`data-dsh-group-chat-tab-active` 为空。

# P39：源版对话 / Agent 群聊切换回归

## 背景

P38 修复了源版 `对话 / 新会话` 页面被群聊 HUD 污染的问题：HUD 只有在中间 `Agent 群聊` 标签激活时才渲染。P39 在此基础上增加真实浏览器切换回归，避免后续改 HUD、标签、布局时再次影响源版对话。

## 验收目标

1. 进入源版 `新会话` 后：
   - 官方 composer 正常存在；
   - 不出现 `.dsh-gc-sidebar-host`；
   - 不出现 `.gc-conversation-tab`；
   - body 上没有 `data-dsh-group-chat-tab-active` 和 `data-dsh-group-chat-hud-docked-open`。
2. 打开承载扩展的任务并切到 `Agent 群聊` 后：
   - `.gc-conversation-tab` 正常存在；
   - `.dsh-gc-sidebar-host` 正常出现；
   - body 标记 `data-dsh-group-chat-tab-active=true`；
   - HUD 标签包含 `团队 / 工作流 / 黑板 / 账本`。
3. 再切回官方 `对话` 标签后：
   - 官方对话仍可见；
   - HUD 从 DOM 中消失；
   - 扩展 body 标记被清理；
   - 浏览器控制台无新增错误。

## 维护约束

- 扩展不能注册或覆盖官方 composer。
- 扩展对话只允许走 `conversation.view` 的 `Agent 群聊` 标签。
- HUD 生命周期必须跟随 `data-dsh-group-chat-tab-active`，离开扩展标签后主动卸载。
- 回归脚本使用真实浏览器路径，不只做静态源码检查。

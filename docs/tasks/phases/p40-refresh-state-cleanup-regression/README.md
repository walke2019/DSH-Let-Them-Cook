# P40：刷新 / 重载后的扩展状态清理回归

## 背景

P38/P39 已经保证源版 `对话` 与 `Agent 群聊` 切换时 HUD 生命周期正确。P40 继续覆盖更容易遗漏的场景：用户在 `Agent 群聊` 中打开 HUD 后刷新页面、重新进入源版新会话、再返回扩展标签。

## 验收目标

1. 在 `Agent 群聊` 中打开 HUD 后刷新页面，不应让官方源版页面继承扩展布局状态。
2. 刷新后进入 `新会话`：
   - 官方 composer 存在；
   - 不存在 `.dsh-gc-sidebar-host`；
   - 不存在 `.gc-conversation-tab`；
   - body 不残留 `data-dsh-group-chat-tab-active` / `data-dsh-group-chat-hud-docked-open`。
3. 再进入任务并切回 `Agent 群聊`：
   - 中间群聊正常显示；
   - HUD 正常显示；
   - 控制台没有 `prepare`、`unscoped context`、`Cannot read properties of undefined` 等回归错误。

## 维护约束

- 扩展状态必须由当前激活标签驱动，不允许只依赖历史本地状态。
- body 级布局标记必须随着扩展标签卸载而清理。
- 刷新、任务切换、标签切换都必须保持官方源版可用。

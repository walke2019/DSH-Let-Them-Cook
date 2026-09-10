# P77 — 中央执行状态与 findLast 运行兼容

## 背景

用户在新会话发送群聊任务后，中央 `Agent 群聊` 只展示用户气泡，执行中状态主要出现在右侧 HUD / 悬浮 Agent 状态面板；如果模型长时间运行或失败，中央区要等最终总结或错误才出现反馈。真实记录还暴露 `Cannot read properties of undefined (reading 'findLast')`，说明运行时读取 DSH session events 时缺少兼容保护。

## 修复

- `GroupChatPanel` 订阅并缓存 `assignment:updated`，首次拉取 `/room` 时也读取 `room.assignments`。
- 中央消息区新增 `.gc-live-status`，对 `queued/running` assignment 显示执行中卡片、角色名、快/长任务、耗时/预计耗时和 brief，不再只依赖右栏 HUD。
- `agent-runtime` 不再直接调用 `events.findLast()`；先把 session events 规整为数组，再用兼容的反向遍历 helper 查找 `turn/end`。
- 所有新增中央文案继续使用 `tx(locale, zh, en)`。

## 验证

- `npm run test:central-live-status`
- `npm run typecheck`
- `npm run build:all`
- `npm run test:matrix`

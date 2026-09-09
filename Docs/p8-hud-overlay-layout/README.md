# P8 — HUD 覆盖停靠与官方主视图保护

## 目标

解决打开群聊 HUD 后，中间官方对话区被 padding-right 挤压成窄列、标题/输入区换行严重、滚动体验被插件样式接管的问题。

## 已完成

- 移除对 DSH AppFrame 的 `padding-right` 物理推挤。
- 移除对官方详情栏的强制 `translateX()`。
- 移除插件对官方 Composer / conversation scroll 的隐藏和 overflow 接管。
- HUD 改为右侧覆盖停靠轻组件，宽度限制为 `min(360px, calc(100vw - 72px))`。
- 保留 `updateLayoutPushWidth()` 历史接口，仅用于 HUD 自身宽度变量，避免破坏已有调用。

## 验收标准

- 打开 HUD 时，中间官方标题和输入区不再被压成竖排或极窄列。
- 官方对话滚动区域仍由 DSH 自己控制，可继续拉到底。
- HUD 可收起，不打开时不影响官方页面。


## 2026-09-09 回归补丁

右侧 HUD 展开/收起不得调用 `updateLayoutPushWidth()` 或向 document 写布局宽度变量；HUD 固定覆盖显示，避免 DSH 中间主视图再次被自适应减宽。P8 测试已增加 `dock must not write layout width on open/close` 断言。

## 2026-09-09 二次回归补丁
右侧 HUD 停靠展开时，不能挤压官方「对话」视图，但「Agent 群聊」中间标签自身必须按 HUD 宽度让出右侧空间，避免输入区和空态文案被 HUD 覆盖。实现方式为 `body[data-dsh-group-chat-hud-docked-open]` + `--dsh-group-chat-hud-overlay-width`，CSS 只命中 `body[data-dsh-group-chat-tab-active="true"] .gc-conversation`，不再改 DSH AppFrame / centerCol / details 布局。
## 2026-09-09 间距微调
侧栏展开 + HUD 停靠时，`Agent 群聊` 已经按 HUD 宽度避让，但 composer 和消息区自身还保留了左右对称内边距，视觉上会显得右栏与中间间距过大。本次把 docked HUD 状态下的 `.gc-composer` 与 `.gc-chat-messages` 右侧内边距收紧到 8px，保留 8px 安全缝，不再额外拉大中右间距。
## 2026-09-09 右栏拖拽缩放
右侧 HUD 增加左边缘 8px 拖拽热区，拖动时只更新插件自身 `hudWidth` 与 `--dsh-group-chat-hud-overlay-width`，并写入 `localStorage:dsh-group-chat.hud-width` 作为最近宽度。拖拽不会改官方左栏、centerCol 或 AppFrame；停靠状态同步收紧 Agent 群聊中间区，浮窗状态保持右边缘固定。
## 2026-09-09 中右安全缝
`--dsh-group-chat-hud-overlay-width` 现在记录的是 Agent 群聊内容避让宽度，不等同 HUD 实际宽度；避让宽度比 HUD 实际宽度少 16px，叠加 composer/message 的 8px 右内边距后，视觉上保留约 8px 安全缝，避免右栏与中间距离过大。
## 2026-09-09 官方拖拽手感对齐
右栏缩放热区复用官方左栏 resize handle 的 `pI_x6G_handle` 类名，光标统一为 `col-resize`，拖动期间给 `body` 设置 `cursor: col-resize` 与 `user-select: none`，释放或鼠标离开窗口后自动清理；视觉上保持透明 8px 热区，不额外画高亮条。
## 2026-09-09 拖拽稳定性补丁
右栏左边线缩放从 mousemove/mouseup 改成 Pointer Events；拖拽开始时调用 `setPointerCapture()`，后续通过 window `pointermove` 持续追踪，即使指针离开 12px 热区也不会丢拖拽状态。`pointerup`、`pointercancel`、窗口 `blur` 都会清理 body/html 光标与 `user-select`，避免拖完仍残留 resize 光标。
## 2026-09-09 中间输入框左右对称
HUD 停靠时，`Agent 群聊` 的输入框外层 `.gc-composer` 不再只收紧右侧 padding，而是左右同时收紧为 8px；消息区 `.gc-chat-messages` 也同步左右 8px，保证中间可用内容区内左右留白一致，同时右侧与 HUD 维持约 7-8px 安全缝。
## 2026-09-09 右栏文本溢出补丁
HUD 宽度可缩放后，右栏内部所有组件必须遵守 `min-width:0` / `max-width:100%`，长文本使用 `overflow-wrap:anywhere` 或省略号。顶部主题/调度模式行改为紧凑 5 列网格 `46px 1fr 46px 1fr 24px`，details/summary 强制不超过侧栏宽度，避免按钮、任务标题、模型 ID 或长描述撑破右栏。
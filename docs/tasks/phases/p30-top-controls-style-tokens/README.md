# P30 — 顶部控件接入 HUD 公共样式

## 目标

让 `GroupChatHudTopControls` 明确接入 `group-chat-hud-styles.ts`，后续统一调整下拉、帮助按钮、QA 弹窗主题时可以共享 HUD token，同时保留用户要求的一行紧凑布局与 SVG 下拉箭头。

## 验收

- 顶部控件继续保留 `grid-template-columns:46px minmax(0,1fr) 46px minmax(0,1fr) 24px`。
- 下拉箭头继续使用 SVG `SelectChevron`。
- QA 弹窗继续包含当前模式、触发谁、调用量、工作区隔离。
- 顶部控件已引用 `hudTokens`。

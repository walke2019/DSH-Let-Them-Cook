# P27 — HUD 公共样式 Token

## 目标

右侧 HUD 已完成顶部、工作流、黑板、账本组件拆分；本阶段开始收敛重复 inline style，先把通用颜色、卡片、按钮、textarea、滚动文本样式抽成共享 token，后续做主题美化时不用逐个组件硬改。

## 本轮修改

- 新增 `src/client/group-chat-hud-styles.ts`。
- 提供共享样式：
  - `hudTokens`
  - `hudPanelStackStyle`
  - `hudCardStyle`
  - `hudGhostButtonStyle`
  - `hudPrimaryButtonStyle`
  - `hudTextAreaStyle`
  - `hudScrollableTextStyle()`
- `GroupChatHudScratchpadPanel.tsx` 优先接入共享样式，验证抽样组件可用。

## 验收

- 共享样式继续使用 DSH 官方主题变量 `--dsw-alias-*`。
- 黑板展示态仍保持 `whiteSpace: pre-wrap`、`overflowY: auto`、`overflowX: hidden` 的防溢出策略。
- 构建、矩阵、预检、浏览器视觉回归全部通过。

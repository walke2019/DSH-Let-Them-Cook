# P28 — 账本 / 角色面板接入 HUD 公共样式

## 目标

继续执行剩余收敛 TODO：把 `GroupChatHudRosterPanel` 中最容易重复的按钮、卡片、面板栈、主题输入框接入 `group-chat-hud-styles.ts`，让账本/角色区域与黑板面板使用同一套官方主题 token。

## 本轮修改

- `GroupChatHudRosterPanel.tsx` 引入：
  - `hudTokens`
  - `hudPanelStackStyle`
  - `hudCardStyle`
  - `hudGhostButtonStyle`
  - `hudPrimaryButtonStyle`
  - `hudTextAreaStyle`
- 主题快捷按钮、生成草案、生成并套用、套用草案使用公共按钮样式。
- 总体运行统计卡片使用公共卡片样式。
- 主题简述 textarea 使用公共输入样式。

## 剩余步骤

- P29：工作流面板样式 token 化。
- P30：顶部控件样式 token 化。
- P31：最终可用性总验收。

## 验收

- 账本面板仍保留 `data-dsh-gc-roster-panel`。
- 主题生成仍必须先草案/确认，不绕过用户确认。
- AvatarBadge 图标仍保留。
- 指标摘要、Agent/模型折叠仍保留。
- 构建、矩阵、预检、浏览器视觉回归全部通过。

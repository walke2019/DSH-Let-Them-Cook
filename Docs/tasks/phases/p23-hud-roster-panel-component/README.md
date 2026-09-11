# P23 — HUD 账本 / 角色 / 主题面板组件化

## 目标

继续降低 `GroupChatSideDock` 复杂度，把右侧 HUD 的「账本」标签拆成可维护的小组件，避免后续修改主题生成、角色列表、模型账本时再次影响停靠/拖动/官方对话兼容。

## 本轮修改

- 新增 `src/client/GroupChatHudRosterPanel.tsx`。
- `GroupChatHudRosterPanel` 统一承接：
  - AI 造主题角色 + 工作流；
  - 沙雕整活 / 原神主题快捷套用；
  - 草案预览与确认套用；
  - 总体运行统计与按 Agent / 模型折叠账本；
  - 成员列表与角色编辑入口；
  - 最近任务分派与主 Agent 邮箱。
- `GroupChatSideDock` 只保留 HUD 壳层、拖动/缩放、数据拉取、API 动作与标签切换。

## 验收

- 组件存在 `data-dsh-gc-roster-panel` 稳定标记。
- `GroupChatSideDock` 通过 `<GroupChatHudRosterPanel ... />` 委托账本标签。
- 角色头像仍通过 `AvatarBadge` 渲染，修复名称前图标退化风险。
- 账本区域保留官方摘要风格与 Agent/模型折叠展开。
- 主题生成仍是草案确认机制，不绕过用户确认。

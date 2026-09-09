# P24 — HUD 黑板面板组件化

## 目标

把右侧 HUD 的「黑板」标签从 `GroupChatSideDock` 中拆出，完成 HUD 三个主要标签的组件化，减少布局、滚动、编辑态和官方对话兼容之间的互相影响。

## 本轮修改

- 新增 `src/client/GroupChatHudScratchpadPanel.tsx`。
- `GroupChatHudScratchpadPanel` 承接：
  - 团队共识备忘录标题；
  - 编辑 / 保存按钮；
  - Markdown 黑板展示态；
  - textarea 编辑态；
  - 空黑板提示。
- `GroupChatSideDock` 只通过 props 传入 `scratchpadDraft`、编辑状态与保存回调。

## 验收

- 组件存在 `data-dsh-gc-scratchpad-panel` 稳定标记。
- `GroupChatSideDock` 通过 `<GroupChatHudScratchpadPanel ... />` 委托黑板标签。
- 黑板内容保留 `whiteSpace: pre-wrap`、`overflowY: auto`、`overflowX: hidden`，避免长文本横向溢出 HUD。
- 编辑态仍使用 `textarea`，保存仍走原 `/dsh-group-chat/api/scratchpad` 路径。

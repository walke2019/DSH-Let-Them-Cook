# P21 — HUD 顶部配置区组件化

目标：把右侧 `群聊控制台 (HUD)` 顶部的“角色主题 / 调度模式 / QA”从 `GroupChatSideDock.tsx` 抽成独立组件，减少大文件 inline style、降低布局回归风险。

## 完成内容

- 新增 `src/client/GroupChatHudTopControls.tsx`。
- 顶部配置区保留一行紧凑布局：`角色主题`、`调度模式`、`?`。
- select 箭头继续使用 SVG。
- 调度模式 QA 说明移动到组件内部，保留“当前模式 / 适合 / 会触发谁 / 调用量”。
- `GroupChatSideDock.tsx` 只保留状态、数据和整体 HUD 容器，不再维护该配置区的弹窗状态。

## 回归

```bash
node docs/tasks/phases/p21-hud-top-controls-component/test-p21-hud-top-controls-component.cjs
npm run test:matrix
```

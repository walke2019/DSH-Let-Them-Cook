# P22 — HUD 工作流面板组件化

目标：把右侧 `群聊控制台 (HUD)` 中部执行态拆出 `GroupChatHudWorkflowPanel`，降低 `GroupChatSideDock.tsx` 体积，减少执行导演台、阶段任务、Assignment、Mailbox 的布局回归风险。

## 完成内容

- 新增 `src/client/GroupChatHudWorkflowPanel.tsx`。
- `GroupChatSideDock.tsx` 只负责 HUD 容器、数据加载、API 动作和 Tab 切换。
- `GroupChatHudWorkflowPanel` 负责：
  - 执行导演台；
  - 阶段流程计数；
  - Workflow task 展示与状态修正；
  - 失败任务 `重试 / 让用户补充 / 跳过`；
  - 最近 Assignment；
  - 主 Agent Mailbox。
- P5/P7 旧测试已迁移到组件文件读取，避免组件化后误判。

## 回归

```bash
node docs/tasks/phases/p22-hud-workflow-panel-component/test-p22-hud-workflow-panel-component.cjs
npm run test:matrix
npm run test:ui:visual
```

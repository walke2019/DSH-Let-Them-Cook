# P29 — 工作流面板接入 HUD 公共样式

## 目标

把 `GroupChatHudWorkflowPanel` 的面板栈、计数卡片、状态按钮与主题变量接入 `group-chat-hud-styles.ts`，继续减少右栏组件的重复 inline style。

## 验收

- 工作流面板继续保留执行导演台、阶段流程、任务卡、Assignment、Mailbox。
- 失败任务快捷处理继续可用。
- 共享样式 token 已被工作流面板引用。

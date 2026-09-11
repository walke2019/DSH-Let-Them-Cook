# 01 - UI 布局、插槽生命周期与交互规范 (UI & Lifecycle Seams)

本文档面向所有涉及前端 UI、Cordis 插槽扩展与视图切换开发的 AI Agent 与人类开发者。

---

## 1. 核心契约与铁律

### 1.1 `conversation.view` prepare 契约
- 向 `conversation.view` 注入中间视图时必须提供稳定 `id`、`label`、`prepare()` 和组件适配层；
- 必须保留 `GroupChatConversationView.prepare = () => ({})`，杜绝 `Cannot read properties of undefined (reading 'prepare')` 异常；
- 详见：[docs/tasks/phases/p14-safe-middle-conversation-tab/README.md](../tasks/phases/p14-safe-middle-conversation-tab/README.md)、[docs/tasks/phases/p44-source-dialog-prepare-diagnostic/README.md](../tasks/phases/p44-source-dialog-prepare-diagnostic/README.md)。

### 1.2 HUD 布局避让与 Pointer Capture
- HUD（Companion HUD）采用侧边 Overlay 模式展开，右侧保留 8px 安全缝；
- 绝不调用全局 `updateLayoutPushWidth()` 或向 `documentElement` 写入影响官方对话主布局的 CSS 变量；
- 拖拽调整 HUD 宽度必须使用 Pointer Events 与 `setPointerCapture()`，拖拽结束后必须清理 cursor 与 user-select；
- 详见：[docs/tasks/phases/p8-hud-overlay-layout/README.md](../tasks/phases/p8-hud-overlay-layout/README.md)、[docs/tasks/phases/p72-hud-message-margins/README.md](../tasks/phases/p72-hud-message-margins/README.md)。

### 1.3 源版对话绝对隔离（零污染红线）
- 插件样式只能作用在本插件根节点或明确的 `body[data-dsh-group-chat-tab-active="true"]` 期间；
- 切换回官方「对话」或「新会话」时，DOM 中不得残留 `.dsh-gc-sidebar-host`、`.gc-conversation-tab`，body 不得残留 `data-dsh-group-chat-tab-active` 或 `data-dsh-group-chat-hud-docked-open`；
- 详见：[docs/tasks/phases/p38-official-source-dialog-guard/README.md](../tasks/phases/p38-official-source-dialog-guard/README.md)、[docs/tasks/phases/p39-source-agent-tab-switch-regression/README.md](../tasks/phases/p39-source-agent-tab-switch-regression/README.md)、[docs/tasks/phases/p40-refresh-state-cleanup-regression/README.md](../tasks/phases/p40-refresh-state-cleanup-regression/README.md)。

### 1.4 新会话 Blank Hero 入口与自点击防线
- Blank Hero 临时面板跟随中间列实际 DOM 几何，展开对齐 ~280px，收起对齐 ~56px；
- 自点击查找官方真实标签页时，必须排除自身入口按钮，杜绝无限递归死循环点击；
- 详见：[docs/tasks/phases/p71-new-session-agent-entry/README.md](../tasks/phases/p71-new-session-agent-entry/README.md)、[docs/tasks/phases/p73-hero-left-collapse-adaptation/README.md](../tasks/phases/p73-hero-left-collapse-adaptation/README.md)、[docs/tasks/phases/p83-hero-entry-self-click-guard/README.md](../tasks/phases/p83-hero-entry-self-click-guard/README.md)。

### 1.5 输入框常驻视口底部与滚动区外挂
- `.gc-chat-bottom`（Composer 区域）作为独立 flex 子节点置于滚动区 `.gc-chat-messages` 外侧，保证滚动长对话时长驻视口底部；
- 详见：[docs/tasks/phases/p64-chat-ui-composer-progression/README.md](../tasks/phases/p64-chat-ui-composer-progression/README.md)、[docs/tasks/phases/p79-composer-outside-scroll/README.md](../tasks/phases/p79-composer-outside-scroll/README.md)。

### 1.6 长消息折叠与遮罩
- 长消息正文提供双层渐进式遮罩与收起/展开折叠，避免单条消息过长阻塞阅读体验；
- 详见：[docs/tasks/phases/p84-collapsible-message-body/README.md](../tasks/phases/p84-collapsible-message-body/README.md)。

---

## 2. 自动化回归命令
- `npm run test:ui:switch` — 源版对话与群聊标签切换回归
- `npm run test:ui:refresh` — 刷新与状态清理回归
- `npm run test:hud-message-margins` — HUD 边距与右侧避让回归
- `npm run test:hero-left-collapse` — 左栏收起自适应回归
- `npm run test:hero-entry-self-click-guard` — Hero 入口防自点击回归
- `npm run test:composer-outside-scroll` — 输入框视口常驻回归

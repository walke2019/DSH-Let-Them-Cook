# DSH 多 Agent 群聊插件技术架构

更新日期：2026-09-09

## 1. 当前架构

```
DSH Cordis Host
├─ src/index.ts                 Host 插件入口，注册服务/API/agent runtime
├─ src/engine/*                 房间、工作流、自动草案、主题文案、结构化结果
├─ src/compat/dsh.ts            DSH 能力探测、模型目录、工具限制兼容层
├─ src/client/index.ts          Client 插件入口
├─ src/client/GroupChatTab.tsx  conversation.view 安全标签
├─ src/client/GroupChatPanel.tsx 中间 Agent 群聊对话面板
├─ src/client/GroupChatComposer.tsx @角色输入组件
└─ src/client/GroupChatSideDock.tsx 右侧群聊控制台 HUD
```

## 2. DSH 接入点

- `conversation.view`：只新增 `Agent 群聊` 标签，slot 注册对象必须提供稳定 `id`、`label`、`prepare()` 和组件。
- `shell.overlay`：挂载右侧 `群聊控制台 (HUD)`。
- WebServer：提供 `/dsh-group-chat/api/room`、`/message`、`/auto-plan`、`/agent/update`、`/models`、`/workflow/action`、`/workflow/task`、`/scratchpad` 等接口。
- SSE：通过 `subscribeGroupChat()` 刷新房间、消息、assignment、mailbox、agent 状态。

## 3. 布局策略

### 3.1 不改官方主布局

禁止再走旧的 Layout-Push：

- 不调用 `updateLayoutPushWidth()`。
- 不向 `documentElement` 写会影响官方 AppFrame / centerCol / details 的宽度变量。
- 不全局隐藏官方 composer。
- 不长期改官方 conversation scroll 高度。

### 3.2 只让插件自身避让 HUD

右侧 HUD 停靠打开时：

- `GroupChatSideDock` 给 `body` 写入插件作用域标记：
  - `data-dsh-group-chat-hud-docked-open="true"`
  - `--dsh-group-chat-hud-overlay-width`
- CSS 只命中：
  - `body[data-dsh-group-chat-tab-active="true"][data-dsh-group-chat-hud-docked-open="true"] .gc-conversation`
- 官方 `对话` 标签不受影响。

### 3.3 HUD 缩放

- 左边线透明热区 12px。
- 使用 `PointerEvent` + `setPointerCapture()` 防止离开热区后丢拖动。
- 拖动期间设置 `body/html cursor: col-resize` 与 `user-select:none`。
- `pointerup`、`pointercancel`、窗口 `blur` 清理状态。
- 宽度范围：300px - 520px。
- 最近宽度写入 `localStorage:dsh-group-chat.hud-width`。

## 4. 多 Agent 执行模型

- `commander` 是主 Agent：理解意图、追问、拆解、派发、审核、收口。
- `researcher/backend/frontend/qa/writer` 是 SubAgent：只执行自身职责。
- 同阶段 workflow 可并发多个 SubAgent，但工具任务必须唯一归口，避免重复搜索/爬取/实现。
- assignment 与 mailbox 作为主从协作的持久协议，SubAgent 结果先回 mailbox，再由主 Agent 汇总。

## 5. 模型与工具

- 模型推荐按能力标签评分：reasoning、coding、tool_use、web_research、data_extraction、ui_design、writing、qa_audit、long_context、fast_reply、low_cost。
- 用户手动模型优先，最近模型次之，推荐只作候选。
- 工具权限通过 `allowedTools` 与 DSH `tools.restrict()` 兼容层落地。
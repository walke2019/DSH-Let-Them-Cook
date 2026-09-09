# DSH 多 Agent 群聊：规范接入与扩展标准

更新日期：2026-09-10

## 1. 插件边界

`dsh-group-chat` 必须作为 DSH Cordis 插件维护：

- 不修改 `@deepseek-ai/dsh` 核心源码。
- 不覆盖官方 preset，如标准模式、极简模式、创造模式。
- 不劫持官方 `对话`。
- 不硬编码外部模型 HTTP 请求。
- 所有生命周期资源必须挂在 `ctx.effect()` 或等价清理机制内。

## 2. Client UI seam

| 区域 | 当前做法 | 禁止事项 |
|---|---|---|
| 官方左栏 | 保持官方导航壳 | 不伪装 Workspace / Conversation，不强改左栏结构 |
| 中间区 | `conversation.view` 新增 `Agent 群聊` | 不覆盖官方 `对话`，不注册全局 composer |
| 右侧区 | `shell.overlay` HUD | 不挤压官方 AppFrame，不重复聊天输入 |
| 详情栏 | 保持官方行为 | 不长期 transform / padding hack |

## 3. 布局与拖拽标准

- HUD 默认覆盖停靠，不参与 DSH 官方 grid 布局。
- HUD 展开时只让 `Agent 群聊` 标签自身避让，官方对话保持原样。
- 中间输入框在 HUD 展开时左右 padding 对称。
- HUD 内组件统一 `min-width:0`、`max-width:100%`，长文本省略或换行。
- 右栏左边线缩放必须使用 Pointer Capture，避免拖动丢失。
- 右栏拖拽视觉对齐官方左栏：透明 12px 热区、`col-resize`、无额外高亮条。

## 4. 数据作用域

默认工作区路径：`.pm-workflow/dsh-group-chat/`。

以下数据不得无提示写全局：

- 角色主题
- 角色定义
- 工作流定义
- 最近模型与回退模型
- 黑板
- assignments
- mailboxes
- ledger

## 5. Runtime Skill

扩展内置 Runtime Skill `dsh-group-chat-orchestrator`，用于给 DSH 内运行的群聊 Agent 注入协同规则。扩展负责 UI/API/状态机/持久化；Skill 负责角色协作说明、工具路由、模型能力标签与输出纪律。

## 6. 回归验证

任何 UI/布局/注册点改动后，至少运行：

```bash
npm run typecheck
npm run build:all
npm run test:matrix
```

涉及浏览器显示的改动还必须在 `http://127.0.0.1:3080/` 进行实测，关注：

- 官方 `对话` 可用。
- `Agent 群聊` 标签存在且 prepare 不报错。
- HUD 不遮挡中间输入框。
- HUD 文本无可见溢出。
- 左侧官方栏展开/收起不破坏中间布局。
## 7. External references and coexistence

- DSH official seams are the hard integration boundary: `conversation.view`, `shell.overlay`, `ctx.effect()`, `ctx.webServer`, and `agent/request`.
- Hermes is used as a reference for named roles, capability isolation, and centralized message delivery.
- OpenClaw is used as a reference for silence tokens, anti-loop behavior, and role-scoped execution.
- dsh-mnemon is treated as a coexisting memory/context-injection plugin. Do not hijack it, do not store group-chat workspace state inside it, and keep official Dialog compatibility tests green.

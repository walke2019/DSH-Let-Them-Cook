# P12 — 官方对话视图兼容修复

## 触发问题

用户在源版“对话”功能中看到上下文注入插件 `dsh-mnemon` 运行失败：

```text
Cannot read properties of undefined (reading 'prepare')
```

当前插件之前注册了 `conversation.view` 自定义主视图 Tab。该槽位属于 DSH 官方对话视图生命周期的一部分，其他上下文注入插件可能依赖官方 view/provider 的 `prepare` 钩子；自定义 view 若没有完全实现宿主期望的 prepare 生命周期，就可能影响源版“对话”。

## 修复

- 彻底移除本插件的 `conversation.view` 注册。
- 不再导入或注册 `GroupChatPanel` 到官方主视图槽位。
- 只保留 `shell.overlay` HUD。
- 官方中间对话区、Composer、上下文注入 prepare 生命周期全部交还 DSH 源版实现。

## 设计取舍

- “Agent 群聊”能力继续通过右侧 HUD + 后端 API + Agent 调度引擎存在。
- 中间区域保持官方源版对话体验，不再放置重复的大面板。
- 后续如需中间增强，只做轻量按钮/浮层，不接管 `conversation.view`。

## 验收

- `src/client/index.ts` 不再包含 `ctx.slots.inject("conversation.view"...)`。
- `src/client/index.ts` 不再导入 `GroupChatPanel`。
- 仍保留 `shell.overlay` HUD。
- 测试矩阵与 API smoke 通过。


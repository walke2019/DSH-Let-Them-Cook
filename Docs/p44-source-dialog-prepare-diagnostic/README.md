# P44 — 源版「对话」prepare 报错诊断

## 用户现象

源版「对话」运行工具链时出现：

```text
上下文注入 dsh-mnemon
已停止
本轮运行失败 Cannot read properties of undefined (reading 'prepare')
```

## 当前结论

这次报错更像是 **DSH 后端 agent-loop 在执行工具调用前找不到工具运行时调度器**，不是 `dsh-group-chat` 中间「Agent 群聊」标签的 `conversation.view.prepare` 丢失。

关键证据：

1. 本插件注册的中间视图具备显式 `prepare()`：
   - `src/client/GroupChatConversationTab.tsx` 导出 `GroupChatConversationView.prepare = () => ({})`；
   - `src/client/index.ts` 注入 `conversation.view` 时也传入 `prepare: GroupChatConversationView.prepare`。
2. 源版「对话」新会话页面本地检查结果：
   - `hasHud:false`
   - `hasGc:false`
   - `data-dsh-group-chat-tab-active:null`
   - `data-dsh-group-chat-hud-docked-open:null`
   - 官方输入框正常存在，控制台没有捕获到 `prepare` / `resume failed` / `unscoped context` 类错误。
3. DSH agent-loop 中存在与报错完全匹配的后端调用点：
   - `ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare(call.exec)`
   - 当 `ctx.tools[TOOL_RUNTIME_SCHEDULER]` 为 `undefined` 时，异常文本就是 `Cannot read properties of undefined (reading 'prepare')`。
4. 当前全局 DSH 安装目录存在多份 `@deepseek-ai/dsh-tools` 物理副本。由于 `TOOL_RUNTIME_SCHEDULER` 是由 `@deepseek-ai/dsh-tools` 导出的 Symbol，如果不同包加载到不同副本，工具注册端与 agent-loop 读取端可能使用不同 Symbol，进而导致调度器读取为 `undefined`。
5. 当前 super-injector 活跃列表只有：
   - `@dsh-external/dsh-stealth-browser`
   - `@dsh-external/dsh-group-chat`
   未看到活跃的外部 `dsh-mnemon` 插件；用户界面里的“上下文注入 dsh-mnemon”更像是 DSH 源版运行过程里的上下文注入/工具展示名称。

## 是否和本扩展有关

按现有证据：**不是本扩展前端中间标签直接导致**。

可能的关联只剩两类：

- **间接环境关联**：super-injector / 全局 DSH 包布局 / 其它工具包加载导致 DSH 后端出现 `@deepseek-ai/dsh-tools` 多副本 Symbol 不一致。
- **运行时组合关联**：只有在某些工具调用链（如 todo、workflow、上下文注入）触发时才暴露；单纯打开官方「对话」不复现。

本插件自身对 `@deepseek-ai/dsh-tools` 使用 `peerDependencies`，没有把它打进生产依赖；这降低了由本插件私带 dsh-tools 副本造成冲突的概率。

## 建议修复方向

1. 保持插件不修改 DSH 核心源码。
2. 在当前已有的 preload 兼容层 `Docs/scope-repair/scope-singleton.mjs` 中，除 `@deepseek-ai/dsh-scope` 外，增加 `@deepseek-ai/dsh-tools` 单例解析，使所有运行时组件共用同一份 dsh-tools 导出 Symbol。
3. 做 A/B 验证：
   - A：禁用本插件但保留其它注入，触发源版工具调用；
   - B：启用本插件并开启 dsh-tools singleton，再触发同一源版工具调用；
   - C：仅打开官方「对话」不进入 `Agent 群聊`，确认本插件 HUD 与中间视图不注入源版 DOM。
4. 把 `Cannot read properties of undefined (reading 'prepare')` 纳入后续发布前冒烟检查关键词。

## 维护提醒

- 不要再把扩展面板直接混入官方「对话」视图；只允许通过独立 `Agent 群聊` 标签承载。
- 所有 DOM 标记必须在离开 `Agent 群聊` 后清理，避免影响源版布局和事件。
- 看到 `prepare` 报错时先区分：
  - 前端 `conversation.view.prepare` 缺失；
  - 后端 `ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare` 缺失。
  本次证据指向后者。


## 已执行修复验证

本轮已经把 `Docs/scope-repair/scope-singleton.mjs` 从只单例化 `@deepseek-ai/dsh-scope` 扩展为同时单例化：

- `@deepseek-ai/dsh-scope`
- `@deepseek-ai/dsh-tools`
- `@deepseek-ai/dsh-tools/types`
- `@deepseek-ai/dsh-tools/presentation`
- `@deepseek-ai/dsh-tools/invariant`

备份文件：`Docs/scope-repair/scope-singleton.mjs.p44-before-dsh-tools.bak`。

验证结果：

- singleton import smoke：`import('@deepseek-ai/dsh-tools')` 可正常拿到 `TOOL_RUNTIME_SCHEDULER`。
- 重新启动 `dsh web --no-open` 后，`/dsh-group-chat/api/compat` 返回 200 JSON，说明本插件后端路由可用。
- 通过 super-injector UTF-8 JSON 重新注入本插件后，`@dsh-external/dsh-group-chat` active=true，host/client 均为 ✓。
- 首页 boot entries 中能看到 `dsh-mnemon`，说明用户界面里的“上下文注入 dsh-mnemon”来自 DSH 当前环境中的 mnemon 插件链路，不是本插件伪造的名称。

注意：PowerShell `Invoke-RestMethod` 直接 POST 中文路径时曾把 `C:\项目\dsh-group-chat` 误传为 `C:\??\dsh-group-chat`，导致 super-injector 报“目录不存在”。已改用 Node fetch 发送 UTF-8 JSON 后注入成功。后续涉及中文路径的本地 API 调用应优先使用 Node fetch 或显式 UTF-8 body。

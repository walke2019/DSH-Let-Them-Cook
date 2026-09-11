# 工具路由运行时落地记录

日期：2026-09-08

## 目标

把此前只存在于文档、类型与 Prompt 中的“工具归口策略”推进到实际 Agent runtime：每个群聊角色启动独立 turn 时，只暴露本角色 `permissions.allowedTools` 中声明的工具。

## 本轮代码变更

1. `src/engine/agent-runtime.ts`
   - 新增 `MemberTurnRuntimeOptions`。
   - `runMemberTurn()` 增加 `{ roleId, allowedTools }` 参数。
   - 对 `allowedTools` 去重、清洗、排序。
   - 通过 `scoped.tools.restrict({ allow: allowedTools })` 限制每个角色本轮可见工具。
   - 在角色 system prompt 尾部注入 `Tool Scope`，明确未授权工具不得调用或声称已调用。

2. `src/index.ts`
   - 调用 `runMemberTurn()` 时传入 `member.id` 与 `member.permissions.allowedTools`。

3. `src/engine/room-manager.ts`
   - 修正默认角色工具白名单。
   - commander 使用真实注册的 `group_chat_workflow_advance`、`group_chat_workflow_reject` 等工具名。
   - researcher 保留搜索/抓取类工具名归口。
   - backend/frontend 分别保留文件/作业/图片读取类工具名归口。
   - qa/writer 只保留状态、导出、黑板等协作工具。

4. `src/engine/workflow-orchestrator.ts`
   - `call_tool` 权限检查不再因 `admin` 自动放行所有工具。
   - 空白名单表示无工具权限。

## 现在的边界

已完成：角色工具白名单真实接入运行时。

尚未完成：不同 DSH 版本/插件环境下的外部工具真实名称可能不同，后续需要 `src/compat/dsh.ts` 或工具目录探测，把 `web_search`、`tool_fs` 等语义能力映射到当前宿主真实工具名。

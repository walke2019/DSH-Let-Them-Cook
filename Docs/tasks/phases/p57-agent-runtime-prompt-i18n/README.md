# P57 — Agent 运行提示/上下文投影双语

目标：让真实 Agent 轮次收到的 System Prompt、工具权限提示、上下文投影和 followup 指令跟随用户消息 locale，减少英文任务被中文提示拉回中文输出的问题。

## 改动

- `src/engine/projection.ts`
  - 增加英文公共群规 `SHARED_CONSTITUTION_EN`。
  - `formatRoster()`、`formatHistoryForAgent()`、`formatOrchestrationPolicy()`、`formatAssignmentsForAgent()`、`assembleSystemPrompt()` 增加 `locale` 参数。
  - 英文下输出 `[GroupChat Orchestrator Policy]`、`[Conversation Context]`、`[Shared Scratchpad]` 等英文上下文标题。
- `src/engine/agent-runtime.ts`
  - `MemberTurnRuntimeOptions` 增加 `locale`。
  - Tool Scope 文案按语言输出。
  - followup 用户消息按语言输出。
- `src/index.ts`
  - Agent 轮次根据 assignment source message 的 `metadata.locale` 选择投影语言。
  - 熔断提示跟随 locale。

## 验收

- 英文任务进入 Agent 轮次时，系统提示中的公共规则、编排策略、对话上下文、工具权限和 followup 指令都为英文。
- 中文默认路径不变。
- 调度仍保留 master/subagent、工具归口和 DSH workflow 并发策略。

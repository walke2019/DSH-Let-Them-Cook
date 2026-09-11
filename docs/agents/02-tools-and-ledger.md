# 02 - 原生工具调用、流式状态机与计费审计 (Tools, Streaming & Ledger)

本文档规范群聊智能体对 DSH 底座工具的调用机制、流式状态回传、行号 Diff 可视化以及 Prompt Cache 真实计费审计。

---

## 1. 核心契约与铁律

### 1.1 DSH 底座原生工具白名单直通
- 严禁向智能体提供虚拟假工具或脱离底层执行能力的占位工具；
- 成员智能体必须直接白名单直通底座原生工具（`read`, `write`, `edit`, `glob`, `grep`, `bash`, `web_search`, `web_fetch`, `read_image`）；
- 详见：[docs/tasks/phases/execution-tool-routing-runtime/README.md](../tasks/phases/execution-tool-routing-runtime/README.md)、[docs/tasks/phases/p88-official-tools-and-cache-metrics/README.md](../tasks/phases/p88-official-tools-and-cache-metrics/README.md)。

### 1.2 中央消息流 250ms 工具探针与行号 Diff
- `runMemberTurn` 挂载 250ms 流式探针，实时检测底层 `session.events` 中的 `tool/call` 与 `tool/result`；
- 通过 SSE 实时向前端广播 `assignment:updated`，驱动中央对话流气泡实时展示工具调用状态；
- `edit` 工具调用必须智能解析提取行号差异（如 `+29 -14`），`bash` 提取清晰描述，工具执行失败显式标红（`isError` 标签）；
- 详见：[docs/tasks/phases/p77-central-live-execution-status/README.md](../tasks/phases/p77-central-live-execution-status/README.md)、[docs/tasks/phases/p82-official-like-central-execution/README.md](../tasks/phases/p82-official-like-central-execution/README.md)、[docs/tasks/phases/p86-native-tool-row-adapter/README.md](../tasks/phases/p86-native-tool-row-adapter/README.md)。

### 1.3 多网关 Prompt Cache 命中率解析与真实账本
- 彻底解决官方缓存命中显示为 0% 的问题，对齐 DSH 官方 `TurnUsagePanel` 逻辑；
- 兼容主流模型厂商的 Cache 计量字段：
  - OpenAI / DeepSeek: `prompt_cache_hit_tokens`
  - Anthropic / 标准兼容: `prompt_tokens_details.cached_tokens`
  - AWS Bedrock / OpenClaw: `cache_read_input_tokens`
- 缓存命中百分比公式：`cachePercentage = prompt_cache_hit_tokens / (prompt_tokens + prompt_cache_hit_tokens) * 100%`；
- 详见：[docs/tasks/phases/p88-official-tools-and-cache-metrics/README.md](../tasks/phases/p88-official-tools-and-cache-metrics/README.md)。

### 1.4 结构化交付卡片与确认后执行事务
- 专员完成任务后交付 Markdown 结构化卡片（`agent-result` 块），支持状态（`passed`/`failed`/`blocked`）、证据与下一步动作；
- 针对危险文件操作或架构修改，通过 `group_chat_transaction_create` 创建待确认卡片，经用户或 Commander 批准后方可执行；
- 详见：[docs/tasks/phases/p6-structured-agent-result/README.md](../tasks/phases/p6-structured-agent-result/README.md)、[docs/tasks/phases/p67-approve-run-transaction-card/README.md](../tasks/phases/p67-approve-run-transaction-card/README.md)。

### 1.5 团队协同工具箱 (Captain Task Protocol)
- 团队成员协同标准工具：
  - `group_chat_task_claim`：领取/恢复任务
  - `group_chat_task_block`：标记阻塞并上报原因
  - `group_chat_task_handoff`：任务移交指定角色
  - `group_chat_task_report`：向 Commander 上报结果与产物证据
  - `group_chat_task_close`：Commander 收口关闭任务节点
- 详见：[docs/tasks/phases/p65-captain-task-protocol/README.md](../tasks/phases/p65-captain-task-protocol/README.md)、[docs/tasks/phases/p68-team-coordination-tools/README.md](../tasks/phases/p68-team-coordination-tools/README.md)。

---

## 2. 自动化回归命令
- `npm run test:central-live-status` — 中央执行状态可见性回归
- `npm run test:native-tool-row-adapter` — 原生工具行号 Diff 与展示适配回归
- `npm run test:approve-run-transaction-card` — 确认后执行事务卡片回归
- `npm run test:team-coordination-tools` — 团队协同工具箱回归

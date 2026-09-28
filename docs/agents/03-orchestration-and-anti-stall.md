# 03-orchestration-and-anti-stall.md — 调度编排、防死循环与自愈机制

本指南聚焦于 **多 Agent 调度状态机、Universal Master Handoff 闭环、多阶段 DAG 门禁以及任务看门狗机制**。

> 命名契约：对外包名为 `@dsh-external/dsh-let-them-cook`；`dsh-group-chat` 仅表示内部运行时 namespace 与历史稳定标识。

---

## 🏛️ 核心架构契约

### 1. Universal Master Handoff（完工必回主控）
- 专员（SubAgent）完成阶段任务后，默认且必须将上下文和结果回传总指挥官（commander）进行统一收口与审批。
- 严禁专员之间私下相互自激触发或死循环客套，中枢自动拦截无意义发言。

### 2. 阶段流转双语模糊识别
- 支持中英文自然语言意图判定（“通过 / 批准 / 同意推进 / Approved / LGTM”），主控审核后自动驱动 DAG 流转至下一阶段。

### 3. 看门狗超时报警与显式中断
- 建立任务级与轮次级看门狗监控。任务执行超时立即显式熔断标记为 `failed`，并向指挥官邮箱注入报警信。
- 拒绝任何假死等待与隐式静默失败。

### 4. 动态任务预算与分层
- 快速单任务执行轻量快速模式；复杂多阶段工程任务分配充足交互配额（最高 24 轮），支持阶段并发执行。

### 5. DAG 阶段自动化门禁（Stage Gates）
- 每个阶段配置自动化验收命令（`verifyCommand`）。阶段晋级时强制执行门禁检验，未达标直接阻断流转。

### 6. DSH 官方 Subagent 原生编排与纯血融合 (Official Subagent Integration)
- **终态 Assignment 使用官方 one-shot seam**：角色专员（`researcher`、`backend`、`frontend`、`qa`、`writer`）通过当前主会话的精确 live parent Agent 调用 `ctx.subagents.start('spawn', ...)`；唯一完成边界是 `SubagentRun.result`，并始终执行 `run.dispose()`。持续对话才使用 Continuable Subagent，两种生命周期禁止混用。
- **零模糊别名、零 Prompt 弱降级（Zero Fallback）**：彻底剔除工具正则别名映射（`SEMANTIC_TOOL_ALIASES`）与“工具不支持则降级为 Prompt 约束”的隐式妥协。专员工具白名单由官方 `toolFilter: { allow }` 强制执行，空名、重复名或环境缺失立即 Loud Throw。
- **精确父会话所有权**：工具触发必须由 `exec.agent` 提供父 Agent，自动后续调度只能按 `room.masterSessionId` 从 `ctx.agents` 取得同一 live 实例；父 Agent 缺失或不一致时终止 Assignment，禁止读取全局当前房间或 Session 猜测。
- **工作流事件与官方投影深度融合**：专员任务执行全程派发 `tool-workflow/agent-start` 与 `tool-workflow/agent-end` 原生事件，并经由 `native-projection.ts` 投影至当前 DSH Session。

---

## 🧪 对应标准验证套件
- `__tests__/suite-02-workflow-dag.cjs`（DAG 依赖与自动化门禁）
- `__tests__/suite-03-runtime-anti-stall.cjs`（防死锁、看门狗报警与主控回传）

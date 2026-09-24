# 02-tools-and-ledger.md — 原生工具调用、流式状态机与计费审计

本指南聚焦于 **DSH 底座原生工具直通、实时工具流式广播、结构化结果解析与 Prompt Cache 计费核算**。

> 命名契约：对外包名为 `@dsh-external/dsh-let-them-cook`；本文若出现 `dsh-group-chat`，仅指内部运行时 namespace，不指安装包。

---

## 🏛️ 核心架构契约

### 1. DSH 底座原生工具直通（Native Tool Passthrough）
- 赋予专员真实的 DSH 底座能力（`read` / `edit` / `bash` / `grep` / `glob`），严禁使用任何未落地的虚拟假工具。
- 所有工具调用经过 `normalizeToolNames()` 规整，杜绝因名称别名造成的权限拦截。

### 2. 毫秒级流式 Diff 探针
- 实时广播工具执行状态。对于文件编辑（`edit`）自动精确解析 `+add -del` 行号差异与代码补丁指标。
- bash 工具实时捕获执行意图与退出状态码，执行失败显式标红。

### 3. 真实 Prompt Cache 计费审计
- 跨模型网关精准解析 `cached_tokens`，基于真实缓存读取量精确计算缓存命中率（`cacheRead / (inTokens + cacheRead + cacheWrite)`），杜绝计费误报为 0%。

### 4. 结构化交付结果（Structured Agent Result）
- 专员交付结果采用统一的结构化代码块（`agent-result`），包含明确的 `RESULT_STATUS`、`SUMMARY`、`NEXT` 与 `EVIDENCE`。
- 渲染层在中央消息流中无损剥离控制块，仅展示纯净的人类可读正文，控制块直接驱动状态机流转。

### 5. 团队协同工具箱（Captain Task Protocol）
- 提供 `claim` / `block` / `handoff` / `report` / `close` 五大标准协同原子，确保多 Agent 分工互斥且有序。

---

## 🧪 对应标准验证套件
- `__tests__/suite-04-tools-and-ledger.cjs`（原生工具直通、Diff 提取与账本计费）

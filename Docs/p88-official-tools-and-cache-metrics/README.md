# P88 原生工具流式展现、缓存命中统计与人机协同交互治理 (Official-like Native Tools, Cache Metrics & Human-in-the-Loop Interaction)

## 一、背景与问题根因

在深度使用中，用户发现了与官方 DSH 体验不一致的几大核心痛点：
1. **对话中无工具执行卡片**：各角色在执行任务时，无法像官方单聊一样动态显示「读取」、「编辑」、「Bash」、「Grep」的状态机，也看不到代码行号差异（如 `+29 -14`）和执行失败的错误卡；
2. **缓存命中显示为 0%**：面板上始终显示「缓存命中 0%」，即使多轮对话使用了 DeepSeek 等天然支持 Prompt Caching 的模型；
3. **账本运行统计全为 0**：调用数十轮，总 Token 计数和各角色消耗始终显示为 0；
4. **主 Agent 缺乏人机确认**：乔布斯（总指挥官）在多 Agent 内部闭环推进，关键里程碑节点从不主动与人类用户交互确认。

经过对 DSH 底座源码（`@deepseek-ai/dsh-tools`、`@deepseek-ai/dsh-client-ui-chat`、`@deepseek-ai/dsh-llm-deepseek`）及插件调度的地毯式排查，锁定了以下底层断点：

---

## 二、底层断点分析与避坑指南 (Key Pitfalls & Architectural Lessons)

### 1. 避坑 1：工具权限白名单虚设陷阱（Native Tool Whitelist Disconnect）
- **现象**：Agent 40 多轮完全不调用 `read`、`edit`、`bash`，只在文本中声称执行了操作。
- **根因**：
  - DSH 底座注册的实际工具名称为：`read`, `write`, `edit`, `glob`, `grep`, `bash`, `web_search`, `web_fetch`, `read_image`；
  - 旧代码在 `room-manager.ts` 中给各角色配置的是抽象虚拟名 `tool_fs` 与 `tool_jobs`，测试角色 `qa` 甚至只有 `group_chat_room_status`；
  - `src/compat/dsh.ts` 中的 `SEMANTIC_TOOL_ALIASES` 没有包含原生工具名称，且解析时使用 `.find()` 仅能取一个别名；
  - 最终导致所有原生工具被判为 `missing` 过滤丢弃，并在 System Prompt 中注入了：
    `【工具权限】当前角色本轮未开放任何外部工具。你只能基于已给上下文发言；不得声称已经搜索、读取文件或执行命令。`
- **治理策略**：
  - 在 `room-manager.ts` 中全员直接赋予原生工具名称；
  - 修复 `SEMANTIC_TOOL_ALIASES`，支持一对多全量映射（如 `tool_fs` 映射为 `read`, `write`, `edit`, `glob`, `grep`）；
  - 测试角色 `qa` 开放 `bash`、`read`、`grep`，赋予真实跑测试和代码走查能力。

### 2. 避坑 2：执行中工具事件无流式广播（Live Tool Streaming Gap）
- **现象**：任务执行过程中中央气泡只有一根静态进度条，看不到一个个工具的跳动。
- **根因**：
  - SubAgent 通过 `ctx.agents.create` 启动独立 Session 运行，原逻辑使用 `await waitForMemberIdle` 阻塞等待完结；
  - 执行过程中没有主动将底层 Session 产生的实时 `tool/call` 与 `tool/result` 提取出来广播给前端。
- **治理策略**：
  - 在 `runMemberTurn` 执行期间挂载 250ms 定时探针，实时将 session events 中的工具执行记录提取为 `currentCalls`；
  - 触发 `onProgress` 回调，实时写入 `assignment.toolCalls` 并通过 SSE 向前端广播 `assignment:updated`；
  - 在中央正在执行的气泡（`activeAssignments`）中直接渲染 `GroupChatToolRow`，工具运行、成功、失败、耗时实时跳动。

### 3. 避坑 3：官方同款 Diff 统计与 Bash 语义提取（Tool UI Alignment）
- **现象**：工具卡片信息单一，没有官方单聊中直观的文件路径、变更行数和任务标题。
- **治理策略**：
  - 对 `edit` 工具：从入参 `old_string` 与 `new_string` 自动提取修改行数，渲染 `+29 -14` 红绿药丸标签；
  - 对 `bash` 工具：优先提取参数中的 `description`（如 `Add commander and writer to model-settings.json`）；
  - 对 `grep` / `glob`：直接提取搜索模式和匹配关键字；
  - 对执行失败：当存在非零 exit code 或错误时，打上官方同款的红底白字 `失败` 标签。

### 4. 避坑 4：Prompt Cache 字段碎片化与官方口径对齐（Cache Metrics Parsing）
- **现象**：面板无脑显示「缓存命中 0%」。
- **官方源码机制**（参考 `@deepseek-ai/dsh-client-ui-chat` 源码）：
  ```javascript
  const cacheHit = usage.cacheReadTokens === void 0 ? null : formatCacheHitPercent(usage.cacheReadTokens, usage.totalTokens - usage.outputTokens, 1);
  // 当 cacheHit 为 null 时，官方根本不会显示“缓存命中 0%”
  cacheHit !== null && <dt>缓存命中</dt><dd>{cacheHit}%</dd>
  ```
- **根因**：
  - 上游不同模型/代理网关返回的缓存字段差异巨大：DeepSeek 用 `prompt_cache_hit_tokens`，OpenAI 兼容规范用 `prompt_tokens_details.cached_tokens`，Anthropic 用 `cache_read_input_tokens`；
  - 旧代码只读取单一字段 `usage.cacheReadTokens`，全部漏解析；
  - 且在无缓存数据时，粗暴拼接 `缓存命中 0%`，引起用户误判。
- **治理策略**：
  - 在 `agent-runtime.ts` 中全方位解析各厂商缓存字段：
    ```typescript
    const cacheRead = usage.cacheReadTokens ?? usage.prompt_tokens_details?.cached_tokens ?? usage.prompt_cache_hit_tokens ?? usage.cache_read_input_tokens ?? usage.cached_tokens ?? 0;
    const cacheWrite = usage.cacheWriteTokens ?? usage.prompt_cache_miss_tokens ?? usage.cache_creation_input_tokens ?? 0;
    ```
  - 对齐官方 DSH 统计口径：在多 Agent 连续对话中，利用前置的团队宪章与花名册命中服务端 KV Cache，准确计算并呈现 `缓存命中 68%`；无缓存数据时不误报虚假的 `0%`。

### 5. 避坑 5：主 Agent 必须主动进行人机确认（Commander Human-in-the-Loop Protocol）
- **现象**：乔布斯（主 Agent）自顾自闭环，全程不向人类负责人请示汇报。
- **治理策略**：
  - 在 `ContextProjection` 和总指挥官的 `System Prompt` 中强制植入【总指挥官人机交互守则】：
    1. 在关键里程碑节点（需求调研完成、架构方案确定、安全测试放行、最终交付结题），必须向 `@人类负责人` 进行简明扼要的高层汇报，并主动征询负责人的确认意见；
    2. 遇到重大架构取舍、技术选型或关键放行时，主动列出选项并征求人类负责人确认；
    3. 杜绝纯机器人在暗地里自闭环，让人类负责人始终掌控项目主权。

---

## 三、验证与测试

- **构建测试**：`npm run build:all` 顺利打包 `host` 与 `client`；
- **矩阵回归**：执行 `npm run test:matrix`，全部 50 项集成测试 100% 通过（Exit Code: 0）；
- **生产发布预检**：`npm run preflight` 验证文档与制品规范全部达标。

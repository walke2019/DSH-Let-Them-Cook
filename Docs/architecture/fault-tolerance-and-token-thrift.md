# DSH 多 Agent 群聊插件：容灾降级、工具去重与 Token 节俭架构规格

---

## 1. 工具防重复与共享总线 (Shared Tool Bus)

在群聊协同场景中，多个 Agent 对相同任务可能产生并发或重复调用（特别是 `web_search`、网页爬取、长文本分析等重型工具）。

### 1.1 架构设计
```
[Agent A 发起工具调用]        [Agent B 发起工具调用]
          │                             │
          └──────────────┬──────────────┘
                         ▼
        ┌─────────────────────────────────┐
        │  Room-Scoped Shared Tool Bus    │
        ├─────────────────────────────────┤
        │ 1. 提取 normalized_args_hash    │
        │ 2. 检查 Room Tool Cache         │
        │ 3. 拦截 In-Flight 并发请求      │
        └────────────────┬────────────────┘
                         │
        ┌────────────────┴────────────────┐
   [Cache Miss]                      [Cache Hit / In-Flight]
        │                                 │
   真正执行工具调用                  直接复用结果/Promise，0延迟
        │                                 │
   写入缓存池 ────────────────────────────┘
```

### 1.2 关键实现技术
1. **参数归一化与哈希（Normalized Args Hash）**：
   - 对搜索关键词、过滤项进行小写化、空白去除与同义参数规整；
   - 生成 `hashKey = sha256(roomId + ":" + toolName + ":" + JSON.stringify(sortedArgs))`。
2. **并发排队阻断（In-Flight Promise Hook）**：
   - 维护 `Map<string, Promise<ToolResult>>`；
   - 当同一个哈希的请求在微秒级同时到来时，后续请求直接 `await` 首个尚未结算的 Promise，杜绝外部 API 踩踏。
3. **情报员授权隔离（Role-Based Capability Stripping）**：
   - 将搜索外呼工具仅分配给 `@researcher` 角色，其他角色在 System Prompt 中受限，仅能通过群内沟通请求情报员协助，物理层面避免非必要调用。

---

## 2. 模型调用弹性级联降级 (Model Fallback & Fault Tolerance)

### 2.1 降级模型链配置规范
在 `AgentProfile` 中配置弹性容灾策略：

```typescript
export interface ModelRef {
  provider: 'deepseek' | 'pi-ai' | 'local' | string;
  model: string;
  temperature?: number;
}

export interface ResiliencePolicy {
  // 级联降级模型链
  fallbackModels: ModelRef[];
  // 单模型最大重试次数 (针对 500/网络抖动)
  maxRetriesPerModel: number;
  // 指数退避间隔基数 (毫秒)
  retryBackoffMs: number;
  // 超时阈值 (毫秒)
  timeoutMs: number;
}

export interface AgentProfile {
  id: string;
  name: string;
  llmConfig: ModelRef;
  resiliencePolicy?: ResiliencePolicy;
}
```

### 2.2 错误类型与分级处置矩阵

```
                 [ 发起 LLM 模型调用请求 ]
                            │
              ┌─────────────┴─────────────┐
           [成功]                       [异常捕捉]
              │                            │
          返回流式结果           ┌─────────┴─────────┐
                                 │ 分析错误状态类型   │
                                 └─────────┬─────────┘
                                           │
         ┌───────────────────┬─────────────┴───────┬───────────────────┐
         ▼                   ▼                     ▼                   ▼
     【429 限流】       【502/504超时】      【上下文超长】       【格式/解析错误】
         │                   │                     │                   │
    不重试，立即触发    指数退避重试 $N$ 次;  触发紧急上下文摘要;    注入修正 Prompt 自愈修复;
    Fallback 下一模型   失败再切 Fallback     只保留人设+最新任务    超 2 次则降级模型
```

1. **429 速率限制（Rate Limited）**：
   - 立即将当前 Provider 标记为处于“冷却期（Cooldown）”30 秒，不再向其重试；
   - 顺次无缝激活 `fallbackModels[0]` 执行当前发言。
2. **网络超时（Timeout / ETIMEDOUT）**：
   - 执行指数退避重试（1s ➔ 2s）；
   - 超出最大重试次数后切入 Fallback 模型。
3. **上下文超长（Context Length Exceeded）**：
   - 不盲目切换模型（因为大上下文在下个模型可能更贵甚至同样爆窗口）；
   - 执行**紧急剪枝协议（Emergency Pruning）**：将中间层的未提及背景闲聊全部清除，只保留该角色核心 Persona + 共享黑板 + 最新触发提问，就地重新发起请求。
4. **终极兜底保障**：
   - 若链上所有模型均不可用，调度引擎不会让前端陷入白屏或无限加载，而是优雅生成系统级故障卡片并暂停该角色发言流，等待人工干预。

---

## 3. 极致 Token 节俭协议 (Token Thrift Protocol)

### 3.1 Prompt Caching 友好型布局
主流模型供应商（DeepSeek、Anthropic、OpenAI）均依赖严格的**公共前缀匹配**命中上下文缓存（KV Cache），享受高达 50%~90% 的费用减免与极低首字延迟。

系统严格规范装配顺序：
```
┌───────────────────────────────────────────────────────────┐ ── 静态稳定区
│ 1. 固定群规 (Shared Constitution)                         │ (命中 90%+ 缓存)
│ 2. 静态成员名册与职责清单 (Group Roster)                   │
├───────────────────────────────────────────────────────────┤ ── 半静态区
│ 3. 当前 Agent 专属私有人设 (Role Persona)                  │ (命中角色级缓存)
├───────────────────────────────────────────────────────────┤ ── 动态更新区
│ 4. 共享黑板 (Shared Scratchpad 摘要)                      │
│ 5. 待处理背景闲聊摘要 (Pending Mini-Headers)              │
│ 6. 最新触发消息与上下文指令                                │
└───────────────────────────────────────────────────────────┘
```

### 3.2 待处理闲聊“短语化标头压缩”
在严格 `@Mention` 模式下，对于其他成员之间的多轮闲聊，拒绝无脑塞入完整多轮对话，而是转换为空前轻量的索引标头：
```markdown
[Background Context]
- 10:15 [User]: 确认需要支持 5000 TPS 峰值
- 10:16 [PM]: 已更新需求文档第 3 节
```
每条背景消息仅耗费 5~10 个 Token，相比原始消息节省 80%~95% 的上下文占用。

### 3.3 工具输出剪枝与溢出外置
- 搜索或网页抓取结果在进入上下文前，由过滤中间件按查询相关度打分截断至 Top-N 段落（默认不超过 800 字）；
- 原始完整大文本保存于本地缓存目录，在上下文内仅保留结构化核心字段与摘要引用。

### 3.4 共享黑板滚动替换机制
- 当群聊持续超过 15 轮时，启动自动背景异步汇总；
- 将前序达成的共识凝练到 300 字以内的“共享黑板（Shared Scratchpad）”中；
- 被凝练的早期消息从 Agent 的活跃上下文序列中移出，使上下文始终维持在健康低水位。

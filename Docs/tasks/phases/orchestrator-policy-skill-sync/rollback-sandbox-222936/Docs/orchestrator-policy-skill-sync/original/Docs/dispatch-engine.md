# DSH 多 Agent 群聊调度引擎运作原理与防死循环协议

---

## 1. 行业参考与前沿实践调研

在构建企业级多 Agent 协作系统时，业界两个标志性开源项目提供了深刻的工程洞见：
1. **NousResearch Hermes Agent (Bot Mode)**：
   - 将独立 Agent 规范化为具名智能体名册（Roster of Named Bots），各具独立的 Persona、Avatar 与绑定模型；
   - 采用串行轮次（Serial Rounds）控制群聊交互，将单次人类唤醒后的互动次数严格限制在 2~3 轮以内；
   - 强调外呼能力剥离（Capability Stripping）：禁止 Bot 自主直接向外部 IM 或私信管道发信，所有消息统一收口于群聊会话总线；
   - 统一使用规范化的归一化标头属性进行消息归属投递（`[Message from agent '<role>']`）。
2. **OpenClaw 消息调度与静默契约 (Silence Token Protocol)**：
   - 引入 **`NO_REPLY` 静默标记**（大小写不敏感）：在自由争鸣或群广播模式下，若 Agent 评估当前议题与其专长不符或前序回复已解决问题，输出且仅输出 `NO_REPLY`；
   - 调度中枢在检测到静默标记后自动拦截，零渲染、零广播，彻底消除群聊中的“车轱辘话”与无意义客套；
   - 区分激活模式：`严格 @Mention 模式`（默认）与 `常驻自由争鸣模式`（结合静默提示词）。
3. **OmniRoute 弹性路由与容灾哲学**：
   - 异构模型动态路由与按需解析；
   - 4 级阶梯式级联降级（Fallback Chain）与 429 限流冷却池（Cooldown）；
   - Token 极致压缩与工具结果剪枝，保障上下文长期处于高性价比水位。

---

## 2. 调度引擎核心架构与流水线

群聊调度引擎（GroupChat Engine）作为 Cordis 全局服务运行，负责在用户输入、Agent 输出与多角色协同之间做状态仲裁。

```
                       [ 人类用户或系统触发新消息 ]
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │     1. Inbound Inspector     │
                     │  - 解析文本内容与 @Mention 标识  │
                     │  - 校验当前房间 DispatchMode   │
                     └──────────────┬───────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
   【严格 @Mention】          【主持人编排模式】         【自由争鸣模式】
   - 仅被 @ 的成员进入        - Moderator Agent 先行    - 全员并行评估专长
   - 显式发言候选队列         - 由主持人裁决下一个发言者 - 结合 NO_REPLY 过滤
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │    2. Turn Loop & Budget     │
                     │  - 检查当前 interactionRound    │
                     │  - 若 >= maxTurnsPerPrompt: 熔断│
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │   3. Context Projection      │
                     │  - 提取 Shared Constitution  │
                     │  - 注入 Role Persona         │
                     │  - 注入 Shared Scratchpad 备忘│
                     │  - 压缩未提及的背景闲聊       │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │ 4. Execution & Waterfall     │
                     │  - 拦截 agent/request 映射模型│
                     │  - 容灾级联降级与重试机制     │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │ 5. Outbound Arbiter          │
                     │  - 拦截 NO_REPLY (静默拦截)   │
                     │  - 写入 Room Ledger (Token账本)│
                     │  - 广播至 Web Client 气泡流  │
                     └──────────────────────────────┘
```

---

## 3. 防死循环与自激震荡铁律 (Anti-Loop Circuit Breaker)

多 Agent 协同最容易出现的灾难性故障是“循环致谢”与“无限争鸣”导致 Token 迅速耗尽。为此，调度引擎实施 4 重确定性屏障：

### 3.1 单指令最大轮次硬性熔断（Max Turns Per Prompt）
- 每次收到人类消息时，初始化 `interactionRound = 0`；
- 无论是主持人指派、自由争鸣还是 Agent 之间的接力，每有一名 Agent 发言完毕，`interactionRound++`；
- 一旦 `interactionRound >= safetyPolicy.maxTurnsPerPrompt`（默认 5 轮），调度引擎**立即切断一切后续发言触发**，并将房间置为 `idle_waiting_user` 状态；
- 前端同时展示系统级提示卡片：“*已达到单次会话最大协作轮次（5 轮），等待人类进一步指令*”。

### 3.2 默认禁止 Bot 自激触发（Bot-to-Bot Prohibition）
- 所有消息信封携带 `sender.kind` 属性（`user` | `agent` | `system`）；
- 若消息发送方为 `agent`：
  - 默认情况下（`enableBotToBotTrigger === false`），即使 Agent 在发言内容中提到了 `@架构师`，该文本仅作为人类界面的视觉呈现，调度引擎绝不将其纳入下一轮候选触发；
  - 只有在人类明确开启 `enableBotToBotTrigger` 且未触及最大轮次时，才允许受控流转。

### 3.3 静默标记拦截器（Silence Token Filter）
- 在自由争鸣模式或广播模式下，Agent 人设末尾均强制注入系统规约：
  > "如果你认为当前问题不需要你补充，或者其他角色的发言已经充分解答，你必须只输出：NO_REPLY"
- 当 Agent 的流式或终态输出匹配 `/^\s*NO_REPLY\s*$/i` 时：
  - 调度引擎当场静默吞下，不写入公开消息流，不推送到前端气泡流；
  - 记录审计日志：`[Audit] Agent <id> chose silence.`；
  - 避免无产出的废话浪费前端排版空间与用户注意力。

### 3.4 严格 @Mention 优先与空转归零
- 在最推荐的 `mention_only` 模式下：
  - 若人类发言未 @ 任何角色，消息默认仅被主助手接收或直接放入未读背景池；
  - 无被指名角色时绝不唤醒多 Agent 集群，杜绝“全员开机”造成的资源浪费。

---

## 4. 上下文投影与 Token 节俭协议 (Context Projection)

群聊由于存在多方发言，历史记录长度增长速度远高于单聊。调度引擎采用**分层投影与短语化标头压缩**技术：

### 4.1 消息信封标准化
投递给各 Agent 的对话历史不会透传原始混乱的系统消息，而是经过投影管道规整：
```
[Member: 系统架构师 (architect)]: 方案建议采用 CQRS 模式与事件溯源...
[Member: 安全专家 (security)]: 需注意事件总线的数据加密与审计日志不可篡改...
```

### 4.2 未提及闲聊的短语化标头打包 (Pending Compression)
若某 Agent 连续 5 轮未被提及，在其被重新唤醒时，调度引擎不会把这 5 轮的完整对话文本塞入其 Prompt，而是将其压缩为轻量索引：
```markdown
[Background Activity Digest]
- [User]: 确认高可用需求为 99.99%
- [Architect]: 确定双机热备架构
- [DBA]: 评估主从复制延迟
```
每条历史消息仅耗费 6~10 Token，节省 85% 以上的历史窗口空间。

### 4.3 共享黑板（Shared Scratchpad）
- 房间内维护唯一的实时 Markdown 备忘录；
- 沉淀阶段性结论（如：“*已确认的技术选型：PostgreSQL 16 + Redis 7*”）；
- 每次 Agent 发言均可阅读黑板，避免在群聊中反复确认已达成的共识。

# DSH 多 Agent 群聊插件：DSH 规范接入标准与高可扩展性架构规约

---

## 1. 关键生产级场景考量

在实际多 Agent 群聊业务中，以下 5 项机制是保障企业级可用性的核心：

### 1.1 跨会话持久化与断点自愈 (Persistence & Rehydration)
- **元数据绑定**：群聊房间状态机（成员名册、黑板内容、调度模式、轮次计数）持久化于 DSH 会话的 `metadata.groupChat` 中。
- **自愈加载**：当 DSH 启动或用户刷新页面触发 `session/load` 时，调度引擎自动拦截并根据元数据重新唤醒各角色绑定的 Agent 实例，恢复发言信箱与缓存。

### 1.2 多角色 Token 记账与成本审计 (Cost Accounting)
- 调度引擎内置 `TokenLedger` 账本，挂载在 `agent/response` 钩子上；
- 精准统计群内每个角色（Agent ID）消耗的 `prompt_tokens`、`completion_tokens` 与 `cache_read_tokens`；
- 在 Web 前端提供各角色的实时消耗看板与成本分析。

### 1.3 人类绝对裁判权 (Approval Gate)
- 当任何 Agent 发起写文件、执行终端命令等高危工具调用时，调度引擎拦截请求并向前端推送待审批卡片；
- 只有人类操作者能够点击“批准/拒绝”，严格阻断 Bot 相互之间审批特权。

### 1.4 共享产物池 (Artifacts Sharing)
- Agent 之间共享大型代码文件、架构图等产物时，生成统一句柄 `artifact://<roomId>/<artifactId>`；
- 其他 Agent 仅需在上下文中引用句柄，按需读取，避免大段代码在聊天流中反复刷屏造成上下文浪费。

### 1.5 成员动态热插拔 (Dynamic Hot-Swapping)
- 支持在讨论进行中随时邀请新 Agent 角色进群；
- 新角色入群时，引擎为其快速投递“共享黑板 + 讨论背景摘要”，无需重置会话即可迅速参与协同。

---

## 2. 接入 DeepSeek Harness 代码的规范标准性

本插件作为 Cordis 插件运行在 DSH 微内核上，严格恪守 DSH 的开发规范：

### 2.1 Cordis 依赖注入与生命周期（Lifecycle Standards）
```typescript
import { Context, Service } from 'cordis';

export const name = 'dsh-group-chat';
// 显式声明依赖的服务
export const inject = ['agents', 'sessions', 'llm', 'credentials', 'webServer'];

export class GroupChatCoordinator extends Service {
  constructor(ctx: Context) {
    // 注册为全局服务 ctx.groupChat
    super(ctx, 'groupChat', true);

    // 所有监听器与定时任务挂载在 ctx.effect 作用域内，确保卸载即净
    ctx.effect(() => {
      ctx.logger.info('[dsh-group-chat] Service activated.');
      return () => {
        ctx.logger.info('[dsh-group-chat] Service disposed.');
      };
    });
  }
}
```

### 2.2 Dual-Face 双端包结构标准
- **Host 端（Node.js/Cordis）**：入口为 `./lib/index.js`，通过 `tsc` 编译；
- **Client 端（Web/React）**：导出为 `./client`，入口为 `./dist/client.js`，通过 `tsdown` 打包；
- 契合 `dev_scaffold_plugin`、`dev_build_plugin`、`dev_inject_plugin` 自动化构建流水线。

### 2.3 动态凭据安全标准
- 严禁在群聊插件内明文保存任何 API Key；
- 异构模型的认证统一使用 DSH 凭据代号（Credential Reference），调用前由 `ctx.credentials.resolve()` 按需解密，绝不在持久化存储中暴露敏感凭据。

---

## 3. 代码与业务的高可扩展性设计

### 3.1 调度策略的策略模式插件化 (Strategy Pattern)
```typescript
export interface IDispatchStrategy {
  readonly modeName: string;
  decideNextSpeakers(context: DispatchContext): Promise<DispatchDecision>;
}

export class StrategyRegistry {
  private strategies = new Map<string, IDispatchStrategy>();

  register(strategy: IDispatchStrategy) {
    this.strategies.set(strategy.modeName, strategy);
  }

  get(modeName: string): IDispatchStrategy {
    return this.strategies.get(modeName) || this.strategies.get('mention_only')!;
  }
}
```
通过该抽象，未来可随时挂载新的编排算法（如 DAG SOP 流水线模式、投票表决模式、竞价争鸣模式），无需改动调度核心。

### 3.2 消息流水线中间件 (Middleware Pipeline)
消息在进出群聊总线时经过可扩展的洋葱模型管道：
```typescript
export type GroupChatMiddleware = (
  msg: GroupMessageEnvelope, 
  next: () => Promise<void>
) => Promise<void>;

// 支持挂载 DLP 数据防泄密、代码语法检查、多语言翻译等可插拔中间件
```

### 3.3 跨端渠道解耦 (Multi-Channel Adapters)
- 群聊引擎（GroupChatCoordinator）只负责纯粹的角色管理、上下文投影与发言仲裁；
- 将前端视作一个普通的“输入输出适配器（Adapter）”；
- 后续可无缝外挂 `TelegramAdapter`、`QQOneBotAdapter`、`FeishuAdapter`，将同一个多 Agent 团队带入真实社群中协同办公。

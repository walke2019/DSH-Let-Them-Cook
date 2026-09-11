# AGENTS.md — DSH Let Them Cook (开整天团) AI Agent 编码、UI 规范标准及避坑开发指南

本文件是面向所有参与 `DSH Let Them Cook` (DSH 开整天团，包标识 `@dsh-external/dsh-let-them-cook`) 维护、重构与功能演进的 **AI Coding Agent**，以及在群聊多智能体协同中运行的 **业务 Participant Agent** 的最高工程宪法与避坑指南。

凡是在本项目中编写代码、挂载 DSH 扩展插槽、设计 UI 交互样式、处理运行时事件流或调度工作流任务，必须严格遵守以下契约！

---

## 零、项目文档体系架构与引入导航 (Project Documentation Architecture)

本项目遵循清晰严谨的三层文档体系，严格实行“根目录纯洁性”纪律，严禁在根目录下随意新建散落文档：

| 文档路径 | 文档角色与定位 | 核心读者与用途 |
| :--- | :--- | :--- |
| **`README.md`** | **业务定位与产品说明书** | 面向全体用户与开发者：阐述项目核心价值、架构边界图、业务流转时序图及完整的扩展安装部署运行指南。**必须默认英文编写，顶部提供中文切换**。 |
| **`AGENTS.md`** (本文件) | **AI Agent 编码、UI 规范与避坑开发宪章** | 面向 AI Coding Agent 及群聊业务 Agent：强制性工程铁律、DSH 扩展插槽契约、UI 零污染规则与避坑开发宪章。**采用规范索引+引用 Docs 专项文档机制**。 |
| **`Docs/README.md`** | **技术方案与演进索引中心** | 面向深度架构研究与回归维护：汇集 P1~P88 全阶段演进设计、单测报告、性能分析与避坑专著。 |

---

## 🧭 核心规范与避坑专项文档分类映射表 (Norm-to-Docs Classification Matrix)

为了防止 `AGENTS.md` 过于冗长，后续新增规则和踩坑记录必须**按分类引用 Docs 专项文档**，建立清晰的分类索引体系：

### 1. 🖥️ UI 布局、插槽生命周期与交互规范 (UI & Lifecycle Seams)
- **安全中间对话视图与 prepare 契约**：参见 [Docs/p14-safe-middle-conversation-tab/README.md](./Docs/p14-safe-middle-conversation-tab/README.md)、[Docs/p44-source-dialog-prepare-diagnostic/README.md](./Docs/p44-source-dialog-prepare-diagnostic/README.md)
- **HUD 布局避让、右侧安全缝与 Pointer Capture**：参见 [Docs/p8-hud-overlay-layout/README.md](./Docs/p8-hud-overlay-layout/README.md)、[Docs/p72-hud-message-margins/README.md](./Docs/p72-hud-message-margins/README.md)
- **源版对话隔离与状态清理（零污染红线）**：参见 [Docs/p38-official-source-dialog-guard/README.md](./Docs/p38-official-source-dialog-guard/README.md)、[Docs/p39-source-agent-tab-switch-regression/README.md](./Docs/p39-source-agent-tab-switch-regression/README.md)、[Docs/p40-refresh-state-cleanup-regression/README.md](./Docs/p40-refresh-state-cleanup-regression/README.md)
- **新会话 Blank Hero 入口与自点击防线**：参见 [Docs/p71-new-session-agent-entry/README.md](./Docs/p71-new-session-agent-entry/README.md)、[Docs/p73-hero-left-collapse-adaptation/README.md](./Docs/p73-hero-left-collapse-adaptation/README.md)、[Docs/p83-hero-entry-self-click-guard/README.md](./Docs/p83-hero-entry-self-click-guard/README.md)
- **输入框常驻底部与视口高度自适应**：参见 [Docs/p64-chat-ui-composer-progression/README.md](./Docs/p64-chat-ui-composer-progression/README.md)、[Docs/p79-composer-outside-scroll/README.md](./Docs/p79-composer-outside-scroll/README.md)
- **HUD 顶部语言切换按钮独立化**：参见 [Docs/p76-hud-locale-toggle-header/README.md](./Docs/p76-hud-locale-toggle-header/README.md)
- **长消息渐进式遮罩与双层抽屉折叠**：参见 [Docs/p84-collapsible-message-body/README.md](./Docs/p84-collapsible-message-body/README.md)

### 2. ⚡ 原生工具调用、流式状态机与计费审计 (Tools, Streaming & Ledger)
- **DSH 底座原生工具白名单直通**：参见 [Docs/execution-tool-routing-runtime/README.md](./Docs/execution-tool-routing-runtime/README.md)、[Docs/p88-official-tools-and-cache-metrics/README.md](./Docs/p88-official-tools-and-cache-metrics/README.md)
- **中央消息流 250ms 工具探针与行号 Diff (+add -del)**：参见 [Docs/p77-central-live-execution-status/README.md](./Docs/p77-central-live-execution-status/README.md)、[Docs/p82-official-like-central-execution/README.md](./Docs/p82-official-like-central-execution/README.md)、[Docs/p86-native-tool-row-adapter/README.md](./Docs/p86-native-tool-row-adapter/README.md)
- **多网关 Prompt Cache 命中率解析与真实账本**：参见 [Docs/p88-official-tools-and-cache-metrics/README.md](./Docs/p88-official-tools-and-cache-metrics/README.md)
- **结构化交付卡片与确认后执行事务**：参见 [Docs/p6-structured-agent-result/README.md](./Docs/p6-structured-agent-result/README.md)、[Docs/p67-approve-run-transaction-card/README.md](./Docs/p67-approve-run-transaction-card/README.md)
- **团队协同工具箱 (Claim/Block/Handoff/Report/Close)**：参见 [Docs/p68-team-coordination-tools/README.md](./Docs/p68-team-coordination-tools/README.md)

### 3. 🛡️ 调度编排、防死循环与自愈机制 (Orchestration & Anti-Stall)
- **Universal Master Handoff（完工必回主控）**：参见 [Docs/p81-workflow-commander-delegation/README.md](./Docs/p81-workflow-commander-delegation/README.md)、[Docs/p87-dialog-continuity-and-stall-prevention/README.md](./Docs/p87-dialog-continuity-and-stall-prevention/README.md)
- **阶段流转双语模糊识别（通过/批准/Approved/LGTM）**：参见 [Docs/p87-dialog-continuity-and-stall-prevention/README.md](./Docs/p87-dialog-continuity-and-stall-prevention/README.md)
- **任务看门狗超时机制与报警信自愈**：参见 [Docs/p62-runtime-agent-watchdog/README.md](./Docs/p62-runtime-agent-watchdog/README.md)、[Docs/p63-assignment-watchdog-timeout/README.md](./Docs/p63-assignment-watchdog-timeout/README.md)
- **Agent turn surface fallback 兼容降级**：参见 [Docs/p78-agent-turn-surface-fallback/README.md](./Docs/p78-agent-turn-surface-fallback/README.md)
- **长任务动态 24 轮交互预算与快速任务分层**：参见 [Docs/p51-task-tier-progress/README.md](./Docs/p51-task-tier-progress/README.md)、[Docs/p87-dialog-continuity-and-stall-prevention/README.md](./Docs/p87-dialog-continuity-and-stall-prevention/README.md)
- **DAG 阶段门禁与 verifyCommand 测试验收**：参见 [Docs/p2-workflow-task-dag-quality-gate/README.md](./Docs/p2-workflow-task-dag-quality-gate/README.md)

### 4. 🌐 国际化、主题化与工作区隔离 (i18n, Personas & Workspaces)
- **全栈中英双语运行时与角色全覆盖**：参见 [Docs/p47-bilingual-ui-and-tool-scope/README.md](./Docs/p47-bilingual-ui-and-tool-scope/README.md)、[Docs/p57-agent-runtime-prompt-i18n/README.md](./Docs/p57-agent-runtime-prompt-i18n/README.md)、[Docs/p61-english-source-bilingual-runtime/README.md](./Docs/p61-english-source-bilingual-runtime/README.md)、[Docs/p85-bilingual-role-coverage/README.md](./Docs/p85-bilingual-role-coverage/README.md)
- **中央空态文案主题差异化**：参见 [Docs/p45-theme-aware-central-copy/README.md](./Docs/p45-theme-aware-central-copy/README.md)、[Docs/p75-distinct-theme-empty-copy/README.md](./Docs/p75-distinct-theme-empty-copy/README.md)
- **科技传奇专属调性阵容**：参见 [Docs/p60-tech-legends-theme/README.md](./Docs/p60-tech-legends-theme/README.md)
- **工作区会话隔离与房间持久化**：参见 [Docs/p53-message-ledger-persistence/README.md](./Docs/p53-message-ledger-persistence/README.md)、[Docs/p74-session-scoped-room-binding/README.md](./Docs/p74-session-scoped-room-binding/README.md)

---

## 一、群聊成员智能体（Group Chat Participants）行为守则

### 1. 身份与职责边界（Role Boundaries）
- **专职专责**：每个 Agent 仅代表其绑定的角色（Persona）发言。代码专家只给出技术与代码建议，产品经理只负责需求与场景定义，架构师聚焦边界与设计。严禁越俎代庖或代替其他角色作答。
- **发言精炼**：群聊不同于独立单聊，所有成员必须保持语言精练、直奔主题，单次发言杜绝不必要的客套寒暄（如“很高兴为您解答”、“收到您的指令”等）。

### 2. 发言判定与静默标记（Silence Token）
在非严格 `@Mention` 触发的模式下（如自由争鸣模式）：
- **自评专长相关性**：如果当前议题与您的专长无关，或者前序发言中其他成员的回复已经完全解决问题、无需额外补充，您**必须且只能输出：**
  ```
  NO_REPLY
  ```
- **静默拦截保障**：调度引擎在检测到 `NO_REPLY` 后会自动拦截，不会向群聊下发任何内容，亦不会将此标记暴露给人类用户。

### 3. 跨 Agent 交互与防死循环铁律（Anti-Loop Rules）
- **严禁自激相互致谢**：绝对禁止对其他 Agent 的发言进行无意义的附和、重复夸赞或致谢（如“赞同架构师的方案”、“感谢解答”），避免触发死循环。
- **主动 @ 权限约束**：
  - 群成员 Agent 默认禁止自主触发其他 Agent 执行；
  - 即使在回答中提到了其他角色的昵称（如“@代码审计 建议关注 SQL 注入”），若房间配置未开启 `enableBotToBotTrigger`，该文本仅作为人类界面的视觉提示，**不会自动触发下一步调用**；
  - 一切后续流转必须交由人类用户或群聊中枢确认。

### 4. 外部工具与外呼能力隔离（Capability Stripping）
- 借鉴 Hermes 架构安全规范，群聊中的角色智能体**禁止**具备下列外呼工具：
  - `send_message`：禁止绕过调度器私下向 IM 平台或外部 Webhook 发送独立消息；
  - `modify_shared_memory`：禁止随意覆写全局共享备忘录，仅允许提交建议；
- 所有对话产生的数据统一经过群聊调度中枢（GroupChat Engine）做唯一的投递收口。

---

## 二、项目开发智能体（AI Developer / Coding Agent）工程纪律

当您作为 AI 开发者在此代码库中编写、重构或调试代码时，必须遵循以下工程纪律：

### 1. 文档组织与语言规范（强制约束与避坑铁律）
- **根目录纯洁性**：项目根目录仅允许存放 `README.md` 与 `AGENTS.md` 两个文档，其余任何文档严禁存放在根目录。
- **README 语言规范（国际化红线）**：
  - 根目录 `README.md` **必须默认使用生动、地道、有趣的英文编写**（面向全球开源社区与 DSH 生态标准）；
  - **必须支持中文**：在 `README.md` 顶部提供醒目的语言切换链接（如 `<b>English</b> | <a href="./Docs/README.md">简体中文 (详细文档)</a>`）；
  - **严禁将根目录 `README.md` 主体内容写成纯中文**！中文完整业务、技术与文档索引统一维护在 `Docs/README.md` 与 `/Docs` 目录下。
- **所有后续文档归档**：一切技术设计、API 文档、方案调研、测试报告、会议纪要等，必须全部编写或记录到 `/Docs` 目录下（例如 `/Docs/xxx.md`）。严禁在根目录随意新建 `.md` 或文本文件。
- **模块文档引用机制**：`AGENTS.md` 保持作为核心索引与纲领。后续新增具体模块或排查踩坑时，应优先在 `/Docs/xxx/README.md` 详述，并在 `AGENTS.md` 对应的分类映射表中补充链接索引。

### 2. DSH 微内核集成准则
- **绝不破坏底座**：本插件作为 Cordis 扩展模块运行，所有逻辑通过 `ctx.effect()`、`ctx.on()`、`ctx.webServer`、`ctx.slots` 挂载，**严禁修改 `@deepseek-ai/dsh` 核心源码**。
- **异构模型调用**：必须通过拦截 `'agent/request'` 瀑布流来重写 Provider 与 Model，严禁直接硬编码模型客户端发起未受 DSH 凭据托管的外部 HTTP 请求。
- **状态响应式与清理**：所有挂载的定时器、WebSocket 监听器、事件订阅，必须挂载在 `ctx.effect()` 作用域内，确保插件热重载或卸载时能做到“即插即用、卸载即净”。
- **官方对话兼容红线**：向 `conversation.view` 注入中间视图时必须提供稳定 `id`、`label`、`prepare()` 和组件适配层；禁止在 client entry 直接挂载会接管全局 body 的面板，避免再次触发 `Cannot read properties of undefined (reading 'prepare')` 或影响官方“对话”。
- **布局接管最小化**：插件样式只能作用在本插件根节点或明确的 `body[data-dsh-group-chat-tab-active="true"]` 期间；不得全局隐藏官方 composer、不得长期修改官方 scroll 高度、不得挤压官方中间对话区。右侧 HUD 展开/收起不得调用 `updateLayoutPushWidth()` 或向 `documentElement` 写入会影响官方主布局的宽度变量；如需避让 HUD，只能用插件作用域 `body[data-dsh-group-chat-hud-docked-open]` / `--dsh-group-chat-hud-overlay-width` 命中 `Agent 群聊` 标签自身。
- **运行验证闭环**：涉及 Web UI 的改动，必须至少执行 `npm run test:matrix` 与一次本地浏览器验证；验证点包括官方“对话”仍可见、`Agent 群聊` 标签可见、右侧 HUD 不重复聊天输入。

### 3. 自由协同、主控编排与工具路由（Orchestrator Contract）
- **扩展定位**：`dsh-group-chat` 是高自由度多 Agent 项目协同引擎，不是单 Agent 包装器、静态角色皮肤或纯保守问答面板。默认目标是让用户用中间对话描述项目任务后，由多 Agent 自主分工、推进、质检和收口。
- **主 Agent + SubAgent**：每套角色/工作流必须定义 `commander` 为主 Agent，其他成员为 SubAgent。主 Agent 负责理解意图、必要追问、任务分派、阶段审核、冲突收敛与最终结论；SubAgent 只执行自身职责并向主 Agent 汇报。
- **确认后写入**：中间对话自动创建角色/工作流时，必须先展示待确认草案；只有用户明确回复“确认创建/确认写入/确认套用”等语义，或点击草案卡片的确认按钮后，才允许写入当前工作区配置。
- **保留 DSH workflow 并发**：不得削弱 DSH 原生 workflow 在同一阶段唤醒多个 Agent 并发执行的能力。阶段并发是本扩展的核心价值之一。
- **工具专员归口**：搜索、爬取、资料抽取只归口 `researcher`；后端/状态/API 代码归口 `backend`；前端/UI/浏览器调试归口 `frontend`；测试与红队验收归口 `qa`；文档与摘要归口 `writer`；最终归纳和是否推进由 `commander` 收口。禁止多个 Agent 对同一个工具任务重复并发调用。
- **模型能力标签**：角色模型推荐必须优先按能力标签匹配（reasoning、coding、tool_use、web_research、data_extraction、ui_design、writing、qa_audit、long_context、fast_reply、low_cost），不得把某个固定模型 ID 写死为唯一选择。用户手动模型配置优先于推荐。
- **扩展 + Runtime Skill**：内置 Runtime Skill `dsh-group-chat-orchestrator` 是本扩展在 DSH 运行时注入给群聊 Agent 的协作说明书；扩展负责 UI、状态、工作流、账本和确认写入，Skill 负责默认协同策略、工具路由和模型能力匹配规则。
- **当前工作区优先**：角色、工作流、最近模型、回退模型、黑板、任务信封、mailbox 等默认都必须写入 `.pm-workflow/dsh-group-chat/` 的工作区作用域；不得无提示写入全局配置，避免换工作区串配置。
- **人话与趣味性**：所有面向用户的新增标签、状态、空态、确认文案优先使用“群聊、开整、草案、确认、取消、谁在干活”等人话；主题人格要服务于任务推进，允许轻微幽默，但禁止水字数和过度角色扮演。

---

## 三、32 条核心工程铁律与踩坑规约 (Mandatory Engineering Guardrails)

以下 32 条为本项目发布预检（Preflight）与集成测试矩阵（Test Matrix）强制扫描的不可逾越红线，违者构建与流水线立即报错拦截：

### 1. 根目录纯洁性与文档归档红线
- 根目录下除 `README.md` 与 `AGENTS.md` 外不得新增任何根目录文件；技术设计全量存放于 `/Docs` 目录。
- 详见：[Docs/README.md](./Docs/README.md)。

### 2. DSH 底座源码保护红线
- 严禁修改 `@deepseek-ai/dsh` 核心源码。所有能力通过插件注册与拦截器扩展。

### 3. 源版对话 / Agent 群聊切换守则
- 进入 `新会话` 或官方 `对话` 标签时，DOM 中不得存在 `.dsh-gc-sidebar-host`、`.gc-conversation-tab`，body 不得残留 `data-dsh-group-chat-tab-active` 或 `data-dsh-group-chat-hud-docked-open`。
- 回归命令：`npm run test:ui:switch` 与 `npm run test:ui:refresh`。详见：[Docs/p39-source-agent-tab-switch-regression/README.md](./Docs/p39-source-agent-tab-switch-regression/README.md)、[Docs/p40-refresh-state-cleanup-regression/README.md](./Docs/p40-refresh-state-cleanup-regression/README.md)。

### 4. 工具调度器 prepare 报错排查守则
- 遇到 `Cannot read properties of undefined (reading 'prepare')` 时，必须区分前端 `conversation.view.prepare` 与后端 `ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare`。
- 中间视图必须始终保留 `GroupChatConversationView.prepare = () => ({})`。全局 DSH 加载多份 `@deepseek-ai/dsh-tools` 会导致 Symbol 不一致。详见：[Docs/p44-source-dialog-prepare-diagnostic/README.md](./Docs/p44-source-dialog-prepare-diagnostic/README.md)。

### 5. 主题化人话文案守则
- 中间 `Agent 群聊` 对话区空态、引导与快捷模板必须跟随当前 `room.activeTheme`，保留沙雕、现代、科技传奇等独立世界观调性。详见：[Docs/p45-theme-aware-central-copy/README.md](./Docs/p45-theme-aware-central-copy/README.md)。

### 6. 自动草案命名质量守则
- 过滤“请把、帮我、这个、扩展”等噪声词；语义化提取“双语”、“Redis”等业务前缀。详见：[Docs/p15-auto-plan-confirm-flow.md](./Docs/p15-auto-plan-confirm-flow.md)。

### 7. 中英文业务文案与工具白名单避坑
- 统一走 `src/client/i18n.ts` 的 `tx(locale, zh, en)`。旧白名单工具名须通过 `normalizeToolNames()` 规整，杜绝 `tools.restrict()` 阻断调用。详见：[Docs/p47-bilingual-ui-and-tool-scope/README.md](./Docs/p47-bilingual-ui-and-tool-scope/README.md)。

### 8. 多 Agent 闭环质量维护守则
- 评估完成质量不能仅看模型触发，必须同时核对 assignment、workflow task、mailbox 和 ledger。超时或异常必须显式标记为失败。命令：`npm run test:agent-loop-quality`。详见：[Docs/p48-real-agent-loop-quality/README.md](./Docs/p48-real-agent-loop-quality/README.md)。

### 9. 模型超时诊断守则
- 官方源版对话正常时，优先排查群聊 turn 超时、上下文膨胀或 whenIdle 等待。按 latencyPreference 保底兜底。详见：[Docs/p49-agent-timeout-diagnostic/README.md](./Docs/p49-agent-timeout-diagnostic/README.md)。

### 10. 真实多人链路验收守则
- 真实环境下跑通 moderator_led：用户 -> commander -> researcher -> commander。必须核对真实的 message、assignment、mailbox 三项数据。详见：[Docs/p50-real-moderator-led-loop/README.md](./Docs/p50-real-moderator-led-loop/README.md)。

### 11. 快速/长任务分层守则
- 快速任务走 quick：少 Agent、短链路、低 token；长流程才进入 workflow_driven 的阶段并发。详见：[Docs/p51-task-tier-progress/README.md](./Docs/p51-task-tier-progress/README.md)。

### 12. 自动建群与真实派发边界
- 消息以 `@角色` 开头或包含“进入开发流程/测试/验收”等执行意图时，直接交由调度器派发，禁止再生成建群草案。详见：[Docs/p52-autosetup-dispatch-guard/README.md](./Docs/p52-autosetup-dispatch-guard/README.md)。

### 13. 群聊消息与账本持久化守则
- 保存工作区群聊状态时必须同时保存 `room/messages/ledger` 快照，统一走 `persistRoomState(roomId)`，保留最近 200 条。详见：[Docs/p53-message-ledger-persistence/README.md](./Docs/p53-message-ledger-persistence/README.md)。

### 14. 重启中断任务恢复守则
- DSH 重启或热重载后，非终态 assignment 标记为 `failed/runtime-interrupted` 并提示用户重新派发，杜绝假死。详见：[Docs/p54-interrupted-assignment-recovery/README.md](./Docs/p54-interrupted-assignment-recovery/README.md)。

### 15. 双语导出守则
- 导出摘要、纪要与系统提示必须按 `locale`（`zh-CN/en-US`）纯正输出，杜绝中文硬编码。详见：[Docs/p55-bilingual-export-summary/README.md](./Docs/p55-bilingual-export-summary/README.md)。

### 16. 运行态自动创建双语守则
- 自动角色/工作流草案、确认/取消按钮均支持双语，服务端准确识别。详见：[Docs/p56-runtime-autosetup-i18n/README.md](./Docs/p56-runtime-autosetup-i18n/README.md)。

### 17. Agent 运行提示双语守则（P57）
- Agent 真实轮次的 System Prompt 与 `ContextProjection` 继承用户语言，杜绝英文对话被中文系统提示带回中文。详见：[Docs/p57-agent-runtime-prompt-i18n/README.md](./Docs/p57-agent-runtime-prompt-i18n/README.md)。

### 18. 工具与工作流 API 双语守则（P58）
- 面向工具调用与 HUD API 的说明性文案按 `locale` 输出。详见：[Docs/p58-tool-workflow-api-i18n/README.md](./Docs/p58-tool-workflow-api-i18n/README.md)。

### 19. 主题角色与工作流内容双语守则（P59）
- 生成的角色 title、口头禅、systemPrompt 与 stage description 全面双语化。详见：[Docs/p59-theme-workflow-content-i18n/README.md](./Docs/p59-theme-workflow-content-i18n/README.md)。

### 20. 科技传奇主题守则（P60）
- `legends` 定位“科技巨头来打工”：乔布斯、马斯克、黄仁勋、雷布斯、比尔·盖茨、张小龙。切换时同步 systemPrompt。详见：[Docs/p60-tech-legends-theme/README.md](./Docs/p60-tech-legends-theme/README.md)。

### 21. English source / bilingual runtime guard（P61）
- 代码内部注释与文档标头保持纯英文；用户可见文案按环境语言提供。详见：[Docs/p61-english-source-bilingual-runtime/README.md](./Docs/p61-english-source-bilingual-runtime/README.md)。

### 22. Runtime Agent Watchdog
- 成员带 `cwd`、`origin: 'subagent'`；使用 abort-aware wait helper，超时写入报警信并标记失败。详见：[Docs/p62-runtime-agent-watchdog/README.md](./Docs/p62-runtime-agent-watchdog/README.md)、[Docs/p63-assignment-watchdog-timeout/README.md](./Docs/p63-assignment-watchdog-timeout/README.md)。

### 23. 官方默认启动与认证避坑
- 必须兼容官方启动 `npx @deepseek-ai/dsh web`，识别终端打印的带 `?token=...` 认证链接（`dsh web authentication required`）。详见：[Docs/p72-hud-message-margins/README.md](./Docs/p72-hud-message-margins/README.md)。

### 24. HUD 消息边距与右侧避让铁律
- HUD 停靠展开时，`.gc-chat-messages` 与 `.gc-composer` 左右 padding 保持 24px 对称，右侧留 8px 安全缝，绝不修改全局 AppFrame。执行：`npm run test:hud-message-margins`。详见：[Docs/p72-hud-message-margins/README.md](./Docs/p72-hud-message-margins/README.md)。

### 25. 新会话入口左栏收起自适应铁律
- blank hero 临时面板跟随中间列实际 DOM 几何，展开对齐 ~280px，收起对齐 ~56px。执行：`npm run test:hero-left-collapse`。详见：[Docs/p73-hero-left-collapse-adaptation/README.md](./Docs/p73-hero-left-collapse-adaptation/README.md)。

### 26. 新会话与房间绑定铁律
- 从官方 session 推导 roomId，切换会话清空历史数据重新拉取，杜绝跨 session 串台。执行：`npm run test:session-room-binding`。详见：[Docs/p74-session-scoped-room-binding/README.md](./Docs/p74-session-scoped-room-binding/README.md)。

### 27. 中央起始文案主题差异铁律
- 每个主题空态标题、副标题、三步指引独一无二。执行：`npm run test:distinct-theme-copy`。详见：[Docs/p75-distinct-theme-empty-copy/README.md](./Docs/p75-distinct-theme-empty-copy/README.md)。

### 28. HUD 语言切换入口铁律
- 语言开关放在 HUD 标题栏操作区，使用 `中 / EN`，保证 300px 侧栏整洁。执行：`npm run test:hud-locale-toggle-header`。详见：[Docs/p76-hud-locale-toggle-header/README.md](./Docs/p76-hud-locale-toggle-header/README.md)。

### 29. 中央执行状态可见铁律
- 执行中 assignment 在中央消息流以实时气泡展现，兼容解析 events 数组。执行：`npm run test:central-live-status`。详见：[Docs/p77-central-live-execution-status/README.md](./Docs/p77-central-live-execution-status/README.md)。

### 30. Agent turn surface fallback 铁律
- 缺失 `turn/end` 时从 `session.deriveMessages()` 提取 assistant 文本作为降级兜底。执行：`npm run test:agent-turn-surface-fallback`。详见：[Docs/p78-agent-turn-surface-fallback/README.md](./Docs/p78-agent-turn-surface-fallback/README.md)。

### 31. 输入框常驻底部与自点击守卫
- `.gc-chat-bottom` 作为独立 flex 子节点置于滚动区外；hero 入口自点击排除自身。执行：`npm run test:composer-outside-scroll`、`npm run test:hero-entry-self-click-guard`。详见：[Docs/p79-composer-outside-scroll/README.md](./Docs/p79-composer-outside-scroll/README.md)、[Docs/p83-hero-entry-self-click-guard/README.md](./Docs/p83-hero-entry-self-click-guard/README.md)。

### 32. 对话防死锁、流式工具展现与经验沉淀铁律
- **Universal Master Handoff**：专员交付完毕默认回传总指挥官收口；工作流推进支持模糊语义识别；长任务配额动态扩容至 24 轮；
- **原生工具白名单直通**：严禁虚拟假工具，赋予真实 DSH 底座工具（read/edit/bash/grep/glob 等）；
- **250ms 流式探针与 Diff 卡片**：实时广播工具进度，edit 提取 `+add -del` 行号差异，bash 提取任务意图，失败标红；
- **真实 Prompt Cache 计费**：跨网关解析 cached_tokens，拒绝误报 0%；
- **README 默认英文**：根目录 `README.md` 默认英文，顶部提供中文切换链接；
- **持续反思与经验沉淀**：人类负责人指出的问题必须第一时间永久沉淀写入 `AGENTS.md`，并在 `/Docs` 维护对应设计专著。
- 执行：`npm run test:matrix` 与 `npm run preflight`。详见：[Docs/p87-dialog-continuity-and-stall-prevention/README.md](./Docs/p87-dialog-continuity-and-stall-prevention/README.md)、[Docs/p88-official-tools-and-cache-metrics/README.md](./Docs/p88-official-tools-and-cache-metrics/README.md)。

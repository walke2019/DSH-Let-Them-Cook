# AGENTS.md — 群聊多 Agent 协同守则与跨角色交互契约

本文件定义了在 `dsh-group-chat` 环境中运行的所有智能体（无论是作为群聊成员的业务 Agent，还是协助开发该项目的代码 Agent）必须严格遵循的操作公约与行为底线。

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

## 二、项目开发智能体（AI Developer / Coding Agent）守则

当您作为 AI 开发者在此代码库中编写、重构或调试代码时，必须遵循以下工程纪律：

### 1. 文档组织规范（强制约束）
- **根目录纯洁性**：项目根目录仅允许存放 `README.md` 与 `AGENTS.md`。
- **所有后续文档归档**：一切技术设计、API 文档、方案调研、测试报告、会议纪要等，必须全部编写或记录到 `/Docs` 目录下（例如 `/Docs/xxx.md`）。严禁在根目录随意新建 `.md` 或文本文件。

### 2. DSH 微内核集成准则
- **绝不破坏底座**：本插件作为 Cordis 扩展模块运行，所有逻辑通过 `ctx.effect()`、`ctx.on()`、`ctx.webServer`、`ctx.slots` 挂载，严禁修改 `@deepseek-ai/dsh` 核心源码。
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


### 4. 右侧 HUD 细节踩坑（2026-09-09 追加）
- **官方 seam 结论**：左侧官方栏是导航壳，不要伪装或强改；中间只用 `conversation.view` 新增 `Agent 群聊`；右侧只用 `shell.overlay` 做 `群聊控制台 (HUD)`。
- **HUD 不等于 AppFrame 分栏**：HUD 默认覆盖停靠，不参与 DSH 官方 grid，不改 centerCol / details / AppFrame。官方 `对话` 必须保持源版行为。
- **插件自身避让**：HUD 停靠展开时，只给 `.gc-conversation` 加右侧避让；composer 和消息区左右 padding 必须对称，右侧与 HUD 保留约 7-8px 安全缝。
- **右栏缩放稳定性**：左边线缩放必须使用 `PointerEvent` + `setPointerCapture()`；拖动期间设置 `body/html cursor: col-resize` 与 `user-select:none`，在 `pointerup/pointercancel/blur` 清理。
- **拖动视觉对齐官方**：缩放热区保持透明，宽度 12px，cursor 使用 `col-resize`，可复用官方左栏 handle 类名但不得依赖哈希类长期稳定。
- **文本防溢出**：HUD 内所有容器默认 `box-sizing:border-box; min-width:0; max-width:100%`；长模型 ID、任务标题、summary/details、按钮组必须省略或换行，不得撑破 300px 最小宽度。
- **文档同步**：涉及架构、UI seam、工作区作用域、踩坑修复的改动，必须同步 `Docs/README.md`、`Docs/TODO.md` 和对应 P 阶段文档。
### 5. 源版对话 / Agent 群聊切换守则（P39/P40 追加）
- **源版对话零污染**：进入 `新会话` 或官方 `对话` 标签时，DOM 中不得存在 `.dsh-gc-sidebar-host`、`.gc-conversation-tab`，body 不得残留 `data-dsh-group-chat-tab-active` 或 `data-dsh-group-chat-hud-docked-open`。
- **Agent 群聊按需激活**：只有 `Agent 群聊` 标签激活时才允许渲染中间群聊视图和 `群聊控制台 (HUD)`；离开标签后 HUD 必须主动卸载，而不是仅隐藏到屏幕外。
- **刷新状态清理**：页面刷新、任务切换、工作区切换后，扩展状态必须由当前激活标签重新推导，禁止让历史本地状态把 HUD、布局变量或 composer 处理逻辑带回源版页面。
- **回归测试要求**：凡涉及 `conversation.view`、HUD 生命周期、body 标记、侧栏布局、composer、任务/标签切换的 Web UI 改动，必须执行 `npm run test:ui:switch` 与 `npm run test:ui:refresh`；大改还需执行 `npm run test:ui:visual` 和 `npm run test:matrix`。
- **历史错误防线**：不得再次引入 `Cannot read properties of undefined (reading 'prepare')`、`agent-presets: refusing to compose an unscoped context`、源版 `对话` 不可输入、HUD 在源版页面残留等回归。


### 4. 工具调度器 prepare 报错排查守则
- 遇到 `Cannot read properties of undefined (reading 'prepare')` 时，必须先区分前端 `conversation.view.prepare` 与后端 `ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare(call.exec)` 两类问题。
- 本插件的中间视图必须始终保留 `GroupChatConversationView.prepare = () => ({})`，且不得接管官方「对话」视图。
- 若源版「对话」在工具调用阶段报 `prepare`，优先检查全局 DSH 是否加载了多份 `@deepseek-ai/dsh-tools`；该包导出的 Symbol 不一致会导致工具调度器在 `ctx.tools` 中读取为 `undefined`。
- 修复此类后端运行时问题时，只能使用插件兼容层、preload singleton 或运行环境 A/B 验证，严禁直接修改 `@deepseek-ai/dsh` 核心源码。


### 5. 主题化人话文案守则
- 中间 `Agent 群聊` 对话区的空状态、三步引导、快捷模板、Agent 状态和自动建队/建工作流系统消息必须跟随当前 `room.activeTheme`。
- 新增角色主题时，必须同步补充主题名号、`theme-voice` 文案、中央对话区模板和回归测试，避免只换头像名字、不换说话调性。
- 默认主题保持 `meme_comedy` / 沙雕整活，但用户切换到三国、原神、现代等主题后，中央内容要立刻变成对应世界观的人话表达。


### 6. 自动草案命名质量守则
- 自动创建角色/工作流时，角色名前缀不得直接硬截用户指令开头，必须先过滤“请把、帮我、这个、扩展、插件、功能、业务、生成、草案”等噪声词。
- 对 i18n、中英文、zh-CN、en-US、双语任务优先使用 `双语` 等业务语义前缀，避免出现“请把这个总控官”这类不自然名称。
- 群聊面板实测必须同时检查草案是否出现、确认前是否不写入、HUD 是否正常、是否有横向溢出和历史 prepare 错误。

### 8. 中英文业务文案与工具白名单避坑（P47）
- 中央 `Agent 群聊` 与右侧 HUD 新增业务文案必须走 `src/client/i18n.ts` 的 `tx(locale, zh, en)` 或后续统一字典，不得只写单语言硬编码。
- 语言选择保存在 `localStorage['dsh-group-chat.locale']`，默认跟随浏览器语言；中央面板与 HUD 通过 `dsh-group-chat:locale-changed` 同步。
- 工作区旧状态里可能残留 `workflow_advance_stage` / `workflow_reject_stage`，必须通过 `normalizeToolNames()` 映射到 `group_chat_workflow_advance` / `group_chat_workflow_reject`，避免 `tools.restrict()` 因旧白名单阻断真实 Agent turn。
- Chrome 实测时若出现模型 30 秒超时，要优先区分模型可用性问题与插件生命周期问题；`tools.restrict() names unknown global tools` 消失才代表本插件白名单兼容修复生效。

## 四、P48 多 Agent 闭环质量维护守则
- 判断 Agent 完成质量时，不能只看是否触发了模型；必须同时核对 assignment、workflow task、mailbox 和 ledger。
- 主 Agent 负责创建或收口任务；SubAgent 完成任务后必须通过 mailbox 上报给主 Agent，HUD/账本需要可查。
- 真实模型超时、候选模型全部失败、工具白名单失败都必须标为未完成，不得伪装为闭环通过。
- 回归命令：npm run test:agent-loop-quality；完整发布前仍需 npm run test:matrix 与 npm run preflight。


## 五、P49 模型超时诊断守则
- 官方源版对话能正常调用同一模型时，不得直接判定模型不可用；优先检查群聊插件的独立 Agent turn 超时、上下文体积、工具收口和 whenIdle 等待。
- 角色模型策略里的 30 秒只作为用户配置值；执行时按 latencyPreference 保底：fast 45s、normal 90s、patient 120s，用户配置更大值则保留更大值。
- 分析失败时必须查看错误里的总耗时、尝试次数、候选链和最后错误，再决定是换模型、调超时还是精简上下文。


## 六、P50 真实多人链路验收记录
- 已在真实 DSH web 中跑通 moderator_led：用户 -> commander -> researcher -> commander。
- 判断主从链路时必须核对真实 message、assignment、mailbox 三类记录；单测只作为机制保障。
- 当前性能事实：真实多人链路约 240 秒，后续优化应围绕快速任务减少角色数、缩短上下文、明确进度，而不是误判模型不可用。


## 七、P51 快速/长任务分层守则
- 默认任务应走 quick：少 Agent、短链路、低 token；有 @ 只唤醒被点名角色，没 @ 只唤醒主 Agent。
- 用户选择 long 或任务明显需要完整工程流程时，才进入 workflow_driven 的多 Agent 阶段并发。
- 进度展示必须区分已耗时与预计耗时，避免用户把长链路误认为卡死。


### 3. 自动建群与真实派发边界（P52 踩坑）
- 自动建群只处理“生成/配置一套角色与工作流”的入口；一旦用户消息以 `@角色` 开头，或包含“进入真实开发流程、当前工作流、启动第一阶段、检查、补齐、修复、测试、验收、派发”等执行语境，必须交给群聊调度器，不得再生成草案。
- 长任务的首个 `@角色` 是初始接单人，尤其 `@commander` 表示主 Agent 先理解与分派；SubAgent 应由主 Agent 在后续发言中显式唤醒，避免 workflow 当前阶段直接 fan-out 造成用户困惑。
- 创建 assignment 时，真实用户消息或上游 Agent 分派内容必须排在前面；工作流阶段任务只能作为附加上下文，不能覆盖真实任务，否则 SubAgent 会泛化回复。
- 当前已知后续项：热重载后可能出现 `assignments` 保留但 `messages` 为空，影响刷新后的群聊复盘；需补消息持久化。

### 4. 群聊消息与账本持久化守则（P53）
- 保存工作区群聊状态时必须同时保存 `room/messages/ledger` 快照，不得只保存 `room`，否则热重载后会出现任务信封仍在、消息流和账本丢失的复盘断层。
- 运行期统一走 `persistRoomState(roomId)`；新增 API 分支或工具分支如果产生消息、任务、邮箱或账本变化，必须调用该快照保存入口。
- 每个房间消息历史默认保留最近 200 条，避免工作区状态文件无限膨胀。

### 5. 重启中断任务恢复守则（P54）
- DSH web 重启、插件卸载或热重载会丢失运行期 timer / agent loop；恢复工作区状态时不得继续展示旧 `queued/running` assignment 为仍在执行。
- 插件启动加载持久化房间后，必须将遗留非终态 assignment 标记为 `failed/runtime-interrupted` 并提示用户重新派发。
- 新增持久化字段或恢复逻辑时，必须验证“发送消息→重启→刷新 UI/API”链路。

### 6. 双语导出守则（P55）
- 新增导出、摘要、账本、系统提示等用户可见文本时，必须考虑 `zh-CN/en-US` 两套语义；API 可通过 `locale` 参数选择。
- `group_chat_export_summary` 等 Agent 工具暴露给角色使用时，也必须支持 locale，避免英文界面导出中文硬编码报告。
- 默认保持 `zh-CN` 向后兼容，英文模式使用明确英文标题和字段名。

### 13. 运行态双语守则（P56）
- 中央 Agent 群聊发送消息必须携带当前 locale，并写入消息 metadata，方便系统回执、错误提示和后续导出沿用用户语言。
- 自动角色/工作流创建链路必须支持 zh-CN/en-US：草案、确认、取消、追问、应用完成提示均不得只写死中文。
- 英文界面下确认按钮发送 `Confirm setup`，取消按钮发送 `Cancel setup`；服务端必须识别中英文确认/取消/修改词。

### 14. Agent 运行提示双语守则（P57）
- Agent 真实轮次的 System Prompt 必须从源用户消息 `metadata.locale` 继承语言；没有 locale 时默认 zh-CN。
- `ContextProjection`、Tool Scope、followup 指令必须按 locale 输出，避免英文任务被中文系统提示拉回中文。
- 运行时仍需保留 master/subagent、工具归口、NO_REPLY、防死循环和 DSH workflow 阶段并发策略。

### 15. 工具与工作流 API 双语守则（P58）
- 面向 DSH 工具调用与 HUD 管理 API 的结果文本必须支持可选 `locale`，默认 `zh-CN` 保持兼容。
- `/workflow/task`、`/workflow/task-action`、`/workflow/action` 必须把 locale 传入 `WorkflowOrchestrator`，避免英文界面收到中文任务结果。
- 工具输出可以保留工具名/角色 ID/状态枚举，但人类说明性文案必须按 locale 输出。

### 16. 主题角色与工作流内容双语守则（P59）
- 自动创建角色/工作流时，不仅 UI 与回执要双语，生成出来的角色名、title、口头禅、systemPrompt、workflow title、stage name、description 也必须跟随 locale。
- HUD 造人/造工作流工具箱、`/auto-plan`、`/theme/draft`、`/theme/apply-draft` 必须传递 locale 到 theme/workflow factory。
- 中文默认继续保持“沙雕但靠谱”的趣味调性；英文默认保持 playful but deliverable 的语气。

### 17. 科技传奇主题守则（P60）
- `legends` 在产品文案上显示为“科技传奇 / Tech legends”，定位是“科技界巨头来给用户打工”，不得再退回泛名人拼盘。
- 科技传奇默认阵容：commander=乔布斯、researcher=马斯克、backend=黄仁勋、frontend=雷布斯、qa=比尔·盖茨、writer=张小龙；新增变更必须保持职责和人格匹配。
- 主题改动必须同步 HUD 下拉、工具输出、@ 别名、中央文案与回归测试，避免只换名称不换体验。切换科技传奇时必须同步更新 systemPrompt，不能出现“外壳是科技巨头、内核仍是旧主题”的割裂。

### 18. English source / bilingual runtime guard（P61）
- Source comments and internal engineering notes in `src/**/*.ts(x)` must be written in English for open-source maintainability.
- User-facing runtime copy must remain locale-aware: keep zh-CN/en-US branches, `tx(locale, zh, en)`, Chinese mention aliases, and built-in localized persona names when they are product behavior.
- Do not “English-only” runtime UX by deleting Chinese strings; separate source readability from bilingual product output.
- New theme/workflow copy must update locale-aware tests before release.

### 3. Runtime Agent Watchdog（P62）
- 群聊成员 Agent 必须带工作区级 session meta：`cwd: process.cwd()`、`origin: 'subagent'`、`delegationDepth: 1`，避免无作用域子 Agent 在 DSH 上下文组合或恢复时失去工作区归属。
- 群聊成员执行时严禁直接 `await agent.whenIdle()` 后才检查 abort；必须使用 abort-aware wait helper，让模型超时、回退链、HUD 状态和 assignment ledger 能收敛到 completed/failed。
- 真实 DSH 长任务压测若出现 assignment 超过 expectedMs 仍 running，应优先检查 `runMemberTurn()` 的 abort 传播、fallback 是否进入下一模型、以及 `.pm-workflow/dsh-group-chat/rooms.json` 中 `resultMessageId` 是否落盘。
- Assignment 创建后必须有用户可见的超时收敛路径：超过 `expectedMs + grace` 仍为 queued/running 时，写入 `assignment-watchdog-timeout` 系统消息、标记 assignment failed、同步 workflow task failed，并广播 HUD error。

### 4. Chat UI composer/progression guard（P64）
- The middle `Agent 群聊` tab remains the single chat entry point. HUD panels must not mount or duplicate `GroupChatPanel`.
- User input must be tested through the real browser textarea for bilingual content; API probes with Chinese must send UTF-8 bytes to avoid false mojibake diagnostics.
- When the docked HUD is open, center avoidance must be capped by the middle tab width (`100%`), not `100vw`; narrow viewports must keep the message log and composer usable through a slim HUD reveal strip.
- A valid UI smoke check confirms: draft typed -> send button enabled -> send clicked -> user bubble appended -> composer cleared -> no permanent source dialog pollution.


## 八、P65-P69 对标迭代守则
- 每条中央 Agent 群聊任务必须形成 `captainTaskProtocol` 路线图：主 Agent 判断路线，SubAgent 按职责执行，依赖和最新上报可在 HUD 查看。
- SubAgent 不只“说一句话”，必须可用 `group_chat_task_claim/block/handoff/report/close` 记录协同事件；阻塞要显式进入 `blocked`，不要伪装完成。
- 写入类、配置类和项目变更类任务优先创建 `ApprovalTransaction`，展示 willChange 与 rollbackPlan，用户/主 Agent 批准后再推进。
- HUD 的默认层级必须像任务驾驶舱：当前谁在干活、路线图进度、待确认卡和闭环质量优先；完整流水只放在高级详情/账本。
- 对标 `dsh-agent-teams` 时，保持本项目差异化：工作区作用域、DSH seam 零污染、主题化人话、官方 workflow 并发保留、主 Agent + SubAgent 可审计闭环。


### 19. 模型可用性与对话中换模型守则（P70）
- 最近模型只能代表“用过”，不得等同于“当前可用”；运行时必须记录工作区级模型 health（成功/失败次数、lastStatus、lastError）。
- 角色在对话中切换主模型或回退模型后，后续 assignment 必须读取最新 room member 配置，不得复用旧执行快照。
- 模型失败时优先走用户配置的 fallback chain；全部失败后必须把候选链和最后错误写入 assignment/ledger，并让用户能按 health 选择已验证模型。
- 若 DSH 当前 tools service 只暴露全局上下文导致 `tools.restrict() requires a scoped context`，插件必须降级为 Prompt 工具权限约束并继续模型调用，不得把工具白名单兼容问题误报为模型不可用。


### 20. 新会话入口守则（P71）
- 新开的官方 DSH 对话处于 blank hero 状态时，`conversation.view` 标签可能尚不可见；插件入口必须采用 demand-driven 方案：默认只露轻量入口，不遮挡普通对话。
- 严禁注册 `conversation.hero.agentPreset`；这是官方单槽位，会与源版 agent preset 入口冲突并导致插件启动失败。
- 入口点击后必须优先切到真实 `Agent 群聊` 标签；若标签尚不可见，才打开 `#dsh-group-chat-hero-main` 临时中间工作面，并直接渲染 `GroupChatPanel`，确保底部群聊输入框可见可用。
- 新会话入口不得接管 `conversation.body`、不得替换官方 header、不得默认隐藏官方 composer；不得从入口写入 `data-dsh-group-chat-tab-active`，该标记只属于真实 `Agent 群聊` 标签。
- 临时工作面只允许写入 `data-dsh-group-chat-hero-open`，关闭/卸载后必须清理；HUD 仍只在真实 `Agent 群聊` 标签激活时挂载。
- 入口文案必须支持 zh-CN/en-US，优先使用“进入 Agent 群聊 / Open Agent group chat”这类低理解成本标签。

### 21. 官方默认启动与认证避坑（P72/P73 调试沉淀）
- 官方默认启动命令必须保持可用：`npx @deepseek-ai/dsh web` / `npx -y @deepseek-ai/dsh web --no-open`。本扩展不得要求用户通过 preload、NODE_OPTIONS 或修改 `@deepseek-ai/dsh` 核心源码才能正常进入。
- DSH web 打印带 `?token=...` 的一次性认证入口时，浏览器裸开 `http://127.0.0.1:3080/` 可能返回 `dsh web authentication required; reopen the URL printed by dsh web.`；验证 UI/E2E 时必须使用当前启动日志里的完整 token URL，并写入 `DSH_GC_URL`。
- 遇到 `agent-presets: refusing to compose an unscoped context` 时，先检查官方 DSH 版本和 profile 依赖是否把 `@deepseek-ai/dsh-scope` 拉成多份；优先升级/收敛官方包版本，不要把插件兼容层变成官方启动前置条件。
- 第三方 profile 插件若阻断官方启动（例如导入已不存在的 DSH settings export），只禁用具体问题 loader id，不得禁用或污染官方源版对话能力。
- 本扩展接入 profile 时使用插件 loader entry 加 `link:C:/项目/dsh-group-chat` 依赖；不得把普通插件误塞进 `dsh.profile.bundles`，否则会触发 `declares no dsh.bundle` 类启动错误。

### 22. HUD 消息边距与右侧避让铁律（P72）
- HUD 停靠展开时，`.gc-chat-messages` 与 `.gc-composer` 左右 padding 必须保持对称；当前验收值为 24px / 24px，避免消息区左贴边、右侧被 HUD 视觉挤压。
- 中间 `.gc-conversation` 只在 `body[data-dsh-group-chat-tab-active="true"]` 或 `body[data-dsh-group-chat-hero-open="true"]` 且 HUD 停靠展开时避让右栏；避让宽度使用 HUD 实测宽度 + 8px 安全缝，并仍需受中间面板宽度上限约束。
- 不得通过修改官方 AppFrame、centerCol、details 栅格或 documentElement 全局宽度变量来解决 HUD 间距；只允许插件根节点与插件 body data 标记作用域内的样式。
- 涉及 HUD 间距、消息区、composer、右侧 seam 的改动，至少执行 `npm run test:hud-message-margins`、`npm run test:ui:entry`、`npm run test:ui:switch`、`npm run test:ui:refresh`，发布前执行 `npm run test:matrix`。

### 23. 新会话入口左栏收起自适应铁律（P73）
- 新会话 blank hero 场景的临时 `#dsh-group-chat-hero-main` 不得固定 `left:280px`；必须跟随官方中间列当前 left，左栏展开对齐约 280px，左栏收起对齐约 56px。
- 临时入口只能写入 `--dsh-group-chat-hero-left` 和 `data-dsh-group-chat-hero-open` 这类插件作用域状态；关闭/卸载时必须清理，避免污染源版官方对话。
- 计算左边界时优先读取官方中间层实际 DOM 几何，找不到时才使用左侧 collapsed rail 兜底；不得依赖 DSH 哈希 class 名作为唯一判断条件。
- 左栏收起、窗口 resize、官方 shell DOM reflow 后必须重新计算临时面板左边界；避免用户看到左侧大空洞或中间层被旧 sidebar 宽度卡住。
- 涉及新会话入口、临时中间工作面、左栏收起/展开的改动，必须执行 `npm run test:hero-left-collapse` 并用真实浏览器测量 `hero.left === centerLeft`。

### 24. 新会话与房间绑定铁律（P74）
- 中央 `Agent 群聊` 与右侧 HUD 不得长期硬编码读取 `dev-team-alpha`；在官方 DSH 对话内运行时，必须从当前官方 session 推导工作区内的群聊 roomId。
- 用户从左栏开启或切换官方新会话后，插件必须切到对应 session-scoped room；新 session 首次打开时展示空群聊引导，不得复用上一会话任务的 messages、ledger、assignments。
- roomId 切换时中央消息列表、Agent 状态和 HUD 数据必须立即清空并重新拉取；SSE 事件必须按当前 roomId 过滤，避免旧会话后台事件串屏。
- `/dsh-group-chat/api/room?id=...&ensure=1` 只允许创建当前 session 对应的空房间与默认队伍，不得拷贝旧房间消息记录。
- 涉及官方会话切换、roomId 推导、HUD 数据源和消息持久化的改动，必须执行 `npm run test:session-room-binding`、`npm run test:ui:switch`、`npm run test:ui:refresh` 和 `npm run test:matrix`。

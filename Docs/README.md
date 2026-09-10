# Docs — dsh-group-chat 当前项目文档索引

更新日期：2026-09-10

`dsh-group-chat` 当前定位是 **DSH 工作区级多 Agent 群聊编排扩展**：用户在中间 `Agent 群聊` 标签用一句话描述任务，扩展生成角色/工作流草案，用户确认后写入当前工作区；右侧 `群聊控制台 (HUD)` 只承担监控、配置、账本和状态修正，不重复聊天输入，不接管官方 `对话`。

## 当前架构事实

- Host：Cordis 插件，入口 `src/index.ts`，HTTP/SSE API 挂在 `/dsh-group-chat/api/*`。
- Client：React 插件，入口 `src/client/index.ts`。
- 中间视图：`conversation.view` 注册安全 `Agent 群聊` 标签，必须带 `prepare()`。
- 右侧 HUD：`shell.overlay` 注册覆盖式 `群聊控制台 (HUD)`，不挤压官方 AppFrame。
- 工作区数据：默认写入 `.pm-workflow/dsh-group-chat/`，不写全局配置。
- 模型调用：通过 DSH `agent/request` / 兼容层能力重写 Provider/Model，不直连未托管模型 HTTP。
- 双语运行：客户端 locale 自动检测 + 用户切换；Host API、工具、Agent Prompt、主题/工作流生成内容均保留 zh-CN/en-US 分支。
- 开源维护：`src/**/*.ts(x)` 注释保持英文；中文仅保留在用户可见 zh-CN 文案、中文 @ 别名和内置角色名。

## 重点文档

- `business-specification.md`：产品目标、主副屏职责、用户确认写入流程。
- `technical-architecture.md`：当前 Host/Client/Engine/Workflow/Runtime Skill 架构。
- `dispatch-engine.md`：主 Agent + SubAgent、工具归口、workflow 并发、防死循环。
- `workflow-and-role-personas.md`：角色、主题、自动生成草案、工作流闭环。
- `standards-and-extensibility.md`：DSH 插件接入规范、UI seam、布局红线与外部参考共存边界。
- `orchestrator-skill-and-policy.md`：扩展 + Runtime Skill 协同策略。
- `ecosystem-assessment-and-roadmap.md`：生态参考、完成度、路线图，含 DSH seam / Hermes / OpenClaw / dsh-mnemon 共存说明。
- `TODO.md`：当前 P0-P61 任务完成状态。

## UI 维护红线

1. 不覆盖官方 `对话`，不注册 `conversation.composer`。
2. `Agent 群聊` 只能通过 `conversation.view` 安全标签承接扩展对话。
3. HUD 只覆盖，不向 `documentElement` 写影响官方主布局的变量。
4. HUD 停靠时只通过 `body[data-dsh-group-chat-tab-active][data-dsh-group-chat-hud-docked-open]` 让 `Agent 群聊` 自身避让。
5. HUD 左边线缩放使用 Pointer Events + `setPointerCapture()`；热区透明，`col-resize`，拖完清理 cursor/user-select。
6. HUD 内所有组件必须 `min-width:0 / max-width:100%`，长文本省略或换行，不允许撑破侧栏。

## 测试入口

- `npm run typecheck`
- `npm run build:all`
- `npm run test:matrix`
- `npm run test:ui:visual`
- `npm run test:ui:switch`
- `npm run test:ui:refresh`
- `npm run test:ui:entry`
- `npm run preflight`
- `node Docs/p8-hud-overlay-layout/test-p8-overlay-layout.cjs`
- `node Docs/p19-real-project-loop/test-p19-real-project-loop.cjs`
- `node Docs/p20-low-friction-onboarding/test-p20-low-friction-onboarding.cjs`

## 阶段文档

- `Docs/p18-browser-visual-regression/README.md`：浏览器端视觉回归，覆盖左栏展开、HUD 展开、输入框间距、HUD 文本外溢与旧标签回退。
- `Docs/p19-real-project-loop/README.md`：真实小任务闭环，覆盖主 Agent 分派、SubAgent 回传、mailbox 摘要、失败任务动作与资源账本。
- `Docs/p20-low-friction-onboarding/README.md`：低理解成本体验，覆盖 3 步引导、常见任务模板与调度模式上下文 QA。

- `Docs/p21-hud-top-controls-component/README.md`：HUD 顶部配置区组件化，降低 inline style 与布局回归风险。

- `Docs/p22-hud-workflow-panel-component/README.md`：HUD 工作流面板组件化，覆盖执行导演台、阶段任务、Assignment 与 Mailbox。

- Docs/p23-hud-roster-panel-component/README.md — HUD 账本 / 角色 / 主题面板组件化。


- Docs/p24-hud-scratchpad-panel-component/README.md — HUD 黑板面板组件化。


- Docs/p25-sidedock-type-dedupe/README.md — SideDock 冗余类型与工具函数清理。


- Docs/p26-hud-shared-types/README.md — HUD 共享类型文件。


- Docs/p27-hud-style-tokens/README.md — HUD 公共样式 Token。


- Docs/p28-roster-style-tokens/README.md — 账本 / 角色面板接入 HUD 公共样式。


- Docs/p29-workflow-style-tokens/README.md — 工作流面板接入 HUD 公共样式。
- Docs/p30-top-controls-style-tokens/README.md — 顶部控件接入 HUD 公共样式。


- Docs/p31-final-usability-acceptance/README.md — 最终可用性总验收。


- Docs/p32-workflow-progressive-disclosure/README.md — 工作流面板渐进式展示。


- Docs/p33-workflow-compact-browser-check/README.md — 工作流清爽默认态浏览器验收。


- Docs/p34-workflow-accordion-details/README.md — 工作流高级详情手风琴折叠。


- Docs/p35-team-ledger-tab-split/README.md — 团队 / 工作流 / 黑板 / 账本标签重组。


- Docs/p36-ledger-progressive-records/README.md — 账本完整流水渐进式展示、搜索与筛选。


- Docs/p37-team-progressive-roster/README.md — 团队页摘要、搜索与折叠工具箱。


- Docs/p38-official-source-dialog-guard/README.md — 官方源对话页保护，HUD 仅在 Agent 群聊标签激活时渲染。


- Docs/p39-source-agent-tab-switch-regression/README.md — 源版对话 / Agent 群聊切换回归，防止扩展 HUD 再次污染官方对话。



- Docs/p40-refresh-state-cleanup-regression/README.md — 刷新 / 重载后的扩展状态清理回归，防止官方对话继承扩展布局状态。


- Docs/p41-release-guardrails-refresh/README.md — 发布预检与维护守则补齐，覆盖 P39/P40 源版对话隔离与刷新清理红线。


- Docs/p42-agent-chat-entry-usable-regression/README.md — Agent 群聊真实入口可用性回归，验证中间对话、输入框、HUD 与友好文案。


- Docs/p43-final-closure-audit/README.md — 最终收口审计，明确当前可用版阻塞项为 0，剩余为非阻塞优化。



- Docs/p44-source-dialog-prepare-diagnostic/README.md — 源版「对话」prepare 报错诊断，区分前端 conversation.view.prepare 与后端工具调度器 prepare，记录 dsh-tools 多副本 Symbol 风险。


- Docs/p45-theme-aware-central-copy/README.md — 中间 Agent 群聊对话区主题化人话文案，覆盖空状态、三步引导、快捷模板、Agent 状态和自动建队/建工作流系统消息。


- Docs/p46-i18n-panel-task-smoke/README.md — 在 Agent 群聊面板投递中英文语言业务功能开发任务的实测记录，覆盖自动草案、确认前不写入、生成角色命名质量与浏览器无错误。

## P47 — 中/英文业务文案与工具白名单兼容

- 文档：`Docs/p47-bilingual-ui-and-tool-scope/README.md`
- 测试：`npm run test:bilingual-ui`
- 结论：中央 `Agent 群聊` 与 HUD 已支持 zh-CN/en-US 基础业务文案切换；Chrome 实测确认 UI 切换无控制台错误，并修复旧工作流工具名导致的真实 Agent 调用阻断。

- [P60 科技传奇主题重塑](./p60-tech-legends-theme/README.md)：把 legends 主题改造成乔布斯、马斯克、黄仁勋、雷布斯等科技巨头为用户打工的团队氛围。

- [P61 English source comments + bilingual runtime copy](./p61-english-source-bilingual-runtime/README.md)：源码注释英文化，运行态继续自动匹配 zh-CN/en-US。

- [Git release checklist](./git-release-checklist.md)：提交/推送前状态、验证命令、忽略规则与首次初始化 Git 命令。



## P65-P69 Task Cockpit Iteration

- [P65 Captain Task Protocol](./p65-captain-task-protocol/README.md): every central Agent chat task now creates a commander-led task route map.
- [P66 Durable SubAgent Resume](./p66-durable-subagent-resume/README.md): SubAgent claim/block/handoff/report/close/resume events are recorded for workspace recovery.
- [P67 Approve & Run Transaction Card](./p67-approve-run-transaction-card/README.md): change-oriented work can expose will-change and rollback plans before approval.
- [P68 Team Coordination Tools](./p68-team-coordination-tools/README.md): Agent-callable coordination tools keep master/subagent reporting auditable.
- [P69 Task Cockpit Productization](./p69-task-cockpit-productization/README.md): HUD now emphasizes current work, loop quality, captain plan and approval cards instead of chat-only novelty.

- [P70 Model health and mid-chat switching](./p70-model-health-and-switching/README.md): workspace-scoped success/failure memory for model IDs, graceful tool-scope fallback, and user-facing switch guidance.

- [P71 New-session Agent entry](./p71-new-session-agent-entry/README.md): adds a visible Agent group-chat entry on fresh official chat hero screens without taking over source DSH layout.

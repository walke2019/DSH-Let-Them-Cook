# DSH Let Them Cook (开整天团) 技术方案、规范与任务文档中心

> 本目录为项目标准化技术方案中心，涵盖多智能体协同引擎设计、UI 扩展插槽生命周期契约、发版预检与 P1~P88 全量演进里程碑。

---

## 🧭 项目三层文档体系结构

为了保持项目的规范化与工程严谨性，项目严格遵循三层文档结构：

```text
DSH-Let-Them-Cook/
├── README.md                      # [第一层] 产品介绍与扩展安装部署指南 (默认地道英文，顶部提供中文切换)
├── AGENTS.md                      # [第二层] AI Agent 编码、UI 规范标准及避坑开发宪章 (分类索引 + docs 引用)
├── __tests__/                     # [测试层] 90+ 套自动化回归与集成测试脚本 (专业自动化测试目录)
└── docs/                          # [第三层] 技术方案、业务规范与开发任务索引中心 (本目录)
    ├── README.md                  # 本索引导航文件
    ├── TODO.md                    # 全局待办开发任务清单与完成状态
    ├── agents/                    # 1. Agents 专属规范与避坑宪章专区
    ├── tasks/                     # 2. 开发任务、待办与里程碑管理
    ├── architecture/              # 3. 系统架构与技术设计白皮书
    ├── releases/                  # 4. 版本发版记录与发布检查清单
    ├── archive/                   # 5. 历史修复与沙箱归档
    └── p1-* ~ p88-*               # 6. P1~P88 各演进阶段专项设计文档
```

---

## 📚 业务分类文档目录导航

### 1. 🤖 Agents 专属规范与避坑宪章专区 (`docs/agents/`)
面向 AI Coding Agent 与业务 Participant Agent 的强制性工程铁律与避坑专著：
- **[docs/agents/README.md](./agents/README.md)**：Agents 规范专区总览与导读
- **[01-ui-and-lifecycle.md](./agents/01-ui-and-lifecycle.md)**：UI 布局、插槽生命周期与源版对话绝对隔离（零污染红线）
- **[02-tools-and-ledger.md](./agents/02-tools-and-ledger.md)**：底座原生工具直通、250ms 流式工具探针、行号 Diff 与 Prompt Cache 真实计费
- **[03-orchestration-and-anti-stall.md](./agents/03-orchestration-and-anti-stall.md)**：Universal Master Handoff 完工必回主控、阶段流转双语识别、看门狗超时报警信自愈
- **[04-i18n-personas-workspaces.md](./agents/04-i18n-personas-workspaces.md)**：全栈中英双语运行时、主题人格化、空态文案差异化与工作区持久化隔离

### 2. 📋 开发任务与待办清单 (`docs/tasks/`)
项目开发进度管理、迭代阶段划分与任务跟踪：
- **[docs/tasks/README.md](./tasks/README.md)**：开发任务管理总览
- **[TODO.md](./TODO.md)** (或查看 [tasks/TODO.md](./tasks/TODO.md))：全局待办开发任务清单（P0~P88 迭代进展追踪）
- **[roadmap.md](./tasks/roadmap.md)**：版本演进规划与中长期技术路线图
- **[milestones-index.md](./tasks/milestones-index.md)**：P1~P88 迭代里程碑全景索引

### 3. 🏛️ 系统架构与技术设计 (`docs/architecture/`)
核心系统架构设计、微内核挂载与协作机制深度白皮书：
- **[docs/architecture/README.md](./architecture/README.md)**：系统架构文档总览
- **[technical-architecture.md](./architecture/technical-architecture.md)**：总体技术架构与 Cordis 扩展分层设计
- **[business-specification.md](./architecture/business-specification.md)**：业务定位与主副屏协同规范
- **[dispatch-engine.md](./architecture/dispatch-engine.md)**：主 Agent + SubAgent 分工、工具归口专员与并发调度模型
- **[standards-and-extensibility.md](./architecture/standards-and-extensibility.md)**：DSH 插件标准与 UI Seam 隔离规范
- **[orchestrator-skill-and-policy.md](./architecture/orchestrator-skill-and-policy.md)**：扩展与 Runtime Skill 协同策略
- **[fault-tolerance-and-token-thrift.md](./architecture/fault-tolerance-and-token-thrift.md)**：看门狗容错机制与 Token 节约策略
- **[workflow-and-role-personas.md](./architecture/workflow-and-role-personas.md)**：角色设定、五套主题世界观与闭环工作流
- **[ecosystem-assessment-and-roadmap.md](./architecture/ecosystem-assessment-and-roadmap.md)**：与 Hermes / OpenClaw / dsh-mnemon 生态方案共存与边界评估

### 4. 🚀 发版记录与检查清单 (`docs/releases/`)
版本发布标准与发版红线预检：
- **[docs/releases/README.md](./releases/README.md)**：发版流程导航
- **[git-release-checklist.md](./releases/git-release-checklist.md)**：Git 提交与发布检查清单
- **[release-alpha-0.1.0.md](./releases/release-alpha-0.1.0.md)**：v0.1.0 首发版本里程碑说明

---

## 🧪 测试套件与自动化验证入口 (`__tests__/`)

所有自动化单测已统一归集至根目录 **`__tests__/`** 目录进行标准化工程维护：

- `npm run typecheck` — TypeScript 全量静态类型检查
- `npm run build:all` — 构建 Host (`lib/index.js`) 与 Web Client (`lib/client.js`)
- `npm run test:matrix` — 运行 50+ 套测试组成的全矩阵自动化回归（自动执行 `__tests__/*.cjs`）
- `npm run preflight` — 发版前红线扫描与健康检查
- 针对性回归测试（均位于 `__tests__/`）：
  - `npm run test:ui:visual` — 浏览器端视觉回归测试
  - `npm run test:ui:switch` — 源版对话与群聊切换回归 (`test-p39-source-agent-tab-switch-regression.cjs`)
  - `npm run test:ui:refresh` — 刷新与状态清理回归 (`test-p40-refresh-state-cleanup-regression.cjs`)
  - `npm run test:ui:entry` — 真实入口可用性回归 (`test-p42-agent-chat-entry-usable-regression.cjs`)
  - `npm run test:bilingual-ui` — 双语 UI 与工具作用域回归 (`test-p47-bilingual-ui-and-tool-scope.cjs`)
  - `npm run test:agent-loop-quality` — 真实多智能体闭环回归 (`test-p48-real-agent-loop-quality.cjs`)
  - `npm run test:dialog-continuity` — 对话防死锁与连续性自愈 (`test-p87-dialog-continuity.cjs`)

---

## 📦 P1~P88 迭代演进阶段专著索引 (Evolutionary Specs)

- `docs/tasks/phases/p1-assignment-mailbox-runtime/README.md` — 任务信封与 Mailbox 运行时
- `docs/tasks/phases/p2-workflow-task-dag-quality-gate/README.md` — 工作流任务 DAG 与质量门禁
- `docs/tasks/phases/p3-model-recommendation-engine/README.md` — 角色模型推荐引擎
- `docs/tasks/phases/p4-dsh-compat-and-test-matrix/README.md` — DSH 兼容层与测试矩阵
- `docs/tasks/phases/p5-hud-dag-assignment-mailbox/README.md` — HUD DAG 与信封面板
- `docs/tasks/phases/p6-structured-agent-result/README.md` — 结构化交付结果解析
- `docs/tasks/phases/p7-hud-structured-result-actions/README.md` — HUD 结构化动作与重试
- `docs/tasks/phases/p8-hud-overlay-layout/README.md` — HUD 侧边栏布局与避让
- `docs/tasks/phases/p9-draggable-hud/README.md` — 可拖拽调整 HUD 宽度
- `docs/tasks/phases/p10-end-to-end-small-task/README.md` — 端到端免 LLM 闭环定义
- `docs/tasks/phases/p11-release-preflight/README.md` — 发版红线预检定义
- `docs/tasks/phases/p12-official-chat-compat/README.md` — 官方对话兼容保障
- `docs/tasks/phases/p13-hud-chat-entry/README.md` — HUD 快捷对话入口
- `docs/tasks/phases/p14-safe-middle-conversation-tab/README.md` — 中间对话标签安全挂载
- `docs/tasks/phases/p15-auto-plan-confirm-flow/README.md` — 自动建群草案确认流程
- `docs/tasks/phases/p16-theme-voice-copy-system/README.md` — 主题口音与人语文案系统
- `docs/tasks/phases/p17-hud-director-console/README.md` — HUD 执行导演台
- `docs/tasks/phases/p18-browser-visual-regression/README.md` — 浏览器端视觉回归
- `docs/tasks/phases/p19-real-project-loop/README.md` — 真实小任务闭环
- `docs/tasks/phases/p20-low-friction-onboarding/README.md` — 低理解成本体验
- `docs/tasks/phases/p21-hud-top-controls-component/README.md` — HUD 顶部配置区组件化
- `docs/tasks/phases/p22-hud-workflow-panel-component/README.md` — HUD 工作流面板组件化
- `docs/tasks/phases/p23-hud-roster-panel-component/README.md` — HUD 账本/角色/主题面板组件化
- `docs/tasks/phases/p24-hud-scratchpad-panel-component/README.md` — HUD 黑板面板组件化
- `docs/tasks/phases/p25-sidedock-type-dedupe/README.md` — SideDock 冗余类型清理
- `docs/tasks/phases/p26-hud-shared-types/README.md` — HUD 共享类型定义
- `docs/tasks/phases/p27-hud-style-tokens/README.md` — HUD 公共样式 Token
- `docs/tasks/phases/p28-roster-style-tokens/README.md` — 角色面板接入样式 Token
- `docs/tasks/phases/p29-workflow-style-tokens/README.md` — 工作流面板接入样式 Token
- `docs/tasks/phases/p30-top-controls-style-tokens/README.md` — 顶部控件接入样式 Token
- `docs/tasks/phases/p31-final-usability-acceptance/README.md` — 最终可用性总验收
- `docs/tasks/phases/p32-workflow-progressive-disclosure/README.md` — 工作流渐进式展开
- `docs/tasks/phases/p33-workflow-compact-browser-check/README.md` — 工作流清爽默认态浏览器验收
- `docs/tasks/phases/p34-workflow-accordion-details/README.md` — 工作流高级详情手风琴折叠
- `docs/tasks/phases/p35-team-ledger-tab-split/README.md` — 团队/工作流/黑板/账本标签重组
- `docs/tasks/phases/p36-ledger-progressive-records/README.md` — 账本完整流水渐进展示与筛选
- `docs/tasks/phases/p37-team-progressive-roster/README.md` — 团队页摘要与折叠工具箱
- `docs/tasks/phases/p38-official-source-dialog-guard/README.md` — 官方源对话页隔离保护
- `docs/tasks/phases/p39-source-agent-tab-switch-regression/README.md` — 源版对话/Agent 群聊切换回归
- `docs/tasks/phases/p40-refresh-state-cleanup-regression/README.md` — 刷新/重载后状态清理回归
- `docs/tasks/phases/p41-release-guardrails-refresh/README.md` — 发布预检与维护守则补齐
- `docs/tasks/phases/p42-agent-chat-entry-usable-regression/README.md` — Agent 群聊真实入口可用性回归 (p42-agent-chat-entry-usable-regression)
- `docs/tasks/phases/p43-final-closure-audit/README.md` — p43-final-closure-audit 最终收口审计（当前可用版阻塞项为 0）
- `docs/tasks/phases/p44-source-dialog-prepare-diagnostic/README.md` — prepare 报错根因诊断
- `docs/tasks/phases/p45-theme-aware-central-copy/README.md` — 中间群聊主题化人话文案
- `docs/tasks/phases/p46-i18n-panel-task-smoke/README.md` — 双语面板冒烟测试
- `docs/tasks/phases/p47-bilingual-ui-and-tool-scope/README.md` — 双语 UI 与工具作用域规范
- `docs/tasks/phases/p48-real-agent-loop-quality/README.md` — 真实多智能体闭环质量验收
- `docs/tasks/phases/p49-agent-timeout-diagnostic/README.md` — 智能体超时诊断与兜底时延
- `docs/tasks/phases/p50-real-moderator-led-loop/README.md` — 真实多人链路全周期验收
- `docs/tasks/phases/p51-task-tier-progress/README.md` — 快速任务与长流程任务分层
- `docs/tasks/phases/p52-autosetup-dispatch-guard/README.md` — 自动建群与真实派发边界
- `docs/tasks/phases/p53-message-ledger-persistence/README.md` — 消息与账本持久化
- `docs/tasks/phases/p54-interrupted-assignment-recovery/README.md` — 重启中断任务状态自愈恢复
- `docs/tasks/phases/p55-bilingual-export-summary/README.md` — 双语导出讨论纪要与账本
- `docs/tasks/phases/p56-runtime-autosetup-i18n/README.md` — 运行态自动创建双语支持
- `docs/tasks/phases/p57-agent-runtime-prompt-i18n/README.md` — 智能体运行提示词双语化
- `docs/tasks/phases/p58-tool-workflow-api-i18n/README.md` — 工具与工作流 API 双语化
- `docs/tasks/phases/p59-theme-workflow-content-i18n/README.md` — 主题角色与工作流内容双语化
- `docs/tasks/phases/p60-tech-legends-theme/README.md` — 科技传奇专属调性阵容
- `docs/tasks/phases/p61-english-source-bilingual-runtime/README.md` — 纯英文源码注释与双语运行时
- `docs/tasks/phases/p62-runtime-agent-watchdog/README.md` — 运行时任务看门狗机制
- `docs/tasks/phases/p63-assignment-watchdog-timeout/README.md` — 任务看门狗超时监控
- `docs/tasks/phases/p64-chat-ui-composer-progression/README.md` — 输入框组件渐进式演进
- `docs/tasks/phases/p65-captain-task-protocol/README.md` — 团队协同 Captain Task Protocol
- `docs/tasks/phases/p66-durable-subagent-resume/README.md` — 持久化 SubAgent 恢复
- `docs/tasks/phases/p67-approve-run-transaction-card/README.md` — 确认后执行事务卡片
- `docs/tasks/phases/p68-team-coordination-tools/README.md` — 团队协同五大工具箱
- `docs/tasks/phases/p69-task-cockpit-productization/README.md` — 任务驾驶舱产品化
- `docs/tasks/phases/p70-model-health-and-switching/README.md` — 模型健康检测与无缝切换
- `docs/tasks/phases/p71-new-session-agent-entry/README.md` — 新会话 Blank Hero 入口
- `docs/tasks/phases/p72-hud-message-margins/README.md` — HUD 消息边距与右侧避让铁律
- `docs/tasks/phases/p73-hero-left-collapse-adaptation/README.md` — 新会话入口左栏收起自适应
- `docs/tasks/phases/p74-session-scoped-room-binding/README.md` — 会话作用域房间强绑定
- `docs/tasks/phases/p75-distinct-theme-empty-copy/README.md` — 五大主题空态文案差异化
- `docs/tasks/phases/p76-hud-locale-toggle-header/README.md` — HUD 顶部独立双语切换按钮
- `docs/tasks/phases/p77-central-live-execution-status/README.md` — P77 Central live execution status 中央执行状态实时探针
- `docs/tasks/phases/p78-agent-turn-surface-fallback/README.md` — Agent turn surface fallback 兼容降级
- `docs/tasks/phases/p79-composer-outside-scroll/README.md` — 输入框常驻滚动区外侧
- `docs/tasks/phases/p80-central-loading-state/README.md` — 中央加载态与超时自愈
- `docs/tasks/phases/p81-workflow-commander-delegation/README.md` — 工作流主控分派与回传编排
- `docs/tasks/phases/p82-official-like-central-execution/README.md` — 对齐官方对话的中央执行流展示
- `docs/tasks/phases/p83-hero-entry-self-click-guard/README.md` — Hero 入口自点击防线
- `docs/tasks/phases/p84-collapsible-message-body/README.md` — 长消息渐进式折叠遮罩
- `docs/tasks/phases/p85-bilingual-role-coverage/README.md` — 全角色全链路双语覆盖
- `docs/tasks/phases/p86-native-tool-row-adapter/README.md` — 原生工具行号 Diff 可视化适配器
- `docs/tasks/phases/p87-dialog-continuity-and-stall-prevention/README.md` — 对话连续性保障与防死锁自愈
- `docs/tasks/phases/p88-official-tools-and-cache-metrics/README.md` — 底座原生工具直通与真实 Prompt Cache 计费

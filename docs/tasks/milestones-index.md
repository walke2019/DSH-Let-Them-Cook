# P1~P94 迭代里程碑全景索引 (Milestones Index)

本索引按阶段汇集本项目所有已完成的研发里程碑及其专项文档与验证方式。P89~P94 记录了面向最新版 DSH-native primitives 的零污染重构、runtime trace、liveness watchdog、工具事件适配、HUD 能力诊断与 approval/workflow bridge diagnostics：

| 阶段 | 主题 / 任务名 | 详细设计文档 | 对应单测脚本 (`__tests__/`) |
| :--- | :--- | :--- | :--- |
| **P1** | 任务信封与 Mailbox 运行时 | [docs/tasks/phases/p1-assignment-mailbox-runtime](../tasks/phases/p1-assignment-mailbox-runtime/README.md) | `test-p1-assignment-mailbox.cjs` |
| **P2** | 工作流任务 DAG 与质量门禁 | [docs/tasks/phases/p2-workflow-task-dag-quality-gate](../tasks/phases/p2-workflow-task-dag-quality-gate/README.md) | `test-p2-workflow-task-dag.cjs` |
| **P3** | 角色模型推荐引擎 | [docs/tasks/phases/p3-model-recommendation-engine](../tasks/phases/p3-model-recommendation-engine/README.md) | `test-p3-model-recommender.cjs` |
| **P4** | DSH 兼容层与测试矩阵 | [docs/tasks/phases/p4-dsh-compat-and-test-matrix](../tasks/phases/p4-dsh-compat-and-test-matrix/README.md) | `test-p4-dsh-compat.cjs` |
| **P5** | HUD DAG 与信封面板 | [docs/tasks/phases/p5-hud-dag-assignment-mailbox](../tasks/phases/p5-hud-dag-assignment-mailbox/README.md) | `test-p5-hud.cjs` |
| **P6** | 结构化交付结果解析 | [docs/tasks/phases/p6-structured-agent-result](../tasks/phases/p6-structured-agent-result/README.md) | `test-p6-structured-result.cjs` |
| **P7** | HUD 结构化动作与重试 | [docs/tasks/phases/p7-hud-structured-result-actions](../tasks/phases/p7-hud-structured-result-actions/README.md) | `test-p7-hud-actions.cjs` |
| **P8** | HUD 侧边栏布局与避让 | [docs/tasks/phases/p8-hud-overlay-layout](../tasks/phases/p8-hud-overlay-layout/README.md) | `test-p8-overlay-layout.cjs` |
| **P9** | 可拖拽调整 HUD 宽度 | [docs/tasks/phases/p9-draggable-hud](../tasks/phases/p9-draggable-hud/README.md) | `test-p9-draggable-hud.cjs` |
| **P10** | 端到端免 LLM 闭环 | [docs/tasks/phases/p10-end-to-end-small-task](../tasks/phases/p10-end-to-end-small-task/README.md) | `test-p10-e2e-definition.cjs` |
| **P11** | 发版红线预检与纯洁性扫描 | [docs/tasks/phases/p11-release-preflight](../tasks/phases/p11-release-preflight/README.md) | `test-p11-preflight-definition.cjs` |
| **P14** | 中间对话标签安全挂载 | [docs/tasks/phases/p14-safe-middle-conversation-tab](../tasks/phases/p14-safe-middle-conversation-tab/README.md) | `test-p14-safe-middle-conversation-tab.cjs` |
| **P15** | 自动建群草案确认流程 | [docs/tasks/phases/p15-auto-plan-confirm-flow](../tasks/phases/p15-auto-plan-confirm-flow/README.md) | `test-p15-auto-plan-confirm-flow.cjs` |
| **P16** | 主题口音与人语文案系统 | [docs/tasks/phases/p16-theme-voice-copy-system](../tasks/phases/p16-theme-voice-copy-system/README.md) | `test-p16-theme-voice-copy-system.cjs` |
| **P17** | HUD 执行导演台 | [docs/tasks/phases/p17-hud-director-console](../tasks/phases/p17-hud-director-console/README.md) | `test-p17-hud-director-console.cjs` |
| **P21~P30** | HUD 组件化与公共样式 Tokens | [docs/p21~p30](../tasks/phases/p27-hud-style-tokens/README.md) | `test-p21~p30-*.cjs` |
| **P38** | 官方源对话页隔离保护 | [docs/tasks/phases/p38-official-source-dialog-guard](../tasks/phases/p38-official-source-dialog-guard/README.md) | `test-p38-official-source-dialog-guard.cjs` |
| **P39** | 源版对话与群聊切换回归 | [docs/tasks/phases/p39-source-agent-tab-switch-regression](../tasks/phases/p39-source-agent-tab-switch-regression/README.md) | `test-p39-source-agent-tab-switch-regression.cjs` |
| **P40** | 刷新清理与状态重置回归 | [docs/tasks/phases/p40-refresh-state-cleanup-regression](../tasks/phases/p40-refresh-state-cleanup-regression/README.md) | `test-p40-refresh-state-cleanup-regression.cjs` |
| **P44** | `prepare` 报错根因诊断 | [docs/tasks/phases/p44-source-dialog-prepare-diagnostic](../tasks/phases/p44-source-dialog-prepare-diagnostic/README.md) | `test-p44-source-dialog-prepare-diagnostic.cjs` |
| **P45** | 中间群聊主题化人话文案 | [docs/tasks/phases/p45-theme-aware-central-copy](../tasks/phases/p45-theme-aware-central-copy/README.md) | `test-p45-theme-aware-central-copy.cjs` |
| **P47** | 双语 UI 与工具作用域规范 | [docs/tasks/phases/p47-bilingual-ui-and-tool-scope](../tasks/phases/p47-bilingual-ui-and-tool-scope/README.md) | `test-p47-bilingual-ui-and-tool-scope.cjs` |
| **P48** | 真实多智能体闭环质量验收 | [docs/tasks/phases/p48-real-agent-loop-quality](../tasks/phases/p48-real-agent-loop-quality/README.md) | `test-p48-real-agent-loop-quality.cjs` |
| **P51** | 快速任务与长流程任务分层 | [docs/tasks/phases/p51-task-tier-progress](../tasks/phases/p51-task-tier-progress/README.md) | `test-p51-task-tier-progress.cjs` |
| **P53** | 消息与账本持久化 | [docs/tasks/phases/p53-message-ledger-persistence](../tasks/phases/p53-message-ledger-persistence/README.md) | `test-p53-message-ledger-persistence.cjs` |
| **P54** | 重启中断任务状态自愈恢复 | [docs/tasks/phases/p54-interrupted-assignment-recovery](../tasks/phases/p54-interrupted-assignment-recovery/README.md) | `test-p54-interrupted-assignment-recovery.cjs` |
| **P57~P60** | 双语 Prompt、API 与科技传奇主题 | [docs/tasks/phases/p60-tech-legends-theme](../tasks/phases/p60-tech-legends-theme/README.md) | `test-p57~p60-*.cjs` |
| **P62~P63** | 看门狗超时机制与报警信 | [docs/tasks/phases/p62-runtime-agent-watchdog](../tasks/phases/p62-runtime-agent-watchdog/README.md) | `test-p62~p63-*.cjs` |
| **P67** | 确认后执行事务卡片 | [docs/tasks/phases/p67-approve-run-transaction-card](../tasks/phases/p67-approve-run-transaction-card/README.md) | `test-p67-approve-run-transaction-card.cjs` |
| **P68** | 团队协同五大工具箱 | [docs/tasks/phases/p68-team-coordination-tools](../tasks/phases/p68-team-coordination-tools/README.md) | `test-p68-team-coordination-tools.cjs` |
| **P71~P73** | 新会话 Blank Hero 入口与自适应 | [docs/tasks/phases/p71-new-session-agent-entry](../tasks/phases/p71-new-session-agent-entry/README.md) | `test-p71~p73-*.cjs` |
| **P74** | 会话作用域房间强绑定 | [docs/tasks/phases/p74-session-scoped-room-binding](../tasks/phases/p74-session-scoped-room-binding/README.md) | `test-p74-session-room-binding.cjs` |
| **P75** | 五大主题文案差异化 | [docs/tasks/phases/p75-distinct-theme-empty-copy](../tasks/phases/p75-distinct-theme-empty-copy/README.md) | `test-p75-distinct-theme-copy.cjs` |
| **P76** | HUD 顶部独立双语切换按钮 | [docs/tasks/phases/p76-hud-locale-toggle-header](../tasks/phases/p76-hud-locale-toggle-header/README.md) | `test-p76-hud-locale-toggle-header.cjs` |
| **P77** | 中央执行状态实时探针 | [docs/tasks/phases/p77-central-live-execution-status](../tasks/phases/p77-central-live-execution-status/README.md) | `test-p77-central-live-execution-status.cjs` |
| **P78** | Agent turn surface fallback 兼容降级 | [docs/tasks/phases/p78-agent-turn-surface-fallback](../tasks/phases/p78-agent-turn-surface-fallback/README.md) | `test-p78-agent-turn-surface-fallback.cjs` |
| **P79** | 输入框常驻视口底部 | [docs/tasks/phases/p79-composer-outside-scroll](../tasks/phases/p79-composer-outside-scroll/README.md) | `test-p79-composer-outside-scroll.cjs` |
| **P81** | 主 Agent 分派与收口编排 | [docs/tasks/phases/p81-workflow-commander-delegation](../tasks/phases/p81-workflow-commander-delegation/README.md) | `test-p81-workflow-commander-delegation.cjs` |
| **P83** | Hero 入口防递归自点击 | [docs/tasks/phases/p83-hero-entry-self-click-guard](../tasks/phases/p83-hero-entry-self-click-guard/README.md) | `test-p83-hero-entry-self-click-guard.cjs` |
| **P84** | 长消息渐进式折叠遮罩 | [docs/tasks/phases/p84-collapsible-message-body](../tasks/phases/p84-collapsible-message-body/README.md) | `test-p84-collapsible-message-body.cjs` |
| **P85** | 全角色全链路双语覆盖 | [docs/tasks/phases/p85-bilingual-role-coverage](../tasks/phases/p85-bilingual-role-coverage/README.md) | `test-p85-bilingual-role-coverage.cjs` |
| **P86** | 原生工具行号 Diff 可视化 | [docs/tasks/phases/p86-native-tool-row-adapter](../tasks/phases/p86-native-tool-row-adapter/README.md) | `test-p86-native-tool-row-adapter.cjs` |
| **P87** | 对话防死循环与连续性自愈 | [docs/tasks/phases/p87-dialog-continuity-and-stall-prevention](../tasks/phases/p87-dialog-continuity-and-stall-prevention/README.md) | `test-p87-dialog-continuity.cjs` |
| **P88** | 原生工具直通与真实 Prompt Cache 审计 | [docs/tasks/phases/p88-official-tools-and-cache-metrics](../tasks/phases/p88-official-tools-and-cache-metrics/README.md) | `test-p88-official-tools-and-cache-metrics.cjs` |
| **P89** | DSH-native 零污染基础 | [docs/tasks/phases/p89-dsh-native-foundation](../tasks/phases/p89-dsh-native-foundation/README.md) | `test-p89-dsh-native-foundation.cjs` |
| **P90** | Runtime trace 与 liveness 状态机 | [docs/tasks/phases/p90-dsh-runtime-trace-liveness](../tasks/phases/p90-dsh-runtime-trace-liveness/README.md) | `test-p90-dsh-runtime-trace-liveness.cjs` |
| **P91** | Liveness-aware assignment watchdog | [docs/tasks/phases/p91-liveness-aware-watchdog](../tasks/phases/p91-liveness-aware-watchdog/README.md) | `test-p91-liveness-aware-watchdog.cjs` |
| **P92** | DSH-native tool event adapter | [docs/tasks/phases/p92-dsh-tool-event-adapter](../tasks/phases/p92-dsh-tool-event-adapter/README.md) | `test-p92-dsh-tool-event-adapter.cjs` |
| **P93** | Capability diagnostics HUD | [docs/tasks/phases/p93-capability-diagnostics-ui](../tasks/phases/p93-capability-diagnostics-ui/README.md) | `test-p93-capability-diagnostics-ui.cjs` |
| **P94** | Approval / workflow bridge diagnostics | [docs/tasks/phases/p94-approval-workflow-bridge](../tasks/phases/p94-approval-workflow-bridge/README.md) | `test-p94-approval-workflow-bridge.cjs` |

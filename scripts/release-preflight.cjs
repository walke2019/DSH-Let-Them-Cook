const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const errors = []
const exists = p => fs.existsSync(path.join(root, p))
const read = p => fs.readFileSync(path.join(root, p), 'utf8')

for (const file of fs.readdirSync(root)) {
  if (/\.(md|txt)$/i.test(file) && !['README.md', 'AGENTS.md'].includes(file)) errors.push(`root document must live under docs/: ${file}`)
}
const tempDocs = fs.readdirSync(path.join(root, 'docs')).filter(file => /^_patch/i.test(file))
if (tempDocs.length) errors.push(`temporary patch docs remain: ${tempDocs.join(', ')}`)

const required = ['README.md','AGENTS.md','docs/TODO.md','docs/tasks/phases/p4-dsh-compat-and-test-matrix/README.md','docs/tasks/phases/p10-end-to-end-small-task/README.md','docs/tasks/phases/p28-roster-style-tokens/README.md','src/compat/dsh.ts','src/engine/agent-runtime.ts','src/engine/auto-setup.ts','src/engine/model-recommender.ts','src/engine/structured-result.ts','src/client/GroupChatSideDock.tsx','src/client/group-chat-hud-types.ts','src/client/group-chat-hud-styles.ts','src/client/GroupChatConversationTab.tsx','src/client/GroupChatHeroEntry.tsx','scripts/test-matrix.cjs','scripts/api-smoke.cjs','scripts/e2e-no-llm.cjs','docs/tasks/phases/p39-source-agent-tab-switch-regression/README.md','__tests__/test-p39-source-agent-tab-switch-regression.cjs','docs/tasks/phases/p40-refresh-state-cleanup-regression/README.md','__tests__/test-p40-refresh-state-cleanup-regression.cjs','docs/tasks/phases/p42-agent-chat-entry-usable-regression/README.md','__tests__/test-p42-agent-chat-entry-usable-regression.cjs','docs/tasks/phases/p43-final-closure-audit/README.md','__tests__/test-p43-final-closure-audit.cjs','docs/tasks/phases/p44-source-dialog-prepare-diagnostic/README.md','__tests__/test-p44-source-dialog-prepare-diagnostic.cjs','docs/tasks/phases/p45-theme-aware-central-copy/README.md','__tests__/test-p45-theme-aware-central-copy.cjs','docs/tasks/phases/p46-i18n-panel-task-smoke/README.md',
  'docs/tasks/phases/p47-bilingual-ui-and-tool-scope/README.md','__tests__/test-p47-bilingual-ui-and-tool-scope.cjs','docs/tasks/phases/p48-real-agent-loop-quality/README.md','__tests__/test-p48-real-agent-loop-quality.cjs','docs/tasks/phases/p49-agent-timeout-diagnostic/README.md','__tests__/test-p49-agent-timeout-diagnostic.cjs','docs/tasks/phases/p50-real-moderator-led-loop/README.md','__tests__/test-p50-real-moderator-led-loop.cjs','docs/tasks/phases/p51-task-tier-progress/README.md','__tests__/test-p51-task-tier-progress.cjs','docs/tasks/phases/p52-autosetup-dispatch-guard/README.md','__tests__/test-p52-autosetup-dispatch-guard.cjs','docs/tasks/phases/p53-message-ledger-persistence/README.md','__tests__/test-p53-message-ledger-persistence.cjs','docs/tasks/phases/p54-interrupted-assignment-recovery/README.md','__tests__/test-p54-interrupted-assignment-recovery.cjs','docs/tasks/phases/p55-bilingual-export-summary/README.md','__tests__/test-p55-bilingual-export-summary.cjs','docs/tasks/phases/p56-runtime-autosetup-i18n/README.md','__tests__/test-p56-runtime-autosetup-i18n.cjs','docs/tasks/phases/p57-agent-runtime-prompt-i18n/README.md','__tests__/test-p57-agent-runtime-prompt-i18n.cjs','docs/tasks/phases/p58-tool-workflow-api-i18n/README.md','__tests__/test-p58-tool-workflow-api-i18n.cjs','docs/tasks/phases/p59-theme-workflow-content-i18n/README.md','__tests__/test-p59-theme-workflow-content-i18n.cjs','docs/tasks/phases/p60-tech-legends-theme/README.md','__tests__/test-p60-tech-legends-theme.cjs','docs/tasks/phases/p61-english-source-bilingual-runtime/README.md','__tests__/test-p61-english-source-bilingual-runtime.cjs','docs/tasks/phases/p62-runtime-agent-watchdog/README.md','__tests__/test-p62-runtime-agent-watchdog.cjs','docs/tasks/phases/p63-assignment-watchdog-timeout/README.md','__tests__/test-p63-assignment-watchdog-timeout.cjs','docs/tasks/phases/p64-chat-ui-composer-progression/README.md','__tests__/test-p64-chat-ui-composer-progression.cjs','docs/tasks/phases/p65-captain-task-protocol/README.md','__tests__/test-p65-captain-task-protocol.cjs','docs/tasks/phases/p66-durable-subagent-resume/README.md','__tests__/test-p66-durable-subagent-resume.cjs','docs/tasks/phases/p67-approve-run-transaction-card/README.md','__tests__/test-p67-approve-run-transaction-card.cjs','docs/tasks/phases/p68-team-coordination-tools/README.md','__tests__/test-p68-team-coordination-tools.cjs','docs/tasks/phases/p69-task-cockpit-productization/README.md','__tests__/test-p69-task-cockpit-productization.cjs','docs/tasks/phases/p70-model-health-and-switching/README.md','__tests__/test-p70-model-health-and-switching.cjs','docs/tasks/phases/p71-new-session-agent-entry/README.md','__tests__/test-p71-new-session-agent-entry.cjs','docs/tasks/phases/p72-hud-message-margins/README.md','__tests__/test-p72-hud-message-margins.cjs','docs/tasks/phases/p73-hero-left-collapse-adaptation/README.md','__tests__/test-p73-hero-left-collapse.cjs','docs/tasks/phases/p74-session-scoped-room-binding/README.md','__tests__/test-p74-session-room-binding.cjs','docs/tasks/phases/p75-distinct-theme-empty-copy/README.md','__tests__/test-p75-distinct-theme-copy.cjs','docs/tasks/phases/p76-hud-locale-toggle-header/README.md','__tests__/test-p76-hud-locale-toggle-header.cjs','docs/tasks/phases/p77-central-live-execution-status/README.md','__tests__/test-p77-central-live-execution-status.cjs','docs/tasks/phases/p78-agent-turn-surface-fallback/README.md','__tests__/test-p78-agent-turn-surface-fallback.cjs','docs/tasks/phases/p79-composer-outside-scroll/README.md','__tests__/test-p79-composer-outside-scroll.cjs','docs/tasks/phases/p80-central-loading-state/README.md','__tests__/test-p80-central-loading-state.cjs','docs/tasks/phases/p81-workflow-commander-delegation/README.md','__tests__/test-p81-workflow-commander-delegation.cjs','docs/tasks/phases/p82-official-like-central-execution/README.md','__tests__/test-p82-official-like-central-execution.cjs','docs/tasks/phases/p83-hero-entry-self-click-guard/README.md','__tests__/test-p83-hero-entry-self-click-guard.cjs','__tests__/test-p46-i18n-panel-task-smoke.cjs']
for (const file of required) if (!exists(file)) errors.push(`missing required artifact: ${file}`)

const pkg = JSON.parse(read('package.json'))
for (const script of ['typecheck','build:all','test:matrix','smoke:api','test:e2e:no-llm','test:ui:visual','test:ui:switch','test:ui:refresh','test:ui:entry','test:diagnostic:prepare','test:theme-copy','test:i18n-panel-smoke',
  'test:bilingual-ui','test:agent-loop-quality','test:agent-timeout-diagnostic','test:real-moderator-loop','test:task-tier-progress','test:autosetup-dispatch-guard','test:message-ledger-persistence','test:interrupted-assignment-recovery','test:bilingual-export-summary','test:runtime-autosetup-i18n','test:agent-runtime-prompt-i18n','test:tool-workflow-api-i18n','test:theme-workflow-content-i18n','test:tech-legends-theme','test:english-source-bilingual-runtime','test:runtime-agent-watchdog','test:assignment-watchdog-timeout','test:chat-ui-composer-progression','test:captain-task-protocol','test:durable-subagent-resume','test:approve-run-transaction-card','test:team-coordination-tools','test:task-cockpit-productization','test:model-health-switching','test:new-session-agent-entry','test:hud-message-margins','test:hero-left-collapse','test:session-room-binding','test:distinct-theme-copy','test:hud-locale-toggle-header','test:central-live-status','test:agent-turn-surface-fallback','test:composer-outside-scroll','test:central-loading-state','test:workflow-commander-delegation','test:official-like-central-execution','test:hero-entry-self-click-guard','preflight']) if (!pkg.scripts?.[script]) errors.push(`missing package script: ${script}`)
if (pkg.main !== './lib/index.js') errors.push('package main must point to ./lib/index.js')
if (!pkg.dsh?.client?.inject?.includes('@deepseek-ai/dsh-client-runtime')) errors.push('dsh client runtime injection missing')

const agents = read('AGENTS.md')
if (!agents.includes('严禁修改 `@deepseek-ai/dsh` 核心源码')) errors.push('AGENTS.md core-source guard missing')
if (!agents.includes('/Docs')) errors.push('AGENTS.md Docs placement guard missing')
if (!agents.includes('源版对话 / Agent 群聊切换守则') || !agents.includes('npm run test:ui:refresh')) errors.push('AGENTS.md source/agent tab refresh guard missing')
if (!agents.includes('工具调度器 prepare 报错排查守则') || !agents.includes('@deepseek-ai/dsh-tools')) errors.push('AGENTS.md backend prepare diagnostic guard missing')
if (!agents.includes('官方默认启动与认证避坑') || !agents.includes('dsh web authentication required')) errors.push('AGENTS.md official startup/auth guard missing')
if (!agents.includes('HUD 消息边距与右侧避让铁律') || !agents.includes('npm run test:hud-message-margins')) errors.push('AGENTS.md HUD margin guard missing')
if (!agents.includes('新会话入口左栏收起自适应铁律') || !agents.includes('npm run test:hero-left-collapse')) errors.push('AGENTS.md hero left-collapse guard missing')
if (!agents.includes('新会话与房间绑定铁律') || !agents.includes('npm run test:session-room-binding')) errors.push('AGENTS.md session room binding guard missing')
if (!agents.includes('中央起始文案主题差异铁律') || !agents.includes('npm run test:distinct-theme-copy')) errors.push('AGENTS.md distinct theme copy guard missing')
if (!agents.includes('HUD 语言切换入口铁律') || !agents.includes('npm run test:hud-locale-toggle-header')) errors.push('AGENTS.md HUD locale toggle guard missing')
if (/ctx\.version/.test(read('src/compat/dsh.ts'))) errors.push('compat must not access ctx.version directly')

const layout = read('src/client/layout-push.ts')
if (layout.includes('padding-right: var(--dsh-group-chat-width')) errors.push('layout must not squeeze official center view')
if (layout.includes('body[data-dsh-group-chat-active="true"]')) errors.push('layout must not use legacy global full-view body takeover')
if (layout.includes('[data-composer-seat]') || layout.includes('[data-conversation-scroll]') || layout.includes('#root [data-dsh-frame]')) errors.push('layout must not patch DSH host DOM internals')

const clientEntry = read('src/client/index.ts')
const safeTab = read('src/client/GroupChatConversationTab.tsx')
if (!clientEntry.includes('ctx.slots.inject("conversation.view"')) errors.push('safe middle conversation.view tab missing')
if (!clientEntry.includes('GroupChatConversationView')) errors.push('client entry must use safe conversation view adapter')
if (clientEntry.includes('GroupChatPanel')) errors.push('client entry must not import GroupChatPanel directly')
if (!clientEntry.includes('prepare: GroupChatConversationView.prepare') || !safeTab.includes('prepare: () => ({})')) errors.push('safe conversation.view adapter missing prepare')
if (!clientEntry.includes('component: () => createElement(GroupChatConversationView)')) errors.push('safe conversation.view adapter missing component factory')
if (!safeTab.includes('<GroupChatPanel mode="dock" />') || safeTab.includes('mode="full"')) errors.push('safe middle tab must mount GroupChatPanel in dock mode only')
if (!safeTab.includes('data-dsh-group-chat-tab-active')) errors.push('safe conversation tab must expose plugin active state for HUD coordination')
if (layout.includes('[data-composer-seat]') || layout.includes('[data-conversation-scroll]')) errors.push('official conversation internals must remain untouched by layout CSS')

const dock = read('src/client/GroupChatSideDock.tsx')
const topControls = read('src/client/GroupChatHudTopControls.tsx')
const workflowPanel = read('src/client/GroupChatHudWorkflowPanel.tsx')
const rosterPanel = read('src/client/GroupChatHudRosterPanel.tsx')
const scratchpadPanel = read('src/client/GroupChatHudScratchpadPanel.tsx')
const hudSurface = dock + '\n' + topControls + '\n' + workflowPanel + '\n' + rosterPanel + '\n' + scratchpadPanel
if (dock.includes('GroupChatPanel') || dock.includes("label: '特遣对话'")) errors.push('HUD must not duplicate extension chat entry')
for (const marker of ['浮动','停靠','结构化结果','标记已读','默认（沙雕整活）','默认（工作流）']) if (!hudSurface.includes(marker)) errors.push(`HUD marker missing: ${marker}`)

const todo = read('docs/TODO.md')
for (const phase of ['P0','P1','P2','P3','P4','P5','P6','P7','P8','P9','P10']) if (!todo.includes(`## ${phase}`)) errors.push(`TODO missing ${phase}`)

if (errors.length) { console.error(JSON.stringify({P11_PREFLIGHT_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P11_PREFLIGHT_EXIT:0, rootDocumentsOk:true, tempPatchDocs:0, requiredArtifacts:required.length, packageScripts:['typecheck','build:all','test:matrix','smoke:api','test:e2e:no-llm','test:ui:visual','test:ui:switch','test:ui:refresh','test:ui:entry','test:diagnostic:prepare','test:theme-copy','test:i18n-panel-smoke',
  'test:bilingual-ui','test:agent-loop-quality','test:agent-timeout-diagnostic','test:real-moderator-loop','test:task-tier-progress','test:autosetup-dispatch-guard','test:message-ledger-persistence','test:interrupted-assignment-recovery','test:bilingual-export-summary','test:runtime-autosetup-i18n','test:agent-runtime-prompt-i18n','test:tool-workflow-api-i18n','test:theme-workflow-content-i18n','test:tech-legends-theme','test:english-source-bilingual-runtime','test:runtime-agent-watchdog','test:assignment-watchdog-timeout','test:chat-ui-composer-progression','test:captain-task-protocol','test:durable-subagent-resume','test:approve-run-transaction-card','test:team-coordination-tools','test:task-cockpit-productization','test:model-health-switching','test:new-session-agent-entry','test:hud-message-margins','test:hero-left-collapse','test:session-room-binding','test:distinct-theme-copy','test:hud-locale-toggle-header','test:central-live-status','test:agent-turn-surface-fallback','test:composer-outside-scroll','test:central-loading-state','test:workflow-commander-delegation','test:official-like-central-execution','test:hero-entry-self-click-guard','preflight']}, null, 2))



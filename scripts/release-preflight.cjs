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

function countDocs(dir) {
  let count = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      count += countDocs(full)
    } else if (/\.(md|txt)$/i.test(entry.name)) {
      count++
    }
  }
  return count
}
const docCount = countDocs(path.join(root, 'docs'))
if (docCount > 15) errors.push(`Anti-Process Bloat Guardrail tripped: total docs count ${docCount} exceeds ceiling of 15`)

const required = ['README.md','AGENTS.md','docs/TODO.md','docs/tasks/milestones-index.md','docs/agents/01-ui-and-lifecycle.md','docs/agents/02-tools-and-ledger.md','docs/agents/03-orchestration-and-anti-stall.md','docs/agents/04-i18n-personas-workspaces.md','src/compat/dsh.ts','src/engine/agent-runtime.ts','src/engine/auto-setup.ts','src/engine/model-recommender.ts','src/engine/structured-result.ts','src/client/GroupChatSideDock.tsx','src/client/group-chat-hud-types.ts','src/client/group-chat-hud-styles.ts','src/client/GroupChatConversationTab.tsx','src/client/GroupChatHeroEntry.tsx','scripts/test-matrix.cjs','scripts/api-smoke.cjs','scripts/e2e-no-llm.cjs','__tests__/test-p39-source-agent-tab-switch-regression.cjs','__tests__/test-p40-refresh-state-cleanup-regression.cjs','__tests__/test-p42-agent-chat-entry-usable-regression.cjs','__tests__/test-p43-final-closure-audit.cjs','__tests__/test-p44-source-dialog-prepare-diagnostic.cjs','__tests__/test-p45-theme-aware-central-copy.cjs','__tests__/test-p46-i18n-panel-task-smoke.cjs',
  '__tests__/test-p47-bilingual-ui-and-tool-scope.cjs','__tests__/test-p48-real-agent-loop-quality.cjs','__tests__/test-p49-agent-timeout-diagnostic.cjs','__tests__/test-p50-real-moderator-led-loop.cjs','__tests__/test-p51-task-tier-progress.cjs','__tests__/test-p52-autosetup-dispatch-guard.cjs','__tests__/test-p53-message-ledger-persistence.cjs','__tests__/test-p54-interrupted-assignment-recovery.cjs','__tests__/test-p55-bilingual-export-summary.cjs','__tests__/test-p56-runtime-autosetup-i18n.cjs','__tests__/test-p57-agent-runtime-prompt-i18n.cjs','__tests__/test-p58-tool-workflow-api-i18n.cjs','__tests__/test-p59-theme-workflow-content-i18n.cjs','__tests__/test-p60-tech-legends-theme.cjs','__tests__/test-p61-english-source-bilingual-runtime.cjs','__tests__/test-p62-runtime-agent-watchdog.cjs','__tests__/test-p63-assignment-watchdog-timeout.cjs','__tests__/test-p64-chat-ui-composer-progression.cjs','__tests__/test-p65-captain-task-protocol.cjs','__tests__/test-p66-durable-subagent-resume.cjs','__tests__/test-p67-approve-run-transaction-card.cjs','__tests__/test-p68-team-coordination-tools.cjs','__tests__/test-p69-task-cockpit-productization.cjs','__tests__/test-p70-model-health-and-switching.cjs','__tests__/test-p71-new-session-agent-entry.cjs','__tests__/test-p72-hud-message-margins.cjs','__tests__/test-p73-hero-left-collapse.cjs','__tests__/test-p74-session-room-binding.cjs','__tests__/test-p75-distinct-theme-copy.cjs','__tests__/test-p76-hud-locale-toggle-header.cjs','__tests__/test-p77-central-live-execution-status.cjs','__tests__/test-p78-agent-turn-surface-fallback.cjs','__tests__/test-p79-composer-outside-scroll.cjs','__tests__/test-p80-central-loading-state.cjs','__tests__/test-p81-workflow-commander-delegation.cjs','__tests__/test-p82-official-like-central-execution.cjs','__tests__/test-p83-hero-entry-self-click-guard.cjs','__tests__/test-p46-i18n-panel-task-smoke.cjs']
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
if (clientEntry.includes('conversation.input.left') || clientEntry.includes('GroupChatInputEntry')) errors.push('official composer must remain 100% untouched without GroupChatInputEntry or conversation.input.left')
if (dock.includes('<GroupChatHeroEntry') || dock.includes('GroupChatHeroEntry />')) errors.push('new session hero entry must not be mounted; keep official blank hero intact')
for (const marker of ['浮动','停靠','结构化结果','标记已读','默认（沙雕整活）','默认（工作流）']) if (!hudSurface.includes(marker)) errors.push(`HUD marker missing: ${marker}`)

const todo = read('docs/TODO.md')
for (const phase of ['P0','P1','P2','P3','P4','P5','P6','P7','P8','P9','P10']) if (!todo.includes(`## ${phase}`)) errors.push(`TODO missing ${phase}`)

if (errors.length) { console.error(JSON.stringify({P11_PREFLIGHT_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P11_PREFLIGHT_EXIT:0, rootDocumentsOk:true, tempPatchDocs:0, requiredArtifacts:required.length, packageScripts:['typecheck','build:all','test:matrix','smoke:api','test:e2e:no-llm','test:ui:visual','test:ui:switch','test:ui:refresh','test:ui:entry','test:diagnostic:prepare','test:theme-copy','test:i18n-panel-smoke',
  'test:bilingual-ui','test:agent-loop-quality','test:agent-timeout-diagnostic','test:real-moderator-loop','test:task-tier-progress','test:autosetup-dispatch-guard','test:message-ledger-persistence','test:interrupted-assignment-recovery','test:bilingual-export-summary','test:runtime-autosetup-i18n','test:agent-runtime-prompt-i18n','test:tool-workflow-api-i18n','test:theme-workflow-content-i18n','test:tech-legends-theme','test:english-source-bilingual-runtime','test:runtime-agent-watchdog','test:assignment-watchdog-timeout','test:chat-ui-composer-progression','test:captain-task-protocol','test:durable-subagent-resume','test:approve-run-transaction-card','test:team-coordination-tools','test:task-cockpit-productization','test:model-health-switching','test:new-session-agent-entry','test:hud-message-margins','test:hero-left-collapse','test:session-room-binding','test:distinct-theme-copy','test:hud-locale-toggle-header','test:central-live-status','test:agent-turn-surface-fallback','test:composer-outside-scroll','test:central-loading-state','test:workflow-commander-delegation','test:official-like-central-execution','test:hero-entry-self-click-guard','preflight']}, null, 2))



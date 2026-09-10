const { spawnSync } = require('node:child_process')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const steps = [
  ['npm', ['run', 'typecheck']],
  ['node', ['Docs/execution-tool-routing-runtime/test-tool-routing.cjs']],
  ['node', ['Docs/p1-assignment-mailbox-runtime/test-p1-assignment-mailbox.cjs']],
  ['node', ['Docs/p2-workflow-task-dag-quality-gate/test-p2-workflow-task-dag.cjs']],
  ['node', ['Docs/p3-model-recommendation-engine/test-p3-model-recommender.cjs']],
  ['node', ['Docs/p4-dsh-compat-and-test-matrix/test-p4-dsh-compat.cjs']],
  ['node', ['Docs/p5-hud-dag-assignment-mailbox/test-p5-hud.cjs']],
  ['node', ['Docs/p6-structured-agent-result/test-p6-structured-result.cjs']],
  ['node', ['Docs/p7-hud-structured-result-actions/test-p7-hud-actions.cjs']],
  ['node', ['Docs/p8-hud-overlay-layout/test-p8-overlay-layout.cjs']],
  ['node', ['Docs/p9-draggable-hud/test-p9-draggable-hud.cjs']],
  ['node', ['Docs/p10-end-to-end-small-task/test-p10-e2e-definition.cjs']],
  ['node', ['Docs/p11-release-preflight/test-p11-preflight-definition.cjs']],
  ['node', ['Docs/p12-official-chat-compat/test-p12-official-chat-compat.cjs']],
  ['node', ['Docs/p13-hud-chat-entry/test-p13-hud-chat-entry.cjs']],
  ['node', ['Docs/p14-safe-middle-conversation-tab/test-p14-safe-middle-conversation-tab.cjs']],
  ['node', ['Docs/p15-auto-plan-confirm-flow/test-p15-auto-plan-confirm-flow.cjs']],
  ['node', ['Docs/p16-theme-voice-copy-system/test-p16-theme-voice-copy-system.cjs']],
  ['node', ['Docs/p17-hud-director-console/test-p17-hud-director-console.cjs']],
  ['npm', ['run', 'build:all']],
  ['node', ['Docs/p19-real-project-loop/test-p19-real-project-loop.cjs']],
  ['node', ['Docs/p20-low-friction-onboarding/test-p20-low-friction-onboarding.cjs']],
  ['node', ['Docs/p21-hud-top-controls-component/test-p21-hud-top-controls-component.cjs']],
  ['node', ['Docs/p22-hud-workflow-panel-component/test-p22-hud-workflow-panel-component.cjs']],
  ['node', ['Docs/p23-hud-roster-panel-component/test-p23-hud-roster-panel-component.cjs']],
  ['node', ['Docs/p24-hud-scratchpad-panel-component/test-p24-hud-scratchpad-panel-component.cjs']],
  ['node', ['Docs/p25-sidedock-type-dedupe/test-p25-sidedock-type-dedupe.cjs']],
  ['node', ['Docs/p26-hud-shared-types/test-p26-hud-shared-types.cjs']],
  ['node', ['Docs/p27-hud-style-tokens/test-p27-hud-style-tokens.cjs']],
  ['node', ['Docs/p28-roster-style-tokens/test-p28-roster-style-tokens.cjs']],
  ['node', ['Docs/p29-workflow-style-tokens/test-p29-workflow-style-tokens.cjs']],
  ['node', ['Docs/p30-top-controls-style-tokens/test-p30-top-controls-style-tokens.cjs']],
  ['node', ['Docs/p31-final-usability-acceptance/test-p31-final-usability-acceptance.cjs']],
  ['node', ['Docs/p32-workflow-progressive-disclosure/test-p32-workflow-progressive-disclosure.cjs']],
  ['node', ['Docs/p33-workflow-compact-browser-check/test-p33-workflow-compact-browser-check.cjs']],
  ['node', ['Docs/p34-workflow-accordion-details/test-p34-workflow-accordion-details.cjs']],
  ['node', ['Docs/p35-team-ledger-tab-split/test-p35-team-ledger-tab-split.cjs']],
  ['node', ['Docs/p36-ledger-progressive-records/test-p36-ledger-progressive-records.cjs']],
  ['node', ['Docs/p37-team-progressive-roster/test-p37-team-progressive-roster.cjs']],
  ['node', ['Docs/p38-official-source-dialog-guard/test-p38-official-source-dialog-guard.cjs']],
  ['node', ['Docs/p39-source-agent-tab-switch-regression/test-p39-source-agent-tab-switch-regression.cjs']],
  ['node', ['Docs/p40-refresh-state-cleanup-regression/test-p40-refresh-state-cleanup-regression.cjs']],
  ['node', ['Docs/p42-agent-chat-entry-usable-regression/test-p42-agent-chat-entry-usable-regression.cjs']],
  ['node', ['Docs/p43-final-closure-audit/test-p43-final-closure-audit.cjs']],
  ['node', ['Docs/p47-bilingual-ui-and-tool-scope/test-p47-bilingual-ui-and-tool-scope.cjs']],
  ['node', ['Docs/p48-real-agent-loop-quality/test-p48-real-agent-loop-quality.cjs']],
  ['node', ['Docs/p49-agent-timeout-diagnostic/test-p49-agent-timeout-diagnostic.cjs']],
  ['node', ['Docs/p50-real-moderator-led-loop/test-p50-real-moderator-led-loop.cjs']],
  ['node', ['Docs/p51-task-tier-progress/test-p51-task-tier-progress.cjs']],
  ['node', ['Docs/p52-autosetup-dispatch-guard/test-p52-autosetup-dispatch-guard.cjs']],
  ['node', ['Docs/p53-message-ledger-persistence/test-p53-message-ledger-persistence.cjs']],
  ['node', ['Docs/p54-interrupted-assignment-recovery/test-p54-interrupted-assignment-recovery.cjs']],
  ['node', ['Docs/p55-bilingual-export-summary/test-p55-bilingual-export-summary.cjs']],
  ['node', ['Docs/p56-runtime-autosetup-i18n/test-p56-runtime-autosetup-i18n.cjs']],
  ['node', ['Docs/p57-agent-runtime-prompt-i18n/test-p57-agent-runtime-prompt-i18n.cjs']],
  ['node', ['Docs/p58-tool-workflow-api-i18n/test-p58-tool-workflow-api-i18n.cjs']],
  ['node', ['Docs/p59-theme-workflow-content-i18n/test-p59-theme-workflow-content-i18n.cjs']],
  ['node', ['Docs/p60-tech-legends-theme/test-p60-tech-legends-theme.cjs']],
  ['node', ['Docs/p61-english-source-bilingual-runtime/test-p61-english-source-bilingual-runtime.cjs']],
  ['node', ['Docs/p62-runtime-agent-watchdog/test-p62-runtime-agent-watchdog.cjs']],
  ['node', ['Docs/p63-assignment-watchdog-timeout/test-p63-assignment-watchdog-timeout.cjs']],
  ['node', ['Docs/p64-chat-ui-composer-progression/test-p64-chat-ui-composer-progression.cjs']],
  ['node', ['Docs/p65-captain-task-protocol/test-p65-captain-task-protocol.cjs']],
  ['node', ['Docs/p66-durable-subagent-resume/test-p66-durable-subagent-resume.cjs']],
  ['node', ['Docs/p67-approve-run-transaction-card/test-p67-approve-run-transaction-card.cjs']],
  ['node', ['Docs/p68-team-coordination-tools/test-p68-team-coordination-tools.cjs']],
  ['node', ['Docs/p69-task-cockpit-productization/test-p69-task-cockpit-productization.cjs']],
  ['node', ['Docs/p70-model-health-and-switching/test-p70-model-health-and-switching.cjs']],
  ['node', ['Docs/p71-new-session-agent-entry/test-p71-new-session-agent-entry.cjs']],
  ['node', ['Docs/p72-hud-message-margins/test-p72-hud-message-margins.cjs']],
  ['node', ['Docs/p73-hero-left-collapse-adaptation/test-p73-hero-left-collapse.cjs']],
  ['node', ['Docs/p74-session-scoped-room-binding/test-p74-session-room-binding.cjs']],
  ['node', ['Docs/p75-distinct-theme-empty-copy/test-p75-distinct-theme-copy.cjs']],
  ['node', ['Docs/p76-hud-locale-toggle-header/test-p76-hud-locale-toggle-header.cjs']],
  ['node', ['Docs/p77-central-live-execution-status/test-p77-central-live-execution-status.cjs']],
  ['node', ['Docs/p78-agent-turn-surface-fallback/test-p78-agent-turn-surface-fallback.cjs']],
  ['node', ['Docs/p79-composer-outside-scroll/test-p79-composer-outside-scroll.cjs']],
  ['node', ['scripts/e2e-no-llm.cjs']],
  ['npm', ['run', 'preflight']],
]

for (const [cmd, args] of steps) {
  console.log(`\n[MATRIX] ${cmd} ${args.join(' ')}`)
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) {
    console.error(`[MATRIX] failed: ${cmd} ${args.join(' ')} -> ${result.status}`)
    process.exit(result.status || 1)
  }
}
console.log('\nTEST_MATRIX_EXIT:0')



























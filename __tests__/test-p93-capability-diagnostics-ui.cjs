const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const panel = read('src/client/GroupChatHudDiagnosticsPanel.tsx')
const dock = read('src/client/GroupChatSideDock.tsx')
const types = read('src/client/group-chat-hud-types.ts')
const errors = []

for (const marker of [
  'GroupChatHudDiagnosticsPanel',
  'data-dsh-capability-diagnostics="true"',
  'DSH Native Capability Diagnostics',
  'agents.create',
  'sessionProjections.stateOf',
  'tools.restrict({ allow })',
  'dsh-session-projections',
  'dsh-runtime-liveness',
  'dsh-tool-event-adapter',
  'instead of patch-style DOM',
]) {
  if (!panel.includes(marker)) errors.push(`diagnostics panel missing marker: ${marker}`)
}

for (const marker of [
  "import {GroupChatHudDiagnosticsPanel} from './GroupChatHudDiagnosticsPanel.js'",
  'CompatReport',
  'fetchCompatData',
  "fetch('/dsh-group-chat/api/compat')",
  "{ id: 'diagnostics'",
  "activeTab === 'diagnostics'",
  "ledgerSource={compat?.sources?.ledger || (compat?.features?.sessionProjectionStateOf ? 'dsh-session-projections' : 'event-stream-usage')}",
]) {
  if (!dock.includes(marker)) errors.push(`side dock missing marker: ${marker}`)
}

for (const marker of ['export interface CompatReport', 'features: Record<string, boolean>', 'optimizations: string[]']) {
  if (!types.includes(marker)) errors.push(`types missing marker: ${marker}`)
}

if (errors.length) { console.error(JSON.stringify({P93_CAPABILITY_DIAGNOSTICS_UI_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P93_CAPABILITY_DIAGNOSTICS_UI_EXIT:0, diagnostics:'hud-dsh-native-capabilities'}, null, 2))

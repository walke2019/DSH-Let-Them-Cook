const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const errors = []
const types = read('src/client/group-chat-hud-types.ts')
const dock = read('src/client/GroupChatSideDock.tsx')
const roster = read('src/client/GroupChatHudRosterPanel.tsx')
const workflow = read('src/client/GroupChatHudWorkflowPanel.tsx')

for (const exported of ['WorkflowTask','AssignmentEnvelope','AgentMailboxMessage','StructuredAgentResult','GroupMessageData','RuntimeMetrics','ModelLedgerData','LedgerData']) {
  if (!types.includes(`export interface ${exported}`)) errors.push(`shared HUD type missing: ${exported}`)
}
if (!dock.includes("from './group-chat-hud-types.js'")) errors.push('SideDock must import HUD types from shared file')
if (dock.includes("from './GroupChatHudRosterPanel.js'\nimport type")) errors.push('SideDock must not import types from RosterPanel')
if (!roster.includes("from './group-chat-hud-types.js'")) errors.push('RosterPanel must import HUD types from shared file')
if (!workflow.includes("from './group-chat-hud-types.js'")) errors.push('WorkflowPanel must import HUD types from shared file')
for (const file of [['SideDock',dock],['RosterPanel',roster],['WorkflowPanel',workflow]]) {
  for (const forbidden of ['interface AssignmentEnvelope','interface AgentMailboxMessage','interface RuntimeMetrics','interface ModelLedgerData','interface LedgerData']) {
    if (file[1].includes(forbidden)) errors.push(`${file[0]} still defines shared type: ${forbidden}`)
  }
}
if (!dock.includes('<GroupChatHudWorkflowPanel') || !dock.includes('<GroupChatHudScratchpadPanel') || !dock.includes('<GroupChatHudRosterPanel')) errors.push('SideDock must remain delegating shell')

if (errors.length) { console.error(JSON.stringify({P26_HUD_SHARED_TYPES_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P26_HUD_SHARED_TYPES_EXIT:0, sharedTypeFile:'src/client/group-chat-hud-types.ts', exportedTypes:8}, null, 2))

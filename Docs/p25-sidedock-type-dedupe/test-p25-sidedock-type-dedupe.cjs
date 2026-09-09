const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const errors = []
const dock = read('src/client/GroupChatSideDock.tsx')
const roster = read('src/client/GroupChatHudRosterPanel.tsx')
const sharedTypes = read('src/client/group-chat-hud-types.ts')

if (!dock.includes("from './group-chat-hud-types.js'")) errors.push('SideDock must import shared HUD data types from shared file')
for (const forbidden of ['interface AssignmentEnvelope','interface AgentMailboxMessage','interface RuntimeMetrics','interface ModelLedgerData','interface LedgerData','function formatDuration','function formatTokens','function metricLine','function mergeMetrics','function statusColor','function shortId']) {
  if (dock.includes(forbidden)) errors.push(`SideDock still contains duplicated helper/type: ${forbidden}`)
}
for (const exported of ['export interface AssignmentEnvelope','export interface AgentMailboxMessage','export interface RuntimeMetrics','export interface ModelLedgerData','export interface LedgerData']) {
  if (!sharedTypes.includes(exported)) errors.push(`Shared HUD type file must export: ${exported}`)
}
for (const marker of ['metricLine','mergeMetrics','AvatarBadge','总体运行统计','按 Agent / 模型展开']) {
  if (!roster.includes(marker)) errors.push(`Roster panel lost ledger/avatar marker: ${marker}`)
}
if (!dock.includes('<GroupChatHudWorkflowPanel') || !dock.includes('<GroupChatHudScratchpadPanel') || !dock.includes('<GroupChatHudRosterPanel')) errors.push('SideDock must remain a delegating HUD shell')

if (errors.length) { console.error(JSON.stringify({P25_SIDEDOCK_TYPE_DEDUPE_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P25_SIDEDOCK_TYPE_DEDUPE_EXIT:0, sideDockIsShell:true, removedHelpers:6, sharedTypes:5}, null, 2))

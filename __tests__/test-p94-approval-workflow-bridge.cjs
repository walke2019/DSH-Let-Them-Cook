const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const bridge = read('src/engine/dsh-approval-workflow-bridge.ts')
const compat = read('src/compat/dsh.ts')
const panel = read('src/client/GroupChatHudDiagnosticsPanel.tsx')
const dock = read('src/client/GroupChatSideDock.tsx')
const types = read('src/client/group-chat-hud-types.ts')
const errors = []

for (const marker of [
  'DshApprovalWorkflowBridgeReport',
  'detectDshApprovalWorkflowBridge',
  'nativeApprovalRequest',
  'nativeWorkflowRun',
  'dsh-user-approval',
  'plugin-transaction-card',
  'dsh-workflow-run',
  'plugin-workflow-dag',
  '不伪装为 native approval',
  '不伪装为 native workflow',
]) {
  if (!bridge.includes(marker)) errors.push(`bridge missing marker: ${marker}`)
}

for (const marker of [
  "import { detectDshApprovalWorkflowBridge",
  'bridge: DshApprovalWorkflowBridgeReport',
  'nativeApprovalRequest: boolean',
  'nativeWorkflowRun: boolean',
  'sources: {',
  'approval: bridge.sources.approval',
  'workflow: bridge.sources.workflow',
]) {
  if (!compat.includes(marker)) errors.push(`compat missing marker: ${marker}`)
}

for (const marker of [
  'approval.request',
  'workflow.run',
  'approvalSource',
  'workflowSource',
  'plugin-transaction-card',
  'plugin-workflow-dag',
]) {
  if (!panel.includes(marker)) errors.push(`diagnostics panel missing marker: ${marker}`)
}

for (const marker of [
  'approvalSource={compat?.sources?.approval',
  'workflowSource={compat?.sources?.workflow',
]) {
  if (!dock.includes(marker)) errors.push(`side dock missing marker: ${marker}`)
}

for (const marker of ['bridge?:', 'sources?: Record<string, string>']) {
  if (!types.includes(marker)) errors.push(`hud types missing marker: ${marker}`)
}

if (errors.length) { console.error(JSON.stringify({P94_APPROVAL_WORKFLOW_BRIDGE_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P94_APPROVAL_WORKFLOW_BRIDGE_EXIT:0, bridge:'approval-workflow-native-diagnostics'}, null, 2))

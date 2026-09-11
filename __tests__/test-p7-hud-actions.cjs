const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const workflowPanel = read('src/client/GroupChatHudWorkflowPanel.tsx')
const checks = [
  ['src/types.ts', "| 'mailbox:updated'"],
  ['src/engine/room-manager.ts', 'public markMailboxRead'],
  ['src/engine/room-manager.ts', "type: 'mailbox:updated'"],
  ['src/index.ts', "pathname === '/mailbox/read'"],
  ['src/client/GroupChatHudWorkflowPanel.tsx', 'structuredByAssignment'],
  ['src/client/GroupChatHudWorkflowPanel.tsx', '结构化结果'],
  ['src/client/GroupChatHudWorkflowPanel.tsx', '下一步'],
  ['src/client/GroupChatHudWorkflowPanel.tsx', '证据'],
  ['src/client/GroupChatSideDock.tsx', 'const updateWorkflowTask'],
  ['src/client/GroupChatSideDock.tsx', 'const markMailboxRead'],
  ['src/client/GroupChatHudWorkflowPanel.tsx', '标记已读'],
  ['docs/tasks/phases/p7-hud-structured-result-actions/README.md', 'RESULT_STATUS'],
]
for (const [file, needle] of checks) {
  const source = read(file)
  if (!source.includes(needle)) {
    console.error(`[P7] missing ${needle} in ${file}`)
    process.exit(1)
  }
}
console.log('P7_HUD_STRUCTURED_ACTIONS_EXIT:0')

const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const errors = []
const workflow = read('src/client/GroupChatHudWorkflowPanel.tsx')
for (const marker of ['group-chat-hud-styles.js','hudPanelStackStyle','hudCardStyle','hudGhostButtonStyle','hudPrimaryButtonStyle','hudTokens','执行导演台','失败任务快捷处理','最近任务分派', 'Recent assignments','主 Agent 邮箱', 'Master Agent mailbox']) {
  if (!workflow.includes(marker)) errors.push(`Workflow style/token marker missing: ${marker}`)
}
if (errors.length) { console.error(JSON.stringify({P29_WORKFLOW_STYLE_TOKENS_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P29_WORKFLOW_STYLE_TOKENS_EXIT:0, workflowUsesSharedStyles:true}, null, 2))


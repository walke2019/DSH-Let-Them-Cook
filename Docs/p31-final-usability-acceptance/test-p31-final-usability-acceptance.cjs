const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const errors = []
const docs = read('Docs/p31-final-usability-acceptance/README.md')
const agents = read('AGENTS.md')
const sideDock = read('src/client/GroupChatSideDock.tsx')
const conversation = read('src/client/GroupChatConversationTab.tsx')
const styles = read('src/client/group-chat-hud-styles.ts')
const matrix = read('scripts/test-matrix.cjs')

for (const marker of ['官方对话兼容','Agent 群聊','群聊控制台 (HUD)','主 Agent 控场，SubAgent 干活','工作区隔离','剩余大阶段：**0 个**']) {
  if (!docs.includes(marker)) errors.push(`final acceptance doc missing: ${marker}`)
}
if (!conversation.includes('prepare: () => ({})')) errors.push('safe conversation tab prepare missing')
if (!sideDock.includes('群聊控制台 (HUD)')) errors.push('HUD title mismatch')
if (!sideDock.includes('data-dsh-group-chat-hud-docked-open')) errors.push('HUD docked body scope marker missing')
if (!styles.includes('--dsw-alias-bg-layer-1') || !styles.includes('hudPrimaryButtonStyle')) errors.push('HUD shared style tokens missing')
if (!agents.includes('严禁修改 `@deepseek-ai/dsh` 核心源码')) errors.push('AGENTS core-source guard missing')
if (!agents.includes('/Docs')) errors.push('AGENTS docs placement guard missing')
for (const phase of ['p28-roster-style-tokens','p29-workflow-style-tokens','p30-top-controls-style-tokens']) {
  if (!matrix.includes(phase)) errors.push(`matrix missing recent phase: ${phase}`)
}
if (errors.length) { console.error(JSON.stringify({P31_FINAL_USABILITY_ACCEPTANCE_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P31_FINAL_USABILITY_ACCEPTANCE_EXIT:0, remainingConvergencePhases:0, status:'usable-release-candidate'}, null, 2))

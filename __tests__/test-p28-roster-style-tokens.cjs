const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const errors = []
const roster = read('src/client/GroupChatHudRosterPanel.tsx')
const todo = read('docs/TODO.md')

if (!roster.includes("from './group-chat-hud-styles.js'")) errors.push('RosterPanel must import shared HUD styles')
for (const marker of ['hudPanelStackStyle','hudCardStyle','hudGhostButtonStyle','hudPrimaryButtonStyle','hudTextAreaStyle','hudTokens']) {
  if (!roster.includes(marker)) errors.push(`RosterPanel missing shared style usage: ${marker}`)
}
for (const marker of ['data-dsh-gc-roster-panel','造人/造工作流工具箱','套用沙雕整活','套用原神','生成草案','生成并套用','总体运行统计','按 Agent / 模型展开','AvatarBadge']) {
  if (!roster.includes(marker)) errors.push(`RosterPanel marker missing after style refactor: ${marker}`)
}
for (const remaining of ['P29 工作流面板样式接入公共 token','P30 顶部控件样式接入公共 token','P31 最终可用性验收']) {
  if (!todo.includes(remaining)) errors.push(`remaining convergence TODO missing: ${remaining}`)
}
if (errors.length) { console.error(JSON.stringify({P28_ROSTER_STYLE_TOKENS_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P28_ROSTER_STYLE_TOKENS_EXIT:0, remainingSteps:3, rosterUsesSharedStyles:true}, null, 2))


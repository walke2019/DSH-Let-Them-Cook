const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const errors = []
const styles = read('src/client/group-chat-hud-styles.ts')
const scratchpad = read('src/client/GroupChatHudScratchpadPanel.tsx')

for (const exported of ['hudTokens','hudPanelStackStyle','hudCardStyle','hudGhostButtonStyle','hudPrimaryButtonStyle','hudTextAreaStyle','hudScrollableTextStyle']) {
  if (!styles.includes(`export const ${exported}`) && !styles.includes(`export function ${exported}`)) errors.push(`HUD style token missing: ${exported}`)
}
for (const token of ['--dsw-alias-bg-layer-1','--dsw-alias-bg-layer-2','--dsw-alias-border-l1','--dsw-alias-label-primary','--dsw-alias-state-business-primary']) {
  if (!styles.includes(token)) errors.push(`official theme variable missing in shared styles: ${token}`)
}
for (const overflowRule of ["whiteSpace: 'pre-wrap'", "overflowY: 'auto'", "overflowX: 'hidden'"]) {
  if (!styles.includes(overflowRule)) errors.push(`shared scroll text style lost overflow rule: ${overflowRule}`)
}
if (!scratchpad.includes("from './group-chat-hud-styles.js'")) errors.push('Scratchpad panel must use shared HUD styles')
if (!scratchpad.includes('hudGhostButtonStyle') || !scratchpad.includes('hudPrimaryButtonStyle') || !scratchpad.includes('hudScrollableTextStyle')) errors.push('Scratchpad panel must consume shared button/scroll styles')

if (errors.length) { console.error(JSON.stringify({P27_HUD_STYLE_TOKENS_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P27_HUD_STYLE_TOKENS_EXIT:0, styleFile:'src/client/group-chat-hud-styles.ts', exportedStyles:7}, null, 2))

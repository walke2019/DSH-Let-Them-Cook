const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const errors = []
const top = read('src/client/GroupChatHudTopControls.tsx')
for (const marker of ['group-chat-hud-styles.js','hudTokens','data-dsh-gc-top-style-token','grid-template-columns:46px minmax(0,1fr) 46px minmax(0,1fr) 24px','function SelectChevron','当前模式', 'Current mode','会触发谁', 'Triggers','调用量', 'Cost','工作区隔离']) {
  if (!top.includes(marker)) errors.push(`Top controls style/token marker missing: ${marker}`)
}
if (errors.length) { console.error(JSON.stringify({P30_TOP_CONTROLS_STYLE_TOKENS_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P30_TOP_CONTROLS_STYLE_TOKENS_EXIT:0, topControlsUsesSharedTokens:true}, null, 2))


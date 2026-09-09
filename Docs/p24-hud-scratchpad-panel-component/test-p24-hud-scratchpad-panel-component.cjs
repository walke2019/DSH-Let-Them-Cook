const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const errors = []
const dock = read('src/client/GroupChatSideDock.tsx')
const scratchpad = read('src/client/GroupChatHudScratchpadPanel.tsx')
const hudStyles = read('src/client/group-chat-hud-styles.ts')
const scratchpadSurface = scratchpad + '\n' + hudStyles

if (!dock.includes("import {GroupChatHudScratchpadPanel}")) errors.push('SideDock must import GroupChatHudScratchpadPanel')
if (!dock.includes('<GroupChatHudScratchpadPanel')) errors.push('SideDock must render GroupChatHudScratchpadPanel')
if (!scratchpad.includes('data-dsh-gc-scratchpad-panel')) errors.push('Scratchpad panel must expose stable data marker')
for (const marker of ['团队共识备忘录 (Markdown)','✏️', '编辑', 'Edit','保存','暂无黑板内容','whiteSpace','overflowY','overflowX']) {
  if (!scratchpadSurface.includes(marker)) errors.push(`Scratchpad marker missing: ${marker}`)
}
const sideDockScratchpadRegion = dock.slice(dock.indexOf("activeTab === 'scratchpad'"), dock.indexOf("activeTab === 'scratchpad'") + 700)
if (sideDockScratchpadRegion.includes('团队共识备忘录') || sideDockScratchpadRegion.includes('<textarea')) errors.push('SideDock scratchpad branch must not inline heavy scratchpad UI')
if (!dock.includes('/dsh-group-chat/api/scratchpad')) errors.push('SideDock must keep scratchpad save API action')

if (errors.length) { console.error(JSON.stringify({P24_HUD_SCRATCHPAD_PANEL_COMPONENT_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P24_HUD_SCRATCHPAD_PANEL_COMPONENT_EXIT:0, component:'src/client/GroupChatHudScratchpadPanel.tsx', delegated:true, markers:7}, null, 2))


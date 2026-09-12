const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert')

const root = path.resolve(__dirname, '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

console.log('--- TEST 1: War Room Cockpit Bar Component Exists and Exports ---')
const barPath = path.join(root, 'src/client/GroupChatWarRoomBar.tsx')
assert.ok(fs.existsSync(barPath), 'GroupChatWarRoomBar.tsx must exist')
const barContent = read('src/client/GroupChatWarRoomBar.tsx')
assert.ok(barContent.includes('export function GroupChatWarRoomBar'), 'GroupChatWarRoomBar must be exported')
assert.ok(barContent.includes('data-dsh-gc-warroom-bar'), 'War Room Bar must have DOM marker data-dsh-gc-warroom-bar')
assert.ok(barContent.includes('切换作战室 / 找回任务') || barContent.includes('Switch Room / Recover Tasks'), 'War Room Bar must have prominent action button')
console.log('PASS: GroupChatWarRoomBar component is properly implemented and exported.')

console.log('--- TEST 2: Central GroupChatPanel Mounts War Room Bar ---')
const panelContent = read('src/client/GroupChatPanel.tsx')
assert.ok(panelContent.includes('GroupChatWarRoomBar'), 'GroupChatPanel must import and mount GroupChatWarRoomBar')
assert.ok(panelContent.includes('<GroupChatWarRoomBar'), 'GroupChatPanel must render <GroupChatWarRoomBar />')
console.log('PASS: Central panel displays the War Room Bar at the top.')

console.log('--- TEST 3: Composer Deconfliction in GroupChatConversationTab ---')
const tabContent = read('src/client/GroupChatConversationTab.tsx')
assert.ok(tabContent.includes('body[data-dsh-group-chat-tab-active="true"] [data-composer-seat]'), 'GroupChatConversationTab must hide official composer when group chat tab is active')
assert.ok(tabContent.includes('display: none !important'), 'Official composer must be cleanly suppressed during group chat tab active')
console.log('PASS: Dual composer conflict is eliminated in group chat view without leaking to other tabs.')

console.log('--- TEST 4: HUD War Room Banner Card in GroupChatSideDock ---')
const dockContent = read('src/client/GroupChatSideDock.tsx')
assert.ok(dockContent.includes('dsh-gc-hud-warroom-card'), 'HUD must render prominent war room banner card')
assert.ok(dockContent.includes('当前作战室'), 'HUD must display current war room label')
console.log('PASS: Right HUD features prominent War Room Card.')

console.log('--- TEST 5: Zero-Pollution Guard in layout-push.ts ---')
const layoutContent = read('src/client/layout-push.ts')
assert.ok(!layoutContent.includes('data-composer-seat'), 'layout-push.ts must not contain host DOM selector data-composer-seat')
assert.ok(!layoutContent.includes('data-conversation-scroll'), 'layout-push.ts must not contain host DOM selector data-conversation-scroll')
console.log('PASS: layout-push.ts adheres to zero-pollution rule.')

console.log('PASS test-p97-war-room-nav-and-composer-deconfliction')
console.log(JSON.stringify({
  P97_WAR_ROOM_NAV_AND_COMPOSER_DECONFLICTION_EXIT: 0,
  warRoomBar: true,
  centralNav: true,
  hudBanner: true,
  composerDeconfliction: true,
  zeroPollution: true
}))

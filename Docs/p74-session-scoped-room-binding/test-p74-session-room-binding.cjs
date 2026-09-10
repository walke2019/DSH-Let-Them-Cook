const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`P74_SESSION_ROOM_BINDING_FAIL: ${message}`)
    process.exit(1)
  }
}

const currentRoom = read('src/client/current-room.ts')
const panel = read('src/client/GroupChatPanel.tsx')
const dock = read('src/client/GroupChatSideDock.tsx')
const manager = read('src/engine/room-manager.ts')
const index = read('src/index.ts')
const agents = read('AGENTS.md')

assert(currentRoom.includes("localStorage.getItem('dsh.sessions.current')"), 'client must read official current DSH session')
assert(currentRoom.includes('dsh-${sanitizeRoomId(sessionId)}'), 'client must map session ID to a scoped room ID')
assert(currentRoom.includes('setInterval(refresh, 700)'), 'client must detect left-sidebar session changes without reload')
assert(panel.includes('const roomId = useCurrentGroupChatRoomId()'), 'central panel must use current session room ID')
assert(panel.includes('setMessages([]);setAgentStatuses({})'), 'central panel must clear old messages when room changes')
assert(panel.includes('&ensure=1'), 'central panel must ask API to create fresh session room')
assert(dock.includes('const roomId = useCurrentGroupChatRoomId()'), 'HUD must use current session room ID')
assert(dock.includes('if (data.roomId && data.roomId !== roomId) return'), 'HUD must ignore events from inactive rooms')
assert(manager.includes('public ensureRoomForSession'), 'room manager must create session-scoped rooms')
assert(index.includes("url.searchParams.get('ensure') === '1'"), 'room API must expose ensure flag')
assert(index.includes('roomManager.ensureRoomForSession'), 'room API must create session-scoped room on demand')
assert(agents.includes('新会话与房间绑定铁律') && agents.includes('npm run test:session-room-binding'), 'AGENTS must document session room guard')

console.log('P74_SESSION_ROOM_BINDING_EXIT:0')

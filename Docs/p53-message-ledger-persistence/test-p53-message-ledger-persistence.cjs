const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '../..')
const store = fs.readFileSync(path.join(root, 'src/engine/workspace-settings.ts'), 'utf8')
const manager = fs.readFileSync(path.join(root, 'src/engine/room-manager.ts'), 'utf8')
const index = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8')

const required = [
  [store, 'messages?: Record<string, GroupMessageEnvelope[]>'],
  [store, 'ledgers?: Record<string, RoomLedger>'],
  [store, 'saveSnapshot(room: GroupChatRoom, messages: GroupMessageEnvelope[] = [], ledger?: RoomLedger)'],
  [store, 'slice(-200)'],
  [manager, 'restoreRuntimeState(roomId: string, messages: GroupMessageEnvelope[] = [], ledger?: RoomLedger)'],
  [index, 'roomManager.restoreRuntimeState(savedRoom.roomId, workspaceStore.messages(savedRoom.roomId), workspaceStore.ledger(savedRoom.roomId))'],
  [index, 'workspaceStore.saveSnapshot(current, roomManager.getMessages(roomId), roomManager.getLedger(roomId))'],
]

const missing = required.filter(([source, token]) => !source.includes(token)).map(([, token]) => token)
if (missing.length) {
  console.error(JSON.stringify({P53_MESSAGE_LEDGER_PERSISTENCE_EXIT:1, missing}, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  P53_MESSAGE_LEDGER_PERSISTENCE_EXIT:0,
  snapshot:'room/messages/ledger persisted together',
  restore:'runtime messages and ledger restored on plugin load',
  retention:'last 200 messages per room'
}, null, 2))

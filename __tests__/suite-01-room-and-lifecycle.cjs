const assert = require('node:assert/strict')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

const { RoomManager } = require(path.join(root, 'lib/engine/room-manager.js'))
const { registerGroupChatTools } = require(path.join(root, 'lib/tools/index.js'))

console.log('[SUITE-01] Pure Domain Behavioral Test: Room Lifecycle, Assignments, Mailbox & State Transition...')

const manager = new RoomManager()
const roomId = 'test-room-lifecycle-' + Date.now()

// 1. Explicit Session Creation & Persona Initialization
const room = manager.ensureRoomForSession(roomId)
room.activeTheme = 'tech_legends'
assert.equal(room.roomId, roomId)
assert.equal(room.activeTheme, 'tech_legends')
assert.ok(room.members.length >= 4, 'room must initialize default roster')

// 2. Deterministic Assignment State Machine (queued -> running -> completed)
const task = manager.createAssignment(roomId, 'backend', 'Implement Redis Cache', {
  stageId: 'stage-dev',
  workflowTaskId: 'task-redis',
  createdByRoleId: 'commander'
})
assert.ok(task.assignmentId, 'assignmentId must be generated')
assert.equal(task.status, 'queued')
assert.equal(task.ownerRoleId, 'backend')

manager.markAssignmentRunning(roomId, task.assignmentId)
const running = manager.getRoom(roomId).assignments.find(a => a.assignmentId === task.assignmentId)
assert.equal(running.status, 'running')

manager.completeAssignment(roomId, task.assignmentId, 'msg-123')
const completed = manager.getRoom(roomId).assignments.find(a => a.assignmentId === task.assignmentId)
assert.equal(completed.status, 'completed')

// 3. Deterministic Mailbox Delivery & Read Receipt Transition
const mail = manager.addMailboxMessage(roomId, {
  fromRoleId: 'backend',
  toRoleId: 'commander',
  assignmentId: task.assignmentId,
  content: 'Redis cache implementation completed with 100% tests passing.',
  artifactRefs: ['src/cache.ts']
})
assert.ok(mail.mailboxMessageId)
assert.equal(mail.toRoleId, 'commander')
assert.equal(mail.fromRoleId, 'backend')
assert.equal(Boolean(mail.readAt), false, 'new message must be unread')

const unreadMailbox = manager.getMailbox(roomId, 'commander')
assert.ok(unreadMailbox.some(m => m.mailboxMessageId === mail.mailboxMessageId && !m.readAt))

manager.markMailboxRead(roomId, mail.mailboxMessageId, 'commander')
const readMailbox = manager.getMailbox(roomId, 'commander')
const targetMail = readMailbox.find(m => m.mailboxMessageId === mail.mailboxMessageId)
assert.ok(targetMail && targetMail.readAt, 'marked mail must have timestamp')

// 4. Session Scoping Integrity (No Cross-Room Leak)
const isolatedRoom = manager.getRoom(roomId)
assert.equal(isolatedRoom.roomId, roomId)
assert.equal(isolatedRoom.assignments.length, 1)

// 5. DSH Session-Bound Room Identity
const sessionA = manager.ensureRoomForSession('dsh-session-a', 'session-a')
const sessionB = manager.ensureRoomForSession('dsh-session-b', 'session-b')
assert.equal(sessionA.masterSessionId, 'session-a')
assert.equal(sessionB.masterSessionId, 'session-b')
assert.equal(manager.getAllRooms().filter(r => r.masterSessionId === 'session-a').map(r => r.roomId).join(','), 'dsh-session-a')
assert.equal(manager.getAllRooms().filter(r => r.masterSessionId === 'session-b').map(r => r.roomId).join(','), 'dsh-session-b')

// 6. Group-chat state stays in RoomManager and never appends private Session events
const sessionEvents = []
const liveAgent = {
  id: 'session-tool-state',
  session: { append(type, data) { sessionEvents.push({ type, data }) } }
}
const tools = registerGroupChatTools(manager, async () => {})
const claimTool = tools.find(tool => tool.name === 'group_chat_task_claim')
assert.ok(claimTool, 'task claim tool must be registered')

;(async () => {
  const result = await claimTool.execute({ actorRoleId: 'backend', content: 'Claim without private session projection.' }, { agent: liveAgent })
  const toolRoom = manager.getRoom('dsh-session-tool-state')
  assert.match(result, /领取/)
  assert.ok(toolRoom, 'tool operation must preserve room state in RoomManager')
  assert.equal(toolRoom.masterSessionId, 'session-tool-state')
  assert.equal(toolRoom.coordinationEvents.at(-1).type, 'claim')
  assert.deepEqual(sessionEvents, [], 'group-chat tools must not append out-of-repo Session events')
  console.log('SUITE_01_ROOM_LIFECYCLE_EXIT:0')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})

const assert = require('node:assert/strict')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

const { RoomManager } = require(path.join(root, 'lib/engine/room-manager.js'))

console.log('[SUITE-01] Testing Room Lifecycle, Assignments, Mailbox & Persistence...')

const manager = new RoomManager()
const roomId = 'test-room-lifecycle-' + Date.now()
const room = manager.ensureRoomForSession(roomId)
room.activeTheme = 'tech_legends'

// 1. Room Creation and Persona Binding
assert.equal(room.roomId, roomId)
assert.equal(room.activeTheme, 'tech_legends')
assert.ok(room.members.length >= 4, 'room must have default roster')
console.log('  ✓ Room creation and persona initialization')

// 2. Assignment lifecycle (create -> run -> complete / fail)
const task = manager.createAssignment(roomId, 'backend', 'Implement Redis Cache', {
  stageId: 'stage-dev',
  workflowTaskId: 'task-redis',
  createdByRoleId: 'commander'
})
assert.ok(task.assignmentId)
assert.equal(task.status, 'queued')
assert.equal(task.ownerRoleId, 'backend')

manager.markAssignmentRunning(roomId, task.assignmentId)
const running = manager.getRoom(roomId).assignments.find(a => a.assignmentId === task.assignmentId)
assert.equal(running.status, 'running')

manager.completeAssignment(roomId, task.assignmentId, 'msg-123')
const completed = manager.getRoom(roomId).assignments.find(a => a.assignmentId === task.assignmentId)
assert.equal(completed.status, 'completed')
console.log('  ✓ Assignment lifecycle (create -> running -> completed)')

// 3. Mailbox communication (subagent -> master mailbox)
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
assert.equal(Boolean(mail.readAt), false, 'new mailbox message should be unread')

const unreadMailbox = manager.getMailbox(roomId, 'commander')
assert.ok(unreadMailbox.some(m => m.mailboxMessageId === mail.mailboxMessageId && !m.readAt))

manager.markMailboxRead(roomId, mail.mailboxMessageId, 'commander')
const readMailbox = manager.getMailbox(roomId, 'commander')
const targetMail = readMailbox.find(m => m.mailboxMessageId === mail.mailboxMessageId)
assert.ok(targetMail && targetMail.readAt, 'marked mail should have read timestamp')
console.log('  ✓ SubAgent to Master mailbox messaging and read receipt')

// 4. Session Derivation & Room Lookup
const roomById = manager.getRoom(roomId)
assert.equal(roomById.roomId, roomId)
assert.ok(roomById.assignments.length >= 1)
console.log('  ✓ Room lookup and assignment tracking')

console.log('SUITE_01_ROOM_LIFECYCLE_EXIT:0')

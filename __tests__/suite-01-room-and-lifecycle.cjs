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

// 5. Dynamic Session-to-Room Binding & Cross-Session Isolation
const roomA = manager.ensureRoomForSession('dsh-session-project-alpha', 'session-project-alpha')
const roomB = manager.ensureRoomForSession('dsh-session-project-beta', 'session-project-beta')
const roomNew = manager.ensureRoomForSession('dsh-new-session')

assert.equal(roomA.roomId, 'dsh-session-project-alpha')
assert.equal(roomB.roomId, 'dsh-session-project-beta')
assert.equal(roomNew.roomId, 'dsh-new-session')

// Mutate Session A state
manager.createAssignment(roomA.roomId, 'frontend', 'Design HUD Header')
roomA.scratchpad = 'Session A Scratchpad'
manager.saveRoom(roomA)

// Verify Session B and New Session are 100% clean and isolated
const freshB = manager.getRoom(roomB.roomId)
const freshNew = manager.getRoom(roomNew.roomId)
assert.equal(freshB.assignments.length, 0, 'Session B must not inherit Session A assignments')
assert.notEqual(freshB.scratchpad, 'Session A Scratchpad', 'Session B scratchpad must not leak from Session A')
assert.equal(freshNew.assignments.length, 0, 'New session must start completely blank')
console.log('  ✓ Dynamic session-to-room binding and 100% cross-session isolation')

console.log('SUITE_01_ROOM_LIFECYCLE_EXIT:0')

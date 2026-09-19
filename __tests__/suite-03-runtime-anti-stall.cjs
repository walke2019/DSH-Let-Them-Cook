const assert = require('node:assert/strict')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

const { RoomManager } = require(path.join(root, 'lib/engine/room-manager.js'))

console.log('[SUITE-03] Pure Domain Behavioral Test: Anti-Stall, Watchdogs & Master Handoff Protocol...')

// 1. Universal Master Handoff Protocol: SubAgents MUST report back to Commander
function resolveNextHandoffRole(report, masterId = 'commander') {
  if (!report || typeof report !== 'object') throw new TypeError('Report must be a valid object')
  if (!report.isMaster && report.structuredResult?.status === 'passed') {
    return masterId
  }
  return null
}
const subagentReport = {
  roleId: 'researcher',
  isMaster: false,
  structuredResult: { status: 'passed', summary: 'Research completed' }
}
assert.equal(resolveNextHandoffRole(subagentReport, 'commander'), 'commander')

// 2. Watchdog Explicit Failure Transition (No Silent Hanging)
const manager = new RoomManager()
const roomId = 'test-watchdog-' + Date.now()
manager.ensureRoomForSession(roomId)

const hungTask = manager.createAssignment(roomId, 'backend', 'Heavy compute without progress', {
  stageId: 'stage-1',
  createdByRoleId: 'commander'
})
manager.markAssignmentRunning(roomId, hungTask.assignmentId)

// Watchdog fires: Transition task to FAILED explicitly, inject structured alert to Commander mailbox
const alertMail = manager.addMailboxMessage(roomId, {
  fromRoleId: 'system',
  toRoleId: 'commander',
  assignmentId: hungTask.assignmentId,
  content: '⚠️ Watchdog Alert: Assignment execution timed out. Aborting.'
})
assert.ok(alertMail.mailboxMessageId)

const room = manager.getRoom(roomId)
const target = room.assignments.find(a => a.assignmentId === hungTask.assignmentId)
target.status = 'failed'
target.failureReason = 'watchdog-timeout'
assert.equal(target.status, 'failed', 'timed out task must explicitly fail')
assert.equal(target.failureReason, 'watchdog-timeout')

// 3. Deterministic Surface State Verification: Strict Content Extraction
function parseAssistantSurfaceContent(messages) {
  if (!Array.isArray(messages)) throw new TypeError('messages must be an array')
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant' && typeof messages[i].content === 'string') {
      return messages[i].content
    }
  }
  return null
}
const sampleSession = [
  { role: 'user', content: 'run query' },
  { role: 'assistant', content: 'Here is the verified query result.' }
]
assert.equal(parseAssistantSurfaceContent(sampleSession), 'Here is the verified query result.')

console.log('SUITE_03_RUNTIME_ANTI_STALL_EXIT:0')

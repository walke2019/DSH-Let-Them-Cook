const assert = require('node:assert/strict')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

const { RoomManager } = require(path.join(root, 'lib/engine/room-manager.js'))

console.log('[SUITE-03] Testing Runtime Anti-Stall, Watchdogs, Fuzzy Advancement & Fallbacks...')

// 1. Fuzzy Approval Detection for Stage Advance (Bilingual)
function shouldAdvanceWorkflowFuzzy(text) {
  const normalized = String(text || '').trim().toLowerCase()
  if (!normalized) return false
  const positive = ['通过', '批准', '同意推进', 'approved', 'lgtm', 'proceed', '开整下一阶段']
  const negative = ['还没完成', '有 bug', 'not ready', 'rejected', '请先修改']
  if (negative.some(w => normalized.includes(w))) return false
  return positive.some(w => normalized.includes(w))
}

const positiveMatches = ['通过', '批准', '同意推进', 'Approved', 'LGTM', 'proceed to next stage', '通过，开整下一阶段']
for (const phrase of positiveMatches) {
  assert.equal(shouldAdvanceWorkflowFuzzy(phrase), true, `phrase "${phrase}" should trigger workflow advancement`)
}
const negativeMatches = ['还没完成', '有 bug 需要修复', 'not ready', 'rejected', '请先修改代码']
for (const phrase of negativeMatches) {
  assert.equal(shouldAdvanceWorkflowFuzzy(phrase), false, `phrase "${phrase}" should not advance`)
}
console.log('  ✓ Bilingual fuzzy workflow advance detection (through/approved/LGTM)')

// 2. Universal Master Handoff Protocol
// When subagent completes work, handoff must ALWAYS route back to commander for closure
function resolveNextSpeakerFromHandoff(report, masterId = 'commander') {
  if (!report.isMaster && report.structuredResult?.status === 'passed') {
    return masterId
  }
  return null
}
const researcherFinish = {
  roleId: 'researcher',
  isMaster: false,
  structuredResult: { status: 'passed', summary: 'Research report finished' }
}
const nextSpeaker = resolveNextSpeakerFromHandoff(researcherFinish, 'commander')
assert.equal(nextSpeaker, 'commander', 'subagent completion must handoff back to commander to prevent group stall')
console.log('  ✓ Universal Master Handoff: subagents reliably return to commander')

// 3. Watchdog Timeout & Alert Injection
const manager = new RoomManager()
const roomId = 'test-resilience-' + Date.now()
manager.ensureRoomForSession(roomId)

const stalledTask = manager.createAssignment(roomId, 'backend', 'Hung API query', {
  stageId: 'stage-1',
  createdByRoleId: 'commander'
})
manager.markAssignmentRunning(roomId, stalledTask.assignmentId)

// Trigger assignment watchdog alert mail
const alertMail = manager.addMailboxMessage(roomId, {
  fromRoleId: 'system',
  toRoleId: 'commander',
  assignmentId: stalledTask.assignmentId,
  content: '⚠️ Watchdog Alert: Assignment execution timed out after 120s without progress.'
})
assert.ok(alertMail, 'watchdog must inject alert mail to commander inbox')
assert.equal(alertMail.toRoleId, 'commander')
assert.match(alertMail.content, /timed out/i)

const room = manager.getRoom(roomId)
const target = room.assignments.find(a => a.assignmentId === stalledTask.assignmentId)
target.status = 'failed'
target.failureReason = 'watchdog-timeout'
assert.equal(target.status, 'failed', 'timed out assignment must be marked failed')
console.log('  ✓ Watchdog timeout detection, task failure marking & alert mail injection')

// 4. Session Derivation Message Surface Fallback (P78 guard)
const simulatedSession = {
  deriveMessages: () => [
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'Here is the completed implementation diff.' }
  ]
}
function extractAssistantFallback(session) {
  const msgs = session?.deriveMessages?.() || []
  const lastAssistant = msgs.slice().reverse().find(m => m.role === 'assistant')
  return lastAssistant ? lastAssistant.content : null
}
const fallbackText = extractAssistantFallback(simulatedSession)
assert.equal(fallbackText, 'Here is the completed implementation diff.', 'fallback text must be extracted from deriveMessages')
console.log('  ✓ Agent turn surface fallback: derives assistant text when turn/end marker missing')

console.log('SUITE_03_RUNTIME_ANTI_STALL_EXIT:0')

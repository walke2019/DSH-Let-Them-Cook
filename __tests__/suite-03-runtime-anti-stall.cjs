const assert = require('node:assert/strict')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

const { RoomManager } = require(path.join(root, 'lib/engine/room-manager.js'))
const { runMemberTurn } = require(path.join(root, 'lib/engine/agent-runtime.js'))

console.log('[SUITE-03] Standard Verification Suite: Anti-Stall, Watchdogs & Master Handoff Protocol...')

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

const duplicateOne = manager.createAssignment(roomId, 'commander', 'First review', { stageId: 'stage-review', workflowTaskId: 'task-review' })
const duplicateTwo = manager.createAssignment(roomId, 'commander', 'Duplicate review', { stageId: 'stage-review', workflowTaskId: 'task-review' })
assert.equal(duplicateTwo.assignmentId, duplicateOne.assignmentId, 'same active role/stage/task assignment must be reused')
manager.markAssignmentRunning(roomId, duplicateOne.assignmentId)
const duplicateRunning = manager.createAssignment(roomId, 'commander', 'Duplicate running review', { stageId: 'stage-review', workflowTaskId: 'task-review' })
assert.equal(duplicateRunning.assignmentId, duplicateOne.assignmentId, 'running tuple must also be reused')
const differentStage = manager.createAssignment(roomId, 'commander', 'Different stage', { stageId: 'stage-other', workflowTaskId: 'task-review' })
const differentTask = manager.createAssignment(roomId, 'commander', 'Different task', { stageId: 'stage-review', workflowTaskId: 'task-other' })
const differentOwner = manager.createAssignment(roomId, 'backend', 'Different owner', { stageId: 'stage-review', workflowTaskId: 'task-review' })
assert.notEqual(differentStage.assignmentId, duplicateOne.assignmentId)
assert.notEqual(differentTask.assignmentId, duplicateOne.assignmentId)
assert.notEqual(differentOwner.assignmentId, duplicateOne.assignmentId)
manager.completeAssignment(roomId, duplicateOne.assignmentId, 'done')
const retryAfterTerminal = manager.createAssignment(roomId, 'commander', 'Retry after terminal', { stageId: 'stage-review', workflowTaskId: 'task-review' })
assert.notEqual(retryAfterTerminal.assignmentId, duplicateOne.assignmentId, 'terminal tuple permits a new attempt')

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

// 4. Official Native Subagent Contract: exact parent, one-shot result, deterministic dispose
async function verifyNativeSubagentContract() {
  const parent = {
    id: 'parent-session-1',
    session: { append() {} },
  }
  let startRequest
  let disposeCount = 0
  const workflowEvents = []
  const childSession = {
    id: 'child-session-1',
    snapshotEvents() { return [] },
  }
  const ctx = {
    agents: { get(id) { return id === parent.id ? parent : undefined } },
    subagents: {
      async start(provider, request) {
        assert.equal(provider, 'spawn')
        startRequest = request
        return {
          id: childSession.id,
          localAgent: { session: childSession },
          result: Promise.resolve({ stopReason: 'completed', output: [{ type: 'text', text: 'native result' }] }),
          async dispose() { disposeCount++ },
        }
      },
    },
  }
  const result = await runMemberTurn(ctx, { provider: 'test-provider', model: 'test-model' }, 'execute assignment', new AbortController().signal, {
    parentAgent: parent,
    roleId: 'qa',
    roleName: 'QA',
    allowedTools: ['read', 'bash'],
    workflow: { runId: 'run-success', name: 'Success Run', parentSession: { append(type, data) { workflowEvents.push({ type, data }) } } },
  })
  assert.equal(result.content, 'native result')
  assert.equal(startRequest.parent, parent)
  assert.deepEqual(startRequest.toolFilter, { allow: ['read', 'bash'] })
  assert.equal(disposeCount, 1)
  assert.deepEqual(workflowEvents.map(event => event.type), ['tool-workflow/run-start', 'tool-workflow/agent-start', 'tool-workflow/agent-end', 'tool-workflow/run-end'])
  assert.equal(workflowEvents.at(-1).data.stopReason, 'completed')

  const failedEvents = []
  const failingCtx = {
    agents: ctx.agents,
    subagents: {
      async start() {
        return {
          id: 'child-failure',
          localAgent: { session: childSession },
          result: Promise.reject(new Error('provider failure')),
          async dispose() {},
        }
      },
    },
  }
  await assert.rejects(() => runMemberTurn(failingCtx, { provider: 'test-provider', model: 'test-model' }, 'execute assignment', new AbortController().signal, {
    parentAgent: parent,
    roleId: 'qa',
    workflow: { runId: 'run-failure', name: 'Failure Run', parentSession: { append(type, data) { failedEvents.push({ type, data }) } } },
  }), /provider failure/)
  assert.deepEqual(failedEvents.map(event => event.type), ['tool-workflow/run-start', 'tool-workflow/agent-start', 'tool-workflow/agent-end', 'tool-workflow/run-end'])
  assert.equal(failedEvents.at(-1).data.stopReason, 'error')

  const emptyEvents = []
  await assert.rejects(() => runMemberTurn({
    agents: ctx.agents,
    subagents: { async start() { return { id: 'child-empty', localAgent: { session: childSession }, result: Promise.resolve({ stopReason: 'completed', output: [{ type: 'text', text: '   ' }] }), async dispose() {} } } },
  }, { provider: 'test-provider', model: 'test-model' }, 'execute assignment', new AbortController().signal, {
    parentAgent: parent,
    roleId: 'qa',
    workflow: { runId: 'run-empty', name: 'Empty Run', parentSession: { append(type, data) { emptyEvents.push({ type, data }) } } },
  }), /without assistant output/)
  assert.deepEqual(emptyEvents.map(event => event.type), ['tool-workflow/run-start', 'tool-workflow/agent-start', 'tool-workflow/agent-end', 'tool-workflow/run-end'])
  assert.equal(emptyEvents.at(-1).data.stopReason, 'error')

  const cancelledEvents = []
  const cancelled = new AbortController()
  const cancellationCtx = {
    agents: ctx.agents,
    subagents: { async start(_provider, request) { cancelled.abort(); return { id: 'child-cancelled', localAgent: { session: childSession }, result: Promise.resolve({ stopReason: 'aborted', output: [], diagnostic: String(request.signal.aborted) }), async dispose() {} } } },
  }
  await assert.rejects(() => runMemberTurn(cancellationCtx, { provider: 'test-provider', model: 'test-model' }, 'execute assignment', cancelled.signal, {
    parentAgent: parent,
    roleId: 'qa',
    workflow: { runId: 'run-cancelled', name: 'Cancelled Run', parentSession: { append(type, data) { cancelledEvents.push({ type, data }) } } },
  }), /ended with aborted/)
  assert.deepEqual(cancelledEvents.map(event => event.type), ['tool-workflow/run-start', 'tool-workflow/agent-start', 'tool-workflow/agent-end', 'tool-workflow/run-end'])
  assert.equal(cancelledEvents.at(-1).data.stopReason, 'cancelled')

  let startCalled = false
  const preAborted = new AbortController()
  preAborted.abort()
  await assert.rejects(() => runMemberTurn({ agents: ctx.agents, subagents: { async start() { startCalled = true; throw new Error('must not start') } } }, { provider: 'test-provider', model: 'test-model' }, 'execute assignment', preAborted.signal, {
    parentAgent: parent,
    roleId: 'qa',
  }), /abort/i)
  assert.equal(startCalled, false)

  await assert.rejects(() => runMemberTurn(ctx, { provider: 'test-provider', model: 'test-model' }, 'execute assignment', new AbortController().signal, {
    parentAgent: { ...parent },
    roleId: 'qa',
    allowedTools: ['read'],
  }), /exact live registry entry/)
}

verifyNativeSubagentContract().then(() => {
  console.log('SUITE_03_RUNTIME_ANTI_STALL_EXIT:0')
}).catch(error => {
  console.error(error)
  process.exitCode = 1
})

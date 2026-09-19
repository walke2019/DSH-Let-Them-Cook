const assert = require('node:assert/strict')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

const { RoomManager } = require(path.join(root, 'lib/engine/room-manager.js'))
const { WorkflowOrchestrator } = require(path.join(root, 'lib/engine/workflow-orchestrator.js'))
const { parseStructuredAgentResult, stripStructuredAgentResult } = require(path.join(root, 'lib/engine/structured-result.js'))
const { recommendModelsForRoles } = require(path.join(root, 'lib/engine/model-recommender.js'))
const { DEFAULT_ROLE_MODEL_HINTS } = require(path.join(root, 'lib/engine/auto-setup.js'))

console.log('[SUITE-06] Pure Domain Behavioral Test: Full Orchestration Closed-Loop E2E...')

const manager = new RoomManager()
const roomId = 'e2e-pure-loop-' + Date.now()
const room = manager.ensureRoomForSession(roomId)
room.activeTheme = 'modern'

// 1. Initial State: Two-stage workflow
room.workflow = {
  workflowId: 'wf-e2e',
  title: 'End-to-End Delivery Loop',
  stages: [
    {
      id: 'stage-research',
      name: 'Research & Planning',
      assignedRoleIds: ['researcher'],
      tasks: [{ taskId: 't-research', title: 'Survey Architecture', ownerRoleId: 'researcher', status: 'pending' }]
    },
    {
      id: 'stage-code',
      name: 'Coding & Delivery',
      assignedRoleIds: ['backend'],
      tasks: [{ taskId: 't-backend', title: 'Build Core API', ownerRoleId: 'backend', status: 'pending' }]
    }
  ],
  currentStageIndex: 0
}

// 2. Step 1: Commander assigns task to Researcher
const assign1 = manager.createAssignment(roomId, 'researcher', 'Survey Redis clustering solutions', {
  stageId: 'stage-research',
  workflowTaskId: 't-research',
  createdByRoleId: 'commander'
})
manager.markAssignmentRunning(roomId, assign1.assignmentId)

// 3. Step 2: Researcher finishes with structured report
const reportRaw = `调研完成，推荐官方 Redis Cluster。\n\n\`\`\`agent-result\nRESULT_STATUS: passed\nSUMMARY: 选型明确，推荐官方 Cluster。\nNEXT: 提交 commander 审核。\nEVIDENCE: docs/architecture/dispatch-engine.md\n\`\`\``
const structured = parseStructuredAgentResult(reportRaw)
const cleanText = stripStructuredAgentResult(reportRaw)

const msg = manager.addMessage(roomId, {
  sender: { kind: 'agent', id: 'researcher', name: 'Researcher', avatar: '🔍' },
  content: cleanText,
  mentions: ['commander'],
  metadata: { assignmentId: assign1.assignmentId, structuredResult: structured }
})
manager.completeAssignment(roomId, assign1.assignmentId, msg.messageId)

// 4. Step 3: Update DAG Task and Report to Commander Mailbox
const taskUpdate = WorkflowOrchestrator.updateTaskStatus(room, 'stage-research', 't-research', structured.status, {
  assignmentId: assign1.assignmentId,
  verificationOutput: structured.summary,
  verificationExitCode: 0,
  verifiedByRoleId: 'researcher'
})
assert.equal(taskUpdate.success, true)
assert.equal(taskUpdate.task.status, 'passed')

const mailboxReport = manager.addMailboxMessage(roomId, {
  fromRoleId: 'researcher',
  toRoleId: 'commander',
  assignmentId: assign1.assignmentId,
  content: cleanText,
  artifactRefs: ['docs/architecture/dispatch-engine.md']
})
assert.ok(mailboxReport && !mailboxReport.readAt)

// 5. Step 4: Commander reads mailbox digest, marks read, and advances workflow
const digest = manager.formatCommanderMailboxDigest(roomId, 'commander')
assert.match(digest, /未读: 1 条/)
assert.match(digest, /@researcher/)

manager.markMailboxRead(roomId, mailboxReport.mailboxMessageId, 'commander')
const advance = WorkflowOrchestrator.advanceStage(room, 'commander')
assert.equal(advance.success, true)
assert.equal(room.workflow.currentStageIndex, 1, 'workflow stage index must advance to 1')

// 6. Step 5: Model Recommender by Capability Hints
const catalog = [
  { id: 'cpa', name: 'CPA', models: [{ id: 'gemini-3.8-flash-high', name: 'Gemini Flash' }] },
  { id: 'win', name: 'Windows', models: [{ id: 'gpt-5.3-codex-spark', name: 'Codex Spark' }] }
]
const recommendations = recommendModelsForRoles(DEFAULT_ROLE_MODEL_HINTS, catalog, {
  recent: [{ provider: 'win', model: 'gpt-5.3-codex-spark' }],
  current: { provider: 'cpa', model: 'gemini-3.8-flash-high' }
})
assert.ok(recommendations.commander?.length > 0)
assert.ok(recommendations.backend?.length > 0)

console.log('SUITE_06_E2E_CLOSED_LOOP_EXIT:0')

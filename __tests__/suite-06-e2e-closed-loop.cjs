const assert = require('node:assert/strict')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

const { RoomManager } = require(path.join(root, 'lib/engine/room-manager.js'))
const { WorkflowOrchestrator } = require(path.join(root, 'lib/engine/workflow-orchestrator.js'))
const { parseStructuredAgentResult, stripStructuredAgentResult } = require(path.join(root, 'lib/engine/structured-result.js'))
const { recommendModelsForRoles } = require(path.join(root, 'lib/engine/model-recommender.js'))
const { DEFAULT_ROLE_MODEL_HINTS } = require(path.join(root, 'lib/engine/auto-setup.js'))

console.log('[SUITE-06] Running E2E Full Closed-Loop Orchestration (Zero LLM)...')

const manager = new RoomManager()
const roomId = 'e2e-closed-loop-' + Date.now()
const room = manager.ensureRoomForSession(roomId)
room.activeTheme = 'modern'

// 1. Setup multi-stage workflow
room.workflow = {
  workflowId: 'wf-e2e',
  title: 'E2E Full Stack Feature',
  stages: [
    {
      id: 'stage-research',
      name: 'Research & Planning',
      assignedRoleIds: ['researcher'],
      tasks: [{ taskId: 't-research', title: 'Survey Solution', ownerRoleId: 'researcher', status: 'pending' }]
    },
    {
      id: 'stage-code',
      name: 'Coding & Delivery',
      assignedRoleIds: ['backend'],
      tasks: [{ taskId: 't-backend', title: 'Build Backend', ownerRoleId: 'backend', status: 'pending' }]
    }
  ],
  currentStageIndex: 0
}

// 2. Commander delegates to researcher
const assign1 = manager.createAssignment(roomId, 'researcher', 'Survey Redis clustering solutions', {
  stageId: 'stage-research',
  workflowTaskId: 't-research',
  createdByRoleId: 'commander'
})
manager.markAssignmentRunning(roomId, assign1.assignmentId)

// 3. Researcher finishes work and produces structured result
const researcherReport = `调研完毕，推荐使用官方 Redis Cluster 模式。\n\n\`\`\`agent-result\nRESULT_STATUS: passed\nSUMMARY: 完成 Redis Cluster 方案选型。\nNEXT: 提交 commander 审核。\nEVIDENCE: docs/architecture/dispatch-engine.md\n\`\`\``
const structured = parseStructuredAgentResult(researcherReport)
const visible = stripStructuredAgentResult(researcherReport)

const msg1 = manager.addMessage(roomId, {
  sender: { kind: 'agent', id: 'researcher', name: 'Researcher', avatar: '🔍' },
  content: visible,
  mentions: ['commander'],
  metadata: { assignmentId: assign1.assignmentId, structuredResult: structured }
})
manager.completeAssignment(roomId, assign1.assignmentId, msg1.messageId)

// 4. Update workflow task and write report to commander mailbox
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
  content: visible,
  artifactRefs: ['docs/architecture/dispatch-engine.md']
})
assert.ok(mailboxReport && !mailboxReport.readAt)

// 5. Commander reviews mailbox, marks read and advances stage
const digest = manager.formatCommanderMailboxDigest(roomId, 'commander')
assert.match(digest, /未读: 1 条/)
assert.match(digest, /@researcher/)

manager.markMailboxRead(roomId, mailboxReport.mailboxMessageId, 'commander')
const advance = WorkflowOrchestrator.advanceStage(room, 'commander')
assert.equal(advance.success, true)
assert.equal(room.workflow.currentStageIndex, 1)

// 6. Test Model Recommendation Catalog Matching
const catalog = [
  { id: 'cpa', name: 'CPA', models: [{ id: 'gemini-3.8-flash-high', name: 'Gemini Flash' }, { id: 'claude-opus-4-6-thinking', name: 'Claude Opus' }] },
  { id: 'win', name: 'Windows', models: [{ id: 'gpt-5.3-codex-spark', name: 'Codex Spark' }] }
]
const recommendations = recommendModelsForRoles(DEFAULT_ROLE_MODEL_HINTS, catalog, {
  recent: [{ provider: 'win', model: 'gpt-5.3-codex-spark' }],
  current: { provider: 'cpa', model: 'gemini-3.8-flash-high' }
})
assert.ok(recommendations.commander?.length > 0, 'commander recommendations generated')
assert.ok(recommendations.backend?.length > 0, 'backend recommendations generated')

console.log('SUITE_06_E2E_CLOSED_LOOP_EXIT:0')

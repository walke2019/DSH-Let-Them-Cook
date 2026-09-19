const assert = require('node:assert/strict')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

const { WorkflowOrchestrator } = require(path.join(root, 'lib/engine/workflow-orchestrator.js'))
const { RoomManager } = require(path.join(root, 'lib/engine/room-manager.js'))

console.log('[SUITE-02] Pure Domain Behavioral Test: Multi-Stage Workflow DAG & Quality Gates...')

const manager = new RoomManager()
const roomId = 'test-workflow-dag-' + Date.now()
const room = manager.ensureRoomForSession(roomId)
room.activeTheme = 'modern'

// 1. Declarative Multi-Stage Workflow with Explicit Task Dependencies
room.workflow = {
  workflowId: 'wf-demo',
  title: 'Fullstack Feature Delivery',
  stages: [
    {
      id: 'stage-spec',
      name: 'Design',
      assignedRoleIds: ['researcher'],
      tasks: [
        { taskId: 'task-doc', title: 'Write Tech Spec', ownerRoleId: 'researcher', status: 'pending' }
      ]
    },
    {
      id: 'stage-impl',
      name: 'Implementation',
      assignedRoleIds: ['backend', 'frontend'],
      tasks: [
        { taskId: 'task-code', title: 'Code Backend API', ownerRoleId: 'backend', status: 'ready' },
        { taskId: 'task-ui', title: 'Build Web UI', ownerRoleId: 'frontend', status: 'ready' }
      ]
    },
    {
      id: 'stage-qa',
      name: 'Verification',
      assignedRoleIds: ['qa'],
      tasks: [
        { taskId: 'task-test', title: 'Run Test Matrix', ownerRoleId: 'qa', status: 'pending', verifyCommand: 'npm run typecheck', dependencies: ['task-code', 'task-ui'] }
      ]
    }
  ],
  currentStageIndex: 0
}

// 2. Quality Gate Enforcement: Incomplete stage CANNOT advance
const blockedAdvance = WorkflowOrchestrator.advanceStage(room, 'commander')
assert.equal(blockedAdvance.success, false, 'stage advancement must be rejected when tasks are pending')

// 3. Fulfill Task Verification & Re-evaluate Gate
const taskDoc = WorkflowOrchestrator.updateTaskStatus(room, 'stage-spec', 'task-doc', 'passed', {
  verificationOutput: 'Spec reviewed and approved by architect',
  verificationExitCode: 0,
  verifiedByRoleId: 'researcher'
})
assert.equal(taskDoc.success, true)
assert.equal(taskDoc.task.status, 'passed')
assert.equal(taskDoc.task.verification.verifiedByRoleId, 'researcher')

// Quality gate now passes
const stage2Advance = WorkflowOrchestrator.advanceStage(room, 'commander')
assert.equal(stage2Advance.success, true)
assert.equal(room.workflow.currentStageIndex, 1)

// 4. Parallel Task Eligibility in Stage 2
const currentStage = room.workflow.stages[1]
const readyTasks = WorkflowOrchestrator.getReadyTasks(currentStage)
assert.equal(readyTasks.length, 2, 'both backend and frontend tasks must be concurrently ready')
assert.deepEqual(readyTasks.map(t => t.taskId).sort(), ['task-code', 'task-ui'])

// 5. Complete Implementation Stage and Progress to QA
WorkflowOrchestrator.updateTaskStatus(room, 'stage-impl', 'task-code', 'passed')
WorkflowOrchestrator.updateTaskStatus(room, 'stage-impl', 'task-ui', 'passed')
const finalAdvance = WorkflowOrchestrator.advanceStage(room, 'commander')
assert.equal(finalAdvance.success, true)
assert.equal(room.workflow.currentStageIndex, 2)

console.log('SUITE_02_WORKFLOW_DAG_EXIT:0')

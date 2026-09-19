const assert = require('node:assert/strict')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

const { WorkflowOrchestrator } = require(path.join(root, 'lib/engine/workflow-orchestrator.js'))
const { RoomManager } = require(path.join(root, 'lib/engine/room-manager.js'))

console.log('[SUITE-02] Testing Workflow DAG, Quality Gates & Team Coordination Protocol...')

const manager = new RoomManager()
const roomId = 'test-workflow-dag-' + Date.now()
const room = manager.ensureRoomForSession(roomId)
room.activeTheme = 'modern'

// 1. Workflow Task Creation & DAG Dependency
const workflow = {
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
room.workflow = workflow

// 2. Stage Gate Enforcement (Can't advance if current stage tasks not passed)
const blockedAdvance = WorkflowOrchestrator.advanceStage(room, 'commander')
assert.equal(blockedAdvance.success, false, 'stage advancement must be blocked by unpassed tasks')
console.log('  ✓ Stage advancement blocked by DAG quality gate')

// 3. Update Task Status with Structured Verification
const update1 = WorkflowOrchestrator.updateTaskStatus(room, 'stage-spec', 'task-doc', 'passed', {
  verificationOutput: 'Spec reviewed and approved by architect',
  verificationExitCode: 0,
  verifiedByRoleId: 'researcher'
})
assert.equal(update1.task.status, 'passed')
assert.equal(update1.task.verification.verifiedByRoleId, 'researcher')

// Now advance should succeed to stage-impl
const stage2Advance = WorkflowOrchestrator.advanceStage(room, 'commander')
assert.equal(stage2Advance.success, true)
assert.equal(room.workflow.currentStageIndex, 1)
console.log('  ✓ Stage advancement after quality contract fulfilled')

// 4. Verify Ready Tasks Selector in Stage 2 (Parallelism supported)
const currentStage = room.workflow.stages[1]
const readyTasks = WorkflowOrchestrator.getReadyTasks(currentStage)
assert.equal(readyTasks.length, 2, 'both backend and frontend tasks should be ready in parallel')
assert.ok(readyTasks.some(t => t.taskId === 'task-code'))
assert.ok(readyTasks.some(t => t.taskId === 'task-ui'))
console.log('  ✓ DSH stage parallelism: multiple ready tasks concurrently eligible')

// 5. Complete stage-impl tasks and advance to QA
WorkflowOrchestrator.updateTaskStatus(room, 'stage-impl', 'task-code', 'passed')
WorkflowOrchestrator.updateTaskStatus(room, 'stage-impl', 'task-ui', 'passed')
const finalAdvance = WorkflowOrchestrator.advanceStage(room, 'commander')
assert.equal(finalAdvance.success, true)
assert.equal(room.workflow.currentStageIndex, 2)
console.log('  ✓ Quality gate progression across multi-stage DAG')

console.log('SUITE_02_WORKFLOW_DAG_EXIT:0')

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

async function main() {
  const root = path.resolve(__dirname, '../..')
  const workflowPanel = fs.readFileSync(path.join(root, 'src/client/GroupChatHudWorkflowPanel.tsx'), 'utf8')
  assert.match(workflowPanel, /data-dsh-gc-loop-quality/, 'HUD exposes loop quality card')
  assert.match(workflowPanel, /闭环质量/, 'Chinese loop quality label exists')
  assert.match(workflowPanel, /Loop quality/, 'English loop quality label exists')
  assert.match(workflowPanel, /SubAgent 已上报，等待主 Agent 读取汇总/, 'pending commander review copy exists')
  assert.match(workflowPanel, /存在模型\/任务失败，主 Agent 需要重试或换模型/, 'model failure quality copy exists')

  const { RoomManager } = await import('../../lib/engine/room-manager.js')
  const { WorkflowOrchestrator } = await import('../../lib/engine/workflow-orchestrator.js')
  const { parseStructuredAgentResult, stripStructuredAgentResult } = await import('../../lib/engine/structured-result.js')

  const manager = new RoomManager()
  const room = manager.getRoom('dev-team-alpha')
  assert.ok(room, 'default room exists')
  assert.equal(room.orchestration.masterAgentId, 'commander', 'commander is master agent')
  assert.ok(room.orchestration.subAgentIds.includes('researcher'), 'researcher is subagent')
  assert.equal(room.orchestration.toolRoutingPolicy.webSearchOwner, 'researcher', 'research tools are routed to researcher')
  assert.equal(room.orchestration.toolRoutingPolicy.forbidDuplicateToolRace, true, 'duplicate tool race is forbidden')

  const stage = room.workflow.stages[room.workflow.currentStageIndex]
  const task = WorkflowOrchestrator.getReadyTasks(stage, 'researcher')[0] || WorkflowOrchestrator.getReadyTasks(stage)[0]
  const assignment = manager.createAssignment(room.roomId, task.ownerRoleId, 'P48 小任务：检查中英文业务功能闭环', {stageId:stage.id, workflowTaskId:task.taskId, createdByRoleId:'commander'})
  assert.ok(assignment, 'master creates assignment for subagent')
  assert.equal(assignment.createdByRoleId, 'commander', 'assignment created by master agent')
  assert.notEqual(assignment.ownerRoleId, 'commander', 'assignment is owned by subagent')

  manager.markAssignmentRunning(room.roomId, assignment.assignmentId)
  const rawReply = `已检查中英文业务功能：中央群聊、HUD、角色/工作流入口均可切换。\n\n\`\`\`agent-result\nRESULT_STATUS: passed\nSUMMARY: P48 子 Agent 完成检查并上报主 Agent。\nNEXT: 请主 Agent 汇总验收。\nEVIDENCE: chrome-smoke; test-matrix\n\`\`\``
  const structured = parseStructuredAgentResult(rawReply)
  assert.equal(structured.status, 'passed', 'structured result says passed')
  const visible = stripStructuredAgentResult(rawReply)
  const resultMessage = manager.addMessage(room.roomId, {
    sender:{kind:'agent', id:assignment.ownerRoleId, name:assignment.ownerRoleId, avatar:'🤖'},
    content: visible,
    mentions:['commander'],
    metadata:{assignmentId: assignment.assignmentId, structuredResult: structured, tokensConsumed:{promptTokens:10, completionTokens:6, totalTokens:16}},
  })
  manager.completeAssignment(room.roomId, assignment.assignmentId, resultMessage.messageId)
  const updated = WorkflowOrchestrator.updateTaskStatus(room, stage.id, task.taskId, 'passed', {assignmentId: assignment.assignmentId, verificationOutput: structured.summary, verificationExitCode: 0, verifiedByRoleId: assignment.ownerRoleId})
  assert.equal(updated.success, true, 'workflow task is updated')

  const report = manager.addMailboxMessage(room.roomId, {fromRoleId: assignment.ownerRoleId, toRoleId:'commander', assignmentId: assignment.assignmentId, content: visible, artifactRefs:['Docs/p48-real-agent-loop-quality/README.md']})
  assert.ok(report, 'subagent reports to master mailbox')
  assert.equal(report.toRoleId, 'commander', 'report targets master agent')
  assert.equal(report.fromRoleId, assignment.ownerRoleId, 'report comes from subagent')
  assert.equal(Boolean(report.readAt), false, 'report starts unread for master review')
  const read = manager.markMailboxRead(room.roomId, report.mailboxMessageId, 'commander')
  assert.ok(read.readAt, 'master reads report')

  const finalRoom = manager.getRoom(room.roomId)
  const completed = finalRoom.assignments.filter(a => a.status === 'completed').length
  const subReports = (finalRoom.mailboxes.commander || []).filter(m => m.fromRoleId !== 'commander').length
  const unread = (finalRoom.mailboxes.commander || []).filter(m => !m.readAt).length
  assert.ok(completed >= 1, 'completed assignments exist')
  assert.ok(subReports >= 1, 'subagent reports exist')
  assert.equal(unread, 0, 'master inbox has no unread report for this simulated loop')

  console.log(JSON.stringify({
    P48_REAL_AGENT_LOOP_QUALITY_EXIT: 0,
    masterAgent: finalRoom.orchestration.masterAgentId,
    subAgentOwner: assignment.ownerRoleId,
    assignmentCreatedBy: assignment.createdByRoleId,
    assignmentStatus: finalRoom.assignments.find(a => a.assignmentId === assignment.assignmentId).status,
    workflowTaskStatus: updated.task.status,
    subagentReports: subReports,
    masterRead: Boolean(read.readAt),
    hudQualityCard: 'data-dsh-gc-loop-quality',
  }, null, 2))
}

main().catch(err => { console.error(err); process.exit(1) })

const assert = require('node:assert/strict')

async function main() {
  const { RoomManager } = await import('../lib/engine/room-manager.js')
  const { WorkflowOrchestrator } = await import('../lib/engine/workflow-orchestrator.js')
  const { buildAutoSetupDraft, classifyAutoSetupIntent } = await import('../lib/engine/auto-setup.js')
  const { parseStructuredAgentResult, stripStructuredAgentResult, inferAgentTaskStatus } = await import('../lib/engine/structured-result.js')
  const { recommendModelsForRoles } = await import('../lib/engine/model-recommender.js')

  const manager = new RoomManager()
  const events = []
  manager.subscribe(event => events.push(event))
  const room = manager.getRoom('dev-team-alpha')
  assert.ok(room, 'default room exists')
  assert.equal(room.activeTheme, 'meme_comedy', 'default theme is meme_comedy')
  assert.equal(room.dispatchMode, 'workflow_driven', 'default dispatch mode is workflow_driven')

  const brief = '请根据这个工作区自动创建角色和工作流：做一个轻量 ToDo 插件，含 UI、后端状态、测试和文档。'
  const intent = classifyAutoSetupIntent(brief, false)
  assert.equal(intent.kind, 'draft', 'auto setup intent is detected')

  const draft = buildAutoSetupDraft(brief, room.members)
  assert.equal(draft.orchestration.strategy, 'master_subagents', 'master/subagent strategy created')
  assert.equal(draft.orchestration.toolRoutingPolicy.webSearchOwner, 'researcher', 'research tools routed to researcher')
  assert.ok(draft.workflow.stages.length >= 5, 'workflow draft has stages')
  assert.ok(draft.members.every(member => member.modelHint), 'role model hints attached')

  manager.setPendingAutoSetup(room.roomId, draft)
  const applied = manager.applyPendingAutoSetup(room.roomId)
  assert.ok(applied, 'pending draft applies')
  assert.equal(applied.dispatchMode, 'workflow_driven', 'applied workflow keeps workflow mode')
  assert.equal(applied.orchestration.masterAgentId, 'commander', 'commander is master agent')

  const firstStage = applied.workflow.stages[applied.workflow.currentStageIndex]
  const ready = WorkflowOrchestrator.getReadyTasks(firstStage)
  assert.ok(ready.length > 0, 'ready tasks found')
  const task = ready[0]
  const assignment = manager.createAssignment(applied.roomId, task.ownerRoleId, `执行小任务：${task.title}`, {stageId:firstStage.id, workflowTaskId:task.taskId, createdByRoleId:'commander'})
  assert.ok(assignment, 'assignment created')
  manager.markAssignmentRunning(applied.roomId, assignment.assignmentId)

  const rawReply = `已完成 ${task.title}。\n\n\`\`\`agent-result\nRESULT_STATUS: passed\nSUMMARY: 已产出轻量 ToDo 插件最小方案，含 UI、状态、测试和文档拆分。\nNEXT: 交给主 Agent 汇总并推进下一任务。\nEVIDENCE: unit-pass; docs-updated\n\`\`\``
  const structured = parseStructuredAgentResult(rawReply)
  assert.equal(structured.status, 'passed', 'structured status parsed')
  assert.equal(inferAgentTaskStatus(rawReply), 'passed', 'structured status drives task status')
  const visible = stripStructuredAgentResult(rawReply)
  assert.ok(!visible.includes('RESULT_STATUS'), 'visible reply strips control block')

  const msg = manager.addMessage(applied.roomId, {
    sender:{kind:'agent', id:task.ownerRoleId, name:task.ownerRoleId, avatar:'🤖'},
    content:visible,
    mentions:['commander'],
    metadata:{assignmentId:assignment.assignmentId, structuredResult:structured},
  })
  manager.completeAssignment(applied.roomId, assignment.assignmentId, msg.messageId)
  const update = WorkflowOrchestrator.updateTaskStatus(applied, firstStage.id, task.taskId, structured.status, {assignmentId:assignment.assignmentId, verificationOutput:structured.summary, verificationExitCode:0, verifiedByRoleId:task.ownerRoleId})
  assert.equal(update.success, true, 'workflow task updated from structured result')
  assert.equal(update.task.status, 'passed', 'workflow task passed')
  assert.equal(update.task.verification.output, structured.summary, 'summary stored for HUD')

  const mailbox = manager.addMailboxMessage(applied.roomId, {fromRoleId:task.ownerRoleId, toRoleId:'commander', assignmentId:assignment.assignmentId, content:visible, artifactRefs:['Docs/p10-end-to-end-small-task/README.md']})
  assert.ok(mailbox && !mailbox.readAt, 'mailbox message created unread')
  const read = manager.markMailboxRead(applied.roomId, mailbox.mailboxMessageId, 'commander')
  assert.ok(read.readAt, 'mailbox message marked read')

  const catalog = [
    {id:'cpa', name:'CPA', models:[{id:'claude-opus-4-6-thinking', name:'Claude Opus Thinking'}, {id:'gemini-3.8-flash-high', name:'Gemini Flash'}]},
    {id:'win', name:'Windows', models:[{id:'gpt-5.3-codex-spark', name:'Codex Spark'}]},
  ]
  const recs = recommendModelsForRoles(applied.orchestration.modelHints, catalog, {recent:[{provider:'win', model:'gpt-5.3-codex-spark'}], current:{provider:'cpa', model:'gemini-3.8-flash-high'}})
  assert.ok(recs.commander?.length > 0, 'commander model recommendations created')
  assert.ok(recs.frontend?.some(item => item.model === 'gpt-5.3-codex-spark' || item.model === 'gemini-3.8-flash-high'), 'frontend receives usable model recommendations')

  const types = events.map(e => e.type)
  assert.ok(types.includes('assignment:updated'), 'assignment event emitted')
  assert.ok(types.includes('mailbox:new'), 'mailbox new event emitted')
  assert.ok(types.includes('mailbox:updated'), 'mailbox updated event emitted')

  console.log(JSON.stringify({
    P10_END_TO_END_NO_LLM_EXIT: 0,
    roomId: applied.roomId,
    theme: applied.activeTheme,
    mode: applied.dispatchMode,
    masterAgent: applied.orchestration.masterAgentId,
    subAgents: applied.orchestration.subAgentIds.length,
    readyTasks: ready.length,
    assignmentStatus: manager.getRoom(applied.roomId).assignments.find(a=>a.assignmentId===assignment.assignmentId).status,
    taskStatus: update.task.status,
    mailboxRead: Boolean(read.readAt),
    emittedEvents: [...new Set(types)].sort(),
  }, null, 2))
}

main().catch(err => { console.error(err); process.exit(1) })



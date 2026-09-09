const assert = require('node:assert/strict')

const metric = (i) => ({turnCount:1,stepCount:2+i,llmMs:1000+i*100,toolMs:i%2?500:0,firstTokenMsTotal:120+i,firstTokenCount:1,inputTokens:1000+i*10,outputTokens:200+i,cacheReadTokens:300,cacheWriteTokens:0})

async function main() {
  const { RoomManager } = await import('../../lib/engine/room-manager.js')
  const { WorkflowOrchestrator } = await import('../../lib/engine/workflow-orchestrator.js')
  const { buildAutoSetupDraft } = await import('../../lib/engine/auto-setup.js')
  const { parseStructuredAgentResult, stripStructuredAgentResult } = await import('../../lib/engine/structured-result.js')

  const manager = new RoomManager()
  const events = []
  manager.subscribe(event => events.push(event))
  const room = manager.getRoom('dev-team-alpha')
  assert.ok(room, 'default room exists')

  const brief = '真实小任务：给 dsh-group-chat 增加右侧 HUD 视觉回归与文档同步。'
  const draft = buildAutoSetupDraft(brief, room.members)
  manager.setPendingAutoSetup(room.roomId, draft)
  const applied = manager.applyPendingAutoSetup(room.roomId)
  assert.equal(applied.orchestration.masterAgentId, 'commander')
  assert.deepEqual(new Set(applied.orchestration.subAgentIds), new Set(['researcher','backend','frontend','qa','writer']))
  assert.equal(applied.orchestration.toolRoutingPolicy.webSearchOwner, 'researcher')
  assert.equal(applied.orchestration.toolRoutingPolicy.frontendCodeOwner, 'frontend')
  assert.equal(applied.orchestration.toolRoutingPolicy.qaOwner, 'qa')
  assert.equal(applied.orchestration.toolRoutingPolicy.forbidDuplicateToolRace, true)
  assert.equal(applied.orchestration.toolRoutingPolicy.allowStageParallelism, true)

  const stage = applied.workflow.stages[applied.workflow.currentStageIndex]
  const owners = ['researcher', 'backend', 'frontend', 'qa', 'writer']
  const created = []
  for (const [i, owner] of owners.entries()) {
    const taskId = `p19.${owner}`
    stage.tasks.push({
      taskId,
      title: `P19 ${owner} 小任务`,
      description: `${owner} 按职责完成真实项目闭环的一小块。`,
      ownerRoleId: owner,
      dependsOn: [],
      status: 'ready',
      verifyCommand: owner === 'qa' ? 'npm run test:ui:visual' : undefined,
      qualityContract: {acceptanceCriteria:[`${owner} 只做自己归口的工作`, '产物可被 commander 审核'], riskChecks:['不得重复抢 researcher 的搜索/爬取工具']},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    const assignment = manager.createAssignment(applied.roomId, owner, `真实小任务分派给 ${owner}`, {stageId:stage.id, workflowTaskId:taskId, createdByRoleId:'commander', taskType: owner === 'researcher' ? 'research' : owner === 'writer' ? 'docs' : owner})
    manager.markAssignmentRunning(applied.roomId, assignment.assignmentId)
    const raw = `${owner} 已完成归口任务，未重复调用其他角色工具。\n\n\`\`\`agent-result\nRESULT_STATUS: passed\nSUMMARY: ${owner} 交付了 P19 真实闭环证据。\nNEXT: 回传 commander 汇总。\nEVIDENCE: Docs/p19-real-project-loop/README.md\n\`\`\``
    const structured = parseStructuredAgentResult(raw)
    const visible = stripStructuredAgentResult(raw)
    const message = manager.addMessage(applied.roomId, {
      sender:{kind:'agent', id:owner, name:owner, avatar:'🤖'},
      content:visible,
      mentions:['commander'],
      metadata:{assignmentId:assignment.assignmentId, structuredResult:structured, providerUsed:'test', modelUsed:`${owner}-model`, tokensConsumed:{promptTokens:100+i, completionTokens:20+i, totalTokens:120+i}, runtimeMetrics:metric(i)},
    })
    manager.completeAssignment(applied.roomId, assignment.assignmentId, message.messageId)
    const update = WorkflowOrchestrator.updateTaskStatus(applied, stage.id, taskId, structured.status, {assignmentId:assignment.assignmentId, verificationOutput:structured.summary, verificationExitCode:0, verifiedByRoleId:owner})
    assert.equal(update.task.status, 'passed')
    manager.addMailboxMessage(applied.roomId, {fromRoleId:owner, toRoleId:'commander', assignmentId:assignment.assignmentId, content:visible, artifactRefs:['Docs/p19-real-project-loop/README.md']})
    created.push({owner, assignmentId:assignment.assignmentId, messageId:message.messageId})
  }

  const digest = manager.formatCommanderMailboxDigest(applied.roomId, 'commander')
  assert.match(digest, /主 Agent 收件箱摘要/)
  assert.match(digest, /未读: 5 条/)
  for (const owner of owners) assert.match(digest, new RegExp('@' + owner))

  const firstMailbox = manager.getMailbox(applied.roomId, 'commander')[0]
  manager.markMailboxRead(applied.roomId, firstMailbox.mailboxMessageId, 'commander')
  const digestAfterRead = manager.formatCommanderMailboxDigest(applied.roomId, 'commander')
  assert.match(digestAfterRead, /未读: 4 条/)

  const failedTaskId = 'p19.retry-demo'
  stage.tasks.push({taskId:failedTaskId,title:'P19 失败动作演示',description:'验证失败后快捷动作',ownerRoleId:'qa',dependsOn:[],status:'failed',createdAt:Date.now(),updatedAt:Date.now()})
  let action = WorkflowOrchestrator.applyTaskAction(applied, stage.id, failedTaskId, 'retry', 'commander', '回归失败，重新放回队列')
  assert.equal(action.task.status, 'ready')
  action = WorkflowOrchestrator.applyTaskAction(applied, stage.id, failedTaskId, 'request_human', 'commander', '缺少用户截图')
  assert.equal(action.task.status, 'request_human')
  action = WorkflowOrchestrator.applyTaskAction(applied, stage.id, failedTaskId, 'skip', 'commander', '低风险，人工跳过')
  assert.equal(action.task.status, 'passed')
  assert.match(action.task.verification.output, /人工跳过|低风险/)

  const summary = manager.exportMeetingSummary(applied.roomId)
  assert.match(summary, /Commander Inbox Digest|主 Agent 收件箱摘要/)
  assert.match(summary, /Token Ledger|资源消耗审计/)
  assert.ok(manager.getLedger(applied.roomId).totalCalls >= owners.length, 'ledger records per-agent calls')

  const eventTypes = new Set(events.map(e => e.type))
  assert.ok(eventTypes.has('assignment:updated'), 'assignment event emitted')
  assert.ok(eventTypes.has('mailbox:new'), 'mailbox event emitted')
  assert.ok(eventTypes.has('mailbox:updated'), 'mailbox read event emitted')

  console.log(JSON.stringify({
    P19_REAL_PROJECT_LOOP_EXIT: 0,
    masterAgent: applied.orchestration.masterAgentId,
    subAgents: applied.orchestration.subAgentIds.length,
    assignments: created.length,
    commanderUnreadAfterOneRead: manager.getMailbox(applied.roomId, 'commander').filter(m=>!m.readAt).length,
    ledgerCalls: manager.getLedger(applied.roomId).totalCalls,
    retryActionCovered: true,
    requestHumanActionCovered: true,
    skipActionCovered: true,
  }, null, 2))
}

main().catch(err => { console.error(err); process.exit(1) })

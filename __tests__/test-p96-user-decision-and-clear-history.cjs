const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const arbiterSource = fs.readFileSync(path.join(root, 'src/engine/arbiter.ts'), 'utf8')
const indexSource = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8')
const typesSource = fs.readFileSync(path.join(root, 'src/types.ts'), 'utf8')
const projectionSource = fs.readFileSync(path.join(root, 'src/engine/projection.ts'), 'utf8')
const panelSource = fs.readFileSync(path.join(root, 'src/client/GroupChatPanel.tsx'), 'utf8')

// 1. Static AST / contract assertions
assert(typesSource.includes('UserDecisionPrompt'), 'types must define UserDecisionPrompt')
assert(typesSource.includes('UserDecisionOption'), 'types must define UserDecisionOption')
assert(typesSource.includes('awaitingUserDecision?: UserDecisionPrompt'), 'GroupChatRoom must support awaitingUserDecision')
assert(typesSource.includes("'room:cleared'"), 'GroupChatEventType must support room:cleared')

assert(projectionSource.includes('【需要您拍板 / 方案抉择】'), 'projection must guide commander to provide structured decision options')
assert(arbiterSource.includes('detectUserDecisionRequest'), 'arbiter must export detectUserDecisionRequest')
assert(indexSource.includes('/room/clear') || indexSource.includes('/rooms/clear'), 'index must expose room clear endpoint')
assert(indexSource.includes('awaitingUserDecision'), 'index must manage awaitingUserDecision lifecycle')
assert(panelSource.includes('awaitingDecision'), 'panel must render awaiting decision card')
assert(panelSource.includes('room:cleared'), 'panel must handle room:cleared event')

// 2. Functional & Simulation Testing
const { DispatchArbiter } = require(path.join(root, 'lib/engine/arbiter.js'))
const { WorkflowOrchestrator } = require(path.join(root, 'lib/engine/workflow-orchestrator.js'))
const { RoomManager } = require(path.join(root, 'lib/engine/room-manager.js'))
const { WorkspaceRoomStateStore } = require(path.join(root, 'lib/engine/workspace-settings.js'))

console.log('--- TEST 1: Clear Room and Reset History ---')
const roomManager = new RoomManager()
const room = roomManager.getRoom('dev-team-alpha')
assert(room, 'dev-team-alpha room must exist')

// Add dummy messages, assignments, mailbox
roomManager.addMessage('dev-team-alpha', {
  roomId: 'dev-team-alpha',
  sender: { kind: 'user', id: 'user', name: 'User' },
  content: 'Initial dummy message',
})
roomManager.createAssignment('dev-team-alpha', 'researcher', 'Dummy assignment', { createdByRoleId: 'commander', stageId: 'stage_1', taskTier: 'quick' })
roomManager.addMailboxMessage('dev-team-alpha', {
  fromRoleId: 'researcher',
  toRoleId: 'commander',
  content: 'Dummy report',
})

assert(roomManager.getMessages('dev-team-alpha').length > 0, 'Messages must exist before clear')
assert(room.assignments.length > 0, 'Assignments must exist before clear')

// Clear room
const clearedRoom = roomManager.clearRoom('dev-team-alpha')
assert.equal(roomManager.getMessages('dev-team-alpha').length, 0, 'Messages must be empty after clear')
assert.equal(clearedRoom.assignments.length, 0, 'Assignments must be empty after clear')
assert.equal(clearedRoom.workflow.currentStageIndex, 0, 'Workflow stage index must reset to 0')
assert.equal(clearedRoom.scratchpad, '', 'Scratchpad must be empty after clear')
console.log('PASS: Clear room resets messages, assignments, workflow and scratchpad.')

console.log('--- TEST 2: Commander Decision Request Detection & Parsing ---')
const commanderDecisionText = `收到需求！Markdown 与图表高清海报渲染功能非常实用。
在开整前，有一项关键渲染方案需要您拍板：
【需要您拍板 / 方案抉择】：海报渲染引擎与运行架构选型
- 选项 A：纯前端 Canvas + SVG 渲染，秒级生成，零服务端开销（推荐）
- 选项 B：Node.js Puppeteer 服务端截图渲染，支持复杂 CSS 3D 特效与超大图
- 指挥官推荐：对于常规图文与图表卡片，选项 A 最轻量高效且无网络延迟。
请 @用户 拍板选择选项 A 或 B，我们立即开整！`

const decisionParsed = DispatchArbiter.detectUserDecisionRequest(commanderDecisionText)
assert.equal(decisionParsed.isAwaiting, true, 'detectUserDecisionRequest must detect awaiting state')
assert(decisionParsed.prompt, 'prompt must be parsed')
assert(decisionParsed.prompt.question.includes('海报渲染引擎与运行架构选型'), 'question must be correctly extracted')
assert.equal(decisionParsed.prompt.options.length, 2, 'two options must be parsed')
assert.equal(decisionParsed.prompt.options[0].key, 'A', 'Option A key must match')
assert.equal(decisionParsed.prompt.options[0].isRecommended, true, 'Option A must be recommended')
assert.equal(decisionParsed.prompt.options[1].key, 'B', 'Option B key must match')
assert.equal(decisionParsed.prompt.options[1].isRecommended, false, 'Option B must not be recommended')
console.log('PASS: Commander decision options parsed with key, recommendation and question.')

console.log('--- TEST 3: Arbiter Halts Auto-Dispatch when Awaiting User Decision ---')
const testRoom = {
  roomId: 'test-flow-room',
  dispatchMode: 'workflow_driven',
  moderatorAgentId: 'commander',
  activeTheme: 'meme_comedy',
  members: roomManager.createDefaultFleet('meme_comedy'),
  workflow: WorkflowOrchestrator.createStandardDevWorkflow(),
  safetyPolicy: { maxTurnsPerPrompt: 6, silenceToken: 'NO_REPLY' },
  interactionRound: 1,
  assignments: [],
}

const commanderEnvelope = {
  messageId: 'msg-cmd-decision',
  roomId: 'test-flow-room',
  sender: { kind: 'agent', id: 'commander', name: '总导演' },
  content: commanderDecisionText,
  metadata: {},
}

const decisionResult = DispatchArbiter.decideNextSpeakers(testRoom, commanderEnvelope)
assert.equal(decisionResult.isTerminal, true, 'decideNextSpeakers must return isTerminal: true while awaiting user decision')
assert.equal(decisionResult.nextSpeakerIds.length, 0, 'No subagents should be dispatched before user decides')
assert(decisionResult.reason.includes('等待用户拍板'), 'Reason must mention awaiting user reply')
console.log('PASS: Arbiter halts automatic SubAgent dispatch while waiting for human decision.')

console.log('--- TEST 4: Full End-to-End Task Lifecycle with User Decision ---')
// Step 4.1: User submits request
const userMsg1 = {
  messageId: 'msg-user-1',
  roomId: testRoom.roomId,
  sender: { kind: 'user', id: 'user', name: '人类负责人' },
  content: '帮我们开发一个多模态图文卡片导出工具，需要把 Markdown 与图表渲染成高清海报。',
}
const dispatchToCommander = DispatchArbiter.decideNextSpeakers(testRoom, userMsg1)
assert.equal(dispatchToCommander.isTerminal, false)
assert(dispatchToCommander.nextSpeakerIds.includes('commander'), 'User message must dispatch to commander in workflow mode')

// Step 4.2: Commander raises options, room sets awaitingUserDecision
testRoom.awaitingUserDecision = decisionParsed.prompt
assert(testRoom.awaitingUserDecision, 'Room is now awaiting user decision')

// Step 4.3: User answers with Option A
const userMsg2 = {
  messageId: 'msg-user-2',
  roomId: testRoom.roomId,
  sender: { kind: 'user', id: 'user', name: '人类负责人' },
  content: '我拍板选择：选项 A（纯前端 Canvas + SVG 渲染，秒级生成）',
}
// Clearing awaitingUserDecision upon user response
testRoom.awaitingUserDecision = undefined
const dispatchAfterUserChoice = DispatchArbiter.decideNextSpeakers(testRoom, userMsg2)
assert.equal(dispatchAfterUserChoice.isTerminal, false)
assert(dispatchAfterUserChoice.nextSpeakerIds.includes('commander'), 'User choice must return to commander')

// Step 4.4: Commander acknowledges choice and dispatches Stage 1 researcher
const commanderMsgStartStage1 = {
  messageId: 'msg-cmd-start-stage1',
  roomId: testRoom.roomId,
  sender: { kind: 'agent', id: 'commander', name: '总导演' },
  content: `收到负责人的拍板！确认采用【方案 A：纯前端 Canvas + SVG 渲染】。
已沉淀入项目全局黑板。
现在正式启动 [${testRoom.workflow.stages[0].name}]：
请 @瓜田侦探 检索现成的高性能 Canvas Markdown 与图表卡片开源实现与最佳实践！`,
}
const dispatchStage1 = DispatchArbiter.decideNextSpeakers(testRoom, commanderMsgStartStage1)
assert.equal(dispatchStage1.isTerminal, false)
assert(dispatchStage1.nextSpeakerIds.includes('researcher'), 'Commander must dispatch researcher for Stage 1')

// Step 4.5: Researcher finishes and reports to commander
const researcherReport = {
  messageId: 'msg-research-done',
  roomId: testRoom.roomId,
  sender: { kind: 'agent', id: 'researcher', name: '瓜田侦探' },
  content: `### 外部方案调研报告回执
1. 已调研现成方案：html2canvas + 自绘 SVG 路径引擎；
2. 推荐架构：采用离屏 Canvas 双缓冲输出，规避 DOM 重排与模糊；
3. 调研任务已完成，上报总指挥官 @总指挥 审核！`,
  metadata: { stageId: testRoom.workflow.stages[0].id },
}
const dispatchBackToCommander = DispatchArbiter.decideNextSpeakers(testRoom, researcherReport)
assert.equal(dispatchBackToCommander.isTerminal, false)
assert(dispatchBackToCommander.nextSpeakerIds.includes('commander'), 'Subagent report must always return to commander')

// Step 4.6: Commander reviews deliverables and approves stage advancement
testRoom.workflow.stages[0].tasks.forEach(t => t.status = 'passed')
const commanderAdvanceMsg = {
  messageId: 'msg-cmd-advance',
  roomId: testRoom.roomId,
  sender: { kind: 'agent', id: 'commander', name: '总导演' },
  content: '调研结果详实完整，双缓冲离屏 Canvas 方案可行！准予放行，流程批准推进至下一阶段。',
}
const advanceDecision = DispatchArbiter.decideNextSpeakers(testRoom, commanderAdvanceMsg)
assert.equal(advanceDecision.isTerminal, false)
assert.equal(testRoom.workflow.currentStageIndex, 1, 'Stage must advance to stage 2')
console.log('PASS: Workflow successfully advanced to stage 2 after commander review.')

// Step 4.7: Fast-forward remaining stages to complete whole task
while (testRoom.workflow.currentStageIndex < testRoom.workflow.stages.length - 1) {
  const current = testRoom.workflow.stages[testRoom.workflow.currentStageIndex]
  if (current.tasks) current.tasks.forEach(t => t.status = 'passed')
  const stepMsg = {
    messageId: `msg-step-${testRoom.workflow.currentStageIndex}`,
    roomId: testRoom.roomId,
    sender: { kind: 'agent', id: 'commander', name: '总导演' },
    content: `阶段 [${current.name}] 任务均已通过质量门禁，批准放行！`,
  }
  DispatchArbiter.decideNextSpeakers(testRoom, stepMsg)
}

// Final acceptance stage
const finalStage = testRoom.workflow.stages[testRoom.workflow.stages.length - 1]
if (finalStage.tasks) finalStage.tasks.forEach(t => t.status = 'passed')
const finalCloseMsg = {
  messageId: 'msg-final-close',
  roomId: testRoom.roomId,
  sender: { kind: 'agent', id: 'commander', name: '总导演' },
  content: '全链路验收合格，代码、测试与交付文档完整闭环，最终总装验收交付完成！',
}
const finalDecision = DispatchArbiter.decideNextSpeakers(testRoom, finalCloseMsg)
assert.equal(finalDecision.isTerminal, true, 'Final decision must be terminal completion')
assert(finalDecision.reason.includes('最终验收与结题收口') || finalDecision.reason.includes('全部阶段已顺利通过'), 'Final reason must indicate full completion')
console.log('PASS: Complete task lifecycle finished successfully from initial inquiry to final delivery!')

console.log('PASS test-p96-user-decision-and-clear-history')
console.log(JSON.stringify({
  P96_USER_DECISION_AND_CLEAR_HISTORY_EXIT: 0,
  clearRoom: true,
  userDecisionPromptDetection: true,
  optionsParsing: true,
  antiStallSuppressionDuringDecision: true,
  endToEndFullTaskLifecycle: true,
}))

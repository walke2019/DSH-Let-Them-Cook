const assert = require('node:assert/strict')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

const { RoomManager } = require(path.join(root, 'lib/engine/room-manager.js'))
const { DispatchArbiter } = require(path.join(root, 'lib/engine/arbiter.js'))
const { WorkflowOrchestrator } = require(path.join(root, 'lib/engine/workflow-orchestrator.js'))
const { parseStructuredAgentResult, stripStructuredAgentResult } = require(path.join(root, 'lib/engine/structured-result.js'))

console.log('======================================================================')
console.log('🚀 启动多 Agent 全流程闭环模拟测试 (Full End-to-End Simulation)')
console.log('======================================================================\n')

// 1. 初始化会话房间与多 Agent 成员体系
const roomManager = new RoomManager()
const roomId = 'simulation-perf-monitor'
const roomData = {
  roomId,
  name: '系统性能监视器开发群',
  dispatchMode: 'workflow_driven',
  interactionRound: 0,
  members: [
    { id: 'commander', name: '总指挥官', title: '团队统筹', role: 'moderator', permissions: { allowedTools: ['read', 'glob'] } },
    { id: 'researcher', name: '调研专家', title: '架构与协议调研', permissions: { allowedTools: ['read', 'grep', 'web_search'] } },
    { id: 'backend', name: '后端开发', title: 'API与服务实现', permissions: { allowedTools: ['read', 'edit', 'write', 'bash'] } },
    { id: 'frontend', name: '前端设计', title: 'HUD与可视化UI', permissions: { allowedTools: ['read', 'edit', 'write'] } },
    { id: 'qa', name: '质量测试', title: '端到端测试与验收', permissions: { allowedTools: ['read', 'bash'] } },
  ],
  workflow: {
    title: '系统实时监视器开发工作流',
    currentStageIndex: 0,
    stages: [
      {
        id: 'stage_1_research_and_design',
        name: '阶段一：架构设计与协议调研',
        status: 'in_progress',
        assignedRoleIds: ['researcher', 'backend'],
        tasks: [
          {
            taskId: 'TASK-01',
            title: '采集协议与架构调研',
            ownerRoleId: 'researcher',
            description: '评估 WebSocket 与 SSE 的性能与系统开销',
            status: 'ready',
            dependsOn: [],
            qualityContract: { acceptanceCriteria: ['明确通信协议优劣', '给出推荐架构'], riskChecks: [] }
          },
          {
            taskId: 'TASK-02',
            title: '后端采集服务原型',
            ownerRoleId: 'backend',
            description: '实现 CPU/内存实时采集模块',
            status: 'pending',
            dependsOn: ['TASK-01'],
            verifyCommand: 'npm run test:backend',
            qualityContract: { acceptanceCriteria: ['采集误差 < 5%', '支持优雅退出'], riskChecks: [] }
          }
        ]
      },
      {
        id: 'stage_2_ui_and_verification',
        name: '阶段二：可视化面板与质量验收',
        status: 'pending',
        assignedRoleIds: ['frontend', 'qa'],
        tasks: [
          {
            taskId: 'TASK-03',
            title: '前端实时波形面板',
            ownerRoleId: 'frontend',
            description: '绘制 Canvas 实时折线图与 HUD 指标卡',
            status: 'pending',
            dependsOn: [],
            qualityContract: { acceptanceCriteria: ['60fps 流畅渲染', '支持主题自适应'], riskChecks: [] }
          },
          {
            taskId: 'TASK-04',
            title: '端到端回归验收',
            ownerRoleId: 'qa',
            description: '模拟高并发数据推送并校验稳定性',
            status: 'pending',
            dependsOn: ['TASK-03'],
            verifyCommand: 'npm run test:e2e',
            qualityContract: { acceptanceCriteria: ['无内存泄漏', '测试 100% 通过'], riskChecks: [] }
          }
        ]
      }
    ]
  },
  scratchpad: '',
  safetyPolicy: { maxTurnsPerPrompt: 24, enableBotToBotTrigger: true }
}
roomManager.saveRoom(roomData)
const room = roomManager.getRoom(roomId)

console.log('✅ [1/5] 会话房间与 2 阶段 4 任务 DAG 初始化完成\n')

// 2. 模拟用户输入需求
console.log('--- 步骤 1：用户下达需求 ---')
const userMsg = roomManager.addMessage(roomId, {
  roomId,
  sender: { kind: 'user', id: 'user', name: '人类负责人' },
  content: '请团队启动开发 DSH 实时系统性能监视器扩展，需要支持 CPU/内存实时监控和可视化面板！'
})
console.log(`[用户发言]: ${userMsg.content}`)

// 仲裁器唤醒总指挥官
const arbiter1 = DispatchArbiter.decideNextSpeakers(room, userMsg)
assert.deepEqual(arbiter1.nextSpeakerIds, ['commander'], '用户指令必须唤醒总指挥官')
console.log(`[调度判定]: ${arbiter1.reason}\n`)

// 3. 模拟总指挥官分析需求，并向用户提出架构选型方案（结构化选项）
console.log('--- 步骤 2：总指挥官发起方案抉择 ---')
const commanderMsg1Content = `收到需求！开发 DSH 实时系统性能监视器已纳入计划。
在进入编码前，有一项核心通信协议需要您拍板：
【需要您拍板 / 方案抉择】：实时性能指标推送协议选型
- 选项 A：WebSocket 全双工长连接，毫秒级延迟，适合高频波形渲染（推荐）
- 选项 B：Server-Sent Events (SSE) 单向流式传输，轻量兼容性好
- 指挥官推荐：选项 A 实时性更好，能够支持 60fps 性能采样。
请 @人类负责人 拍板确认！`

const decisionDetect = DispatchArbiter.detectUserDecisionRequest(commanderMsg1Content)
assert.equal(decisionDetect.isAwaiting, true, '必须精准识别拍板提问')
assert.equal(decisionDetect.prompt.options.length, 2, '必须解析出 2 个选项')
room.awaitingUserDecision = decisionDetect.prompt

const commanderEnvelope1 = roomManager.addMessage(roomId, {
  roomId,
  sender: { kind: 'agent', id: 'commander', name: '总指挥官' },
  content: commanderMsg1Content
})
console.log(`[总指挥官提问]: ${commanderMsg1Content.split('\n')[2]}`)
const arbiter2 = DispatchArbiter.decideNextSpeakers(room, commanderEnvelope1)
assert.equal(arbiter2.isTerminal, true, '提问后必须等待用户，调度挂起')
console.log(`[调度状态]: 挂起等待用户拍板 (${arbiter2.reason})\n`)

// 4. 用户回复选择选项 A
console.log('--- 步骤 3：用户确认拍板与总指挥分派 ---')
const userReplyMsg = roomManager.addMessage(roomId, {
  roomId,
  sender: { kind: 'user', id: 'user', name: '人类负责人' },
  content: '我拍板：选项 A（WebSocket 方案）！'
})
room.awaitingUserDecision = undefined // 消除决策等待

const arbiter3 = DispatchArbiter.decideNextSpeakers(room, userReplyMsg)
assert.deepEqual(arbiter3.nextSpeakerIds, ['commander'], '用户拍板后唤醒总指挥官推进')
console.log(`[调度状态]: 用户拍板成功，唤醒总指挥官开始派发任务\n`)

// 总指挥官下达执行计划（验证 isExecutionAcknowledgement 不会被误判）
const commanderPlanMsg = `收到拍板！正式锁定【选项 A：WebSocket 方案】。
战术分工已下达，全队全速开整：
1. 第一棒 · @调研专家 负责输出 WebSocket 协议规约与鉴权方案 (TASK-01)；
2. 第二棒 · @后端开发 负责基于 Node.js ws 模块编写性能采集端 (TASK-02)。`

const planDetect = DispatchArbiter.detectUserDecisionRequest(commanderPlanMsg)
assert.equal(planDetect.isAwaiting, false, '分工计划绝不能误判为拍板提问')

roomManager.addMessage(roomId, {
  roomId,
  sender: { kind: 'agent', id: 'commander', name: '总指挥官' },
  content: commanderPlanMsg
})

// 创建 TASK-01 分通信封
const task1Assignment = roomManager.createAssignment(roomId, 'researcher', '执行 TASK-01 协议与架构调研', {
  createdByRoleId: 'commander',
  stageId: 'stage_1_research_and_design',
  workflowTaskId: 'TASK-01',
  taskTier: 'quick'
})
roomManager.markAssignmentRunning(roomId, task1Assignment.assignmentId)
console.log(`[信封派发]: 创建任务信封 ${task1Assignment.assignmentId} -> 分派给 @调研专家 (Running)`)

// 5. 调研专家执行工具并回传成果
console.log('\n--- 步骤 4：子 Agent (@调研专家) 工具调用与结果交付 ---')
const researcherOutput = `### 调研与协议设计汇报
经过对 DSH 底座网络层与 Node.js 运行态的分析，推荐采用 WebSocket 二进制协议传输指标数据。

\`\`\`agent-result
RESULT_STATUS: passed
SUMMARY: 完成 WebSocket 通信协议规范与认证接入设计，满足毫秒级采集要求
EVIDENCE: protocol_spec.json 已生成, 时延压测指标 < 2ms
NEXT: 交给 @后端开发 落地数据采集服务
\`\`\``

const structured1 = parseStructuredAgentResult(researcherOutput)
assert.equal(structured1.status, 'passed')
const cleanResearcherContent = stripStructuredAgentResult(researcherOutput)

const researcherMsg = roomManager.addMessage(roomId, {
  roomId,
  sender: { kind: 'agent', id: 'researcher', name: '调研专家' },
  content: cleanResearcherContent,
  metadata: {
    assignmentId: task1Assignment.assignmentId,
    toolCalls: [{ id: 'tool-1', name: 'web_search', summary: '检索 WebSocket 协议标准' }]
  }
})
roomManager.completeAssignment(roomId, task1Assignment.assignmentId, researcherMsg.messageId)
WorkflowOrchestrator.updateTaskStatus(room, 'stage_1_research_and_design', 'TASK-01', 'passed', {
  assignmentId: task1Assignment.assignmentId,
  verificationOutput: structured1.summary
})

// 检查依赖自动刷新：TASK-02 应当由 pending -> ready
WorkflowOrchestrator.refreshTaskReadiness(room.workflow.stages[0])
assert.equal(room.workflow.stages[0].tasks[1].status, 'ready', '前置 TASK-01 完成后，TASK-02 必须自动变为 ready')
console.log(`[任务状态]: TASK-01 已 passed，TASK-02 依赖解锁变为 ready`)

// Universal Master Handoff 回传总指挥官收件箱
roomManager.addMailboxMessage(roomId, {
  fromRoleId: 'researcher',
  toRoleId: 'commander',
  assignmentId: task1Assignment.assignmentId,
  content: cleanResearcherContent
})
console.log(`[Mailbox]: 成果已回传总指挥官收件箱`)

// 6. 后端开发接续 TASK-02
console.log('\n--- 步骤 5：子 Agent (@后端开发) 编写代码与单测验证 ---')
const task2Assignment = roomManager.createAssignment(roomId, 'backend', '执行 TASK-02 后端采集服务开发', {
  createdByRoleId: 'commander',
  stageId: 'stage_1_research_and_design',
  workflowTaskId: 'TASK-02',
  taskTier: 'quick'
})
roomManager.markAssignmentRunning(roomId, task2Assignment.assignmentId)

const backendOutput = `### 后端性能采集服务开发完成
已在 \`src/services/monitor.ts\` 实现高精度 CPU/Memory 指标采样，单测全量跑通！

\`\`\`agent-result
RESULT_STATUS: passed
SUMMARY: 后端实时采集模块实现完毕，npm run test:backend 100% PASS
EVIDENCE: src/services/monitor.ts, 采样频率 100ms, CPU 负载率误差 < 1%
NEXT: 请求总指挥官进行阶段验收
\`\`\``

const structured2 = parseStructuredAgentResult(backendOutput)
assert.equal(structured2.status, 'passed')
const cleanBackendContent = stripStructuredAgentResult(backendOutput)
const backendMsg = roomManager.addMessage(roomId, {
  roomId,
  sender: { kind: 'agent', id: 'backend', name: '后端开发' },
  content: cleanBackendContent,
  metadata: {
    assignmentId: task2Assignment.assignmentId,
    toolCalls: [
      { id: 'tool-2', name: 'write_file', summary: '写入 src/services/monitor.ts' },
      { id: 'tool-3', name: 'bash', summary: '执行 npm run test:backend' }
    ]
  }
})
roomManager.completeAssignment(roomId, task2Assignment.assignmentId, backendMsg.messageId)
WorkflowOrchestrator.updateTaskStatus(room, 'stage_1_research_and_design', 'TASK-02', 'passed', {
  assignmentId: task2Assignment.assignmentId,
  verificationOutput: structured2.summary
})

// 7. 总指挥官进行阶段一质量门禁验收 (Stage Gate Approval)
console.log('\n--- 步骤 6：阶段一质量门禁自动校验与流转 ---')
const stage1Gate = WorkflowOrchestrator.stageGate(room.workflow.stages[0])
assert.equal(stage1Gate.allowed, true, '阶段一所有任务已 passed，质量门禁必须放行')
console.log(`[质量门禁]: 校验通过 - ${stage1Gate.reason}`)

// 模拟总指挥官发言批准，流程推进至阶段二
const commanderApproveMsg = `经审查，@调研专家 与 @后端开发 交付质量极高，单测全量通过！
【阶段验收通过】：准予放行，流程推进至【阶段二：可视化面板与质量验收】！
唤醒 @前端设计 绘制波形图，随后由 @质量测试 进行全链路验收。`

const commanderApproveEnvelope = roomManager.addMessage(roomId, {
  roomId,
  sender: { kind: 'agent', id: 'commander', name: '总指挥官' },
  content: commanderApproveMsg
})

const arbiterAdvance = DispatchArbiter.decideNextSpeakers(room, commanderApproveEnvelope)
assert.equal(room.workflow.currentStageIndex, 1, '工作流当前阶段必须推进到 Index 1 (阶段二)')
assert.equal(room.workflow.stages[0].status, 'completed', '阶段一状态必须为 completed')
assert.equal(room.workflow.stages[1].status, 'in_progress', '阶段二状态必须为 in_progress')
console.log(`[流程推进]: ${arbiterAdvance.reason}`)
console.log(`[阶段状态]: 阶段一已 completed，阶段二已激活 (in_progress)\n`)

// 8. 阶段二任务完成与最终收口
console.log('--- 步骤 7：阶段二任务完成与终态交付 ---')
room.workflow.stages[1].tasks[0].status = 'passed'
room.workflow.stages[1].tasks[1].status = 'passed'
room.workflow.stages[1].status = 'completed'

const finalCommanderMsg = `🎉 **项目全量交付报告**
1. **架构与协议**：采用 WebSocket 全双工协议，毫秒级传输；
2. **后端采集**：完成高精度指标采样服务，单测 100% 通过；
3. **前端可视化**：Canvas 实时折线图面板开发就绪；
4. **质量验收**：压力与稳定性测试已全部通过！
工作流全部阶段已顺利完结，代码已就绪。`

const finalEnvelope = roomManager.addMessage(roomId, {
  roomId,
  sender: { kind: 'agent', id: 'commander', name: '总指挥官' },
  content: finalCommanderMsg
})

// 推进完结检查
const finalArbiter = DispatchArbiter.decideNextSpeakers(room, finalEnvelope)
assert.equal(finalArbiter.isTerminal, true, '全部阶段完结后流程必须收官 (Terminal)')
console.log(`[终态收官]: ${finalArbiter.reason}`)

console.log('\n======================================================================')
console.log('🎉 恭喜！多 Agent 全流程闭环模拟测试 100% 全部通过！')
console.log('======================================================================')

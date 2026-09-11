const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const arbiterSource = fs.readFileSync(path.join(root, 'src/engine/arbiter.ts'), 'utf8')
const indexSource = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8')

// Whitebox checks
assert(arbiterSource.includes('effectiveMaxTurns'), 'arbiter must compute dynamic effectiveMaxTurns based on task tier/mode')
assert(arbiterSource.includes('Math.max(safetyPolicy.maxTurnsPerPrompt || 6, 24)'), 'arbiter must support at least 24 turns for long/workflow tasks')
assert(indexSource.includes('Math.max(room.safetyPolicy.maxTurnsPerPrompt || 6, 24)'), 'index must support at least 24 turns for long/workflow tasks')

assert(arbiterSource.includes('准予') && arbiterSource.includes('合格') && arbiterSource.includes('推进'), 'arbiter must support diverse advance keywords')
assert(arbiterSource.includes('approve|approved|proceed|next stage|pass|lgtm'), 'arbiter must support english approval keywords')

assert(indexSource.includes('Watchdog stopped task after exceeding runtime limit'), 'watchdog must notify commander on timeout')
assert(indexSource.includes('toRoleId: masterId') && indexSource.includes('void triggerAgentTurn(roomId, masterId)'), 'error recovery must wake commander')

// Blackbox simulation of DispatchArbiter
const { DispatchArbiter } = require(path.join(root, 'lib/engine/arbiter.js'))
const { WorkflowOrchestrator } = require(path.join(root, 'lib/engine/workflow-orchestrator.js'))

const members = [
  { id: 'commander', name: '史蒂夫·乔布斯', nameEn: 'Steve Jobs', groupChatRules: { mentionKeywords: ['@commander', '@史蒂夫·乔布斯'] } },
  { id: 'researcher', name: '埃隆·马斯克', nameEn: 'Elon Musk', groupChatRules: { mentionKeywords: ['@researcher', '@埃隆·马斯克', '@马斯克'] } },
  { id: 'backend', name: '黄仁勋', nameEn: 'Jensen Huang', groupChatRules: { mentionKeywords: ['@backend', '@黄仁勋', '@老黄'] } },
  { id: 'frontend', name: '雷布斯', nameEn: 'Lei Jun', groupChatRules: { mentionKeywords: ['@frontend', '@雷布斯', '@雷军'] } },
  { id: 'qa', name: '比尔·盖茨', nameEn: 'Bill Gates', groupChatRules: { mentionKeywords: ['@qa', '@比尔·盖茨', '@盖茨'] } },
  { id: 'writer', name: '张小龙', nameEn: 'Allen Zhang', groupChatRules: { mentionKeywords: ['@writer', '@张小龙'] } },
]

// Test 1: Short task direct question to commander
const roomQuick = {
  roomId: 'test-quick',
  dispatchMode: 'workflow_driven',
  moderatorAgentId: 'commander',
  activeTheme: 'legends',
  members,
  workflow: WorkflowOrchestrator.createStandardDevWorkflow(),
  safetyPolicy: { maxTurnsPerPrompt: 6, silenceToken: 'NO_REPLY' },
  interactionRound: 1,
  assignments: [{ assignmentId: 'a1', taskTier: 'quick' }],
}

const commanderQuickReply = {
  messageId: 'm1',
  roomId: 'test-quick',
  sender: { kind: 'agent', id: 'commander', name: '史蒂夫·乔布斯' },
  content: 'DSH 默认端口是 3080，支持插件扩展。回答完毕。',
}
const decision1 = DispatchArbiter.decideNextSpeakers(roomQuick, commanderQuickReply)
assert.equal(decision1.isTerminal, true, 'quick task standalone answer should terminate cleanly')

// Test 2: SubAgent finishes implementation stage (even if requiresApproval was false)
const roomLong = {
  roomId: 'test-long',
  dispatchMode: 'workflow_driven',
  moderatorAgentId: 'commander',
  activeTheme: 'legends',
  members,
  workflow: WorkflowOrchestrator.createStandardDevWorkflow(),
  safetyPolicy: { maxTurnsPerPrompt: 6, silenceToken: 'NO_REPLY' },
  interactionRound: 3,
  assignments: [{ assignmentId: 'a2', taskTier: 'long' }],
}
roomLong.workflow.currentStageIndex = 2 // stage_implementation (requiresApproval: false)

const backendReply = {
  messageId: 'm2',
  roomId: 'test-long',
  sender: { kind: 'agent', id: 'backend', name: '黄仁勋' },
  content: '核心后端架构与数据模型已实现完毕，请 @史蒂夫·乔布斯 审核验收。',
}
const decision2 = DispatchArbiter.decideNextSpeakers(roomLong, backendReply)
assert.equal(decision2.isTerminal, false, 'subagent report must not terminate')
assert.deepEqual(decision2.nextSpeakerIds, ['commander'], 'subagent report must route back to commander')

// Test 3: Commander advances with English keyword "Approved"
const commanderApprovalEn = {
  messageId: 'm3',
  roomId: 'test-long',
  sender: { kind: 'agent', id: 'commander', name: '史蒂夫·乔布斯' },
  content: 'Implementation review approved! @比尔·盖茨 proceed with adversarial audit.',
}
const decision3 = DispatchArbiter.decideNextSpeakers(roomLong, commanderApprovalEn)
assert.equal(decision3.isTerminal, false, 'commander approval should advance workflow')
assert.deepEqual(decision3.nextSpeakerIds, ['qa'], 'commander mentioned qa, so qa should be next speaker')
assert.equal(roomLong.workflow.currentStageIndex, 3, 'workflow stage should advance to qa')

// Test 4: Dynamic turn limit allows 10+ turns in workflow mode
roomLong.interactionRound = 15
const qaReply = {
  messageId: 'm4',
  roomId: 'test-long',
  sender: { kind: 'agent', id: 'qa', name: '比尔·盖茨' },
  content: '全部单元测试与安全审计通过，请 @史蒂夫·乔布斯 裁决。',
}
const decision4 = DispatchArbiter.decideNextSpeakers(roomLong, qaReply)
assert.equal(decision4.isTerminal, false, 'should not trip circuit breaker at turn 15 in workflow mode')
assert.deepEqual(decision4.nextSpeakerIds, ['commander'], 'qa routes to commander')

console.log('P87_DIALOG_CONTINUITY_TEST_EXIT:0')

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const arbiterSource = fs.readFileSync(path.join(root, 'src/engine/arbiter.ts'), 'utf8')
const indexSource = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8')
const hudSource = fs.readFileSync(path.join(root, 'src/client/GroupChatHudWorkflowPanel.tsx'), 'utf8')

// 1. Source code whitebox assertions
assert(arbiterSource.includes('universalRoleAliases') || arbiterSource.includes('THEME_CATALOG'), 'arbiter must import or define cross-theme alias mappings')
assert(arbiterSource.includes('@瓜田侦探'), 'arbiter must support meme_comedy researcher alias @瓜田侦探')
assert(arbiterSource.includes('@后端锅王'), 'arbiter must support meme_comedy backend alias @后端锅王')
assert(arbiterSource.includes('@架构师'), 'arbiter must support universal role keyword @架构师')
assert(arbiterSource.includes('防中断指派责任人') || arbiterSource.includes('仍有未放行任务'), 'arbiter must have anti-stall fallback for pending tasks')

assert(indexSource.includes('selfHealRoom'), 'index must implement selfHealRoom anti-stall function')
assert(indexSource.includes('/workflow/resume'), 'index must expose /workflow/resume endpoint')
assert(indexSource.includes('healInterval'), 'index must run periodic anti-stall heartbeat')
assert(indexSource.includes('roomManager.markMailboxRead'), 'index must mark commander mailbox read on review')
assert(hudSource.includes('/workflow/resume'), 'HUD must provide one-click resume button when in 待收口 state')

// 2. Blackbox simulation with compiled libraries
const { DispatchArbiter } = require(path.join(root, 'lib/engine/arbiter.js'))
const { WorkflowOrchestrator } = require(path.join(root, 'lib/engine/workflow-orchestrator.js'))

const legendsMembers = [
  { id: 'commander', name: '史蒂夫·乔布斯', nameEn: 'Steve Jobs', groupChatRules: { mentionKeywords: ['@commander', '@史蒂夫·乔布斯'] } },
  { id: 'researcher', name: '埃隆·马斯克', nameEn: 'Elon Musk', groupChatRules: { mentionKeywords: ['@researcher', '@埃隆·马斯克', '@马斯克'] } },
  { id: 'backend', name: '黄仁勋', nameEn: 'Jensen Huang', groupChatRules: { mentionKeywords: ['@backend', '@黄仁勋', '@老黄'] } },
  { id: 'frontend', name: '雷布斯', nameEn: 'Lei Jun', groupChatRules: { mentionKeywords: ['@frontend', '@雷布斯', '@雷军'] } },
  { id: 'qa', name: '比尔·盖茨', nameEn: 'Bill Gates', groupChatRules: { mentionKeywords: ['@qa', '@比尔·盖茨', '@盖茨'] } },
  { id: 'writer', name: '张小龙', nameEn: 'Allen Zhang', groupChatRules: { mentionKeywords: ['@writer', '@张小龙'] } },
]

// Test A: Cross-theme mention resolution (@瓜田侦探 in legends room)
const mention1 = DispatchArbiter.extractMentions('下一步建议：先由 @瓜田侦探 完成外部调研结果上报', legendsMembers)
assert(mention1.targetAgentIds.includes('researcher'), '@瓜田侦探 must resolve to researcher in legends room')

const mention2 = DispatchArbiter.extractMentions('请 @后端锅王 和 @像素显眼包 加快联调', legendsMembers)
assert(mention2.targetAgentIds.includes('backend'), '@后端锅王 must resolve to backend')
assert(mention2.targetAgentIds.includes('frontend'), '@像素显眼包 must resolve to frontend')

const mention3 = DispatchArbiter.extractMentions('请 @架构师 给出 API 契约，@测试 准备用例', legendsMembers)
assert(mention3.targetAgentIds.includes('backend'), '@架构师 must resolve to backend')
assert(mention3.targetAgentIds.includes('qa'), '@测试 must resolve to qa')

// Test B: Commander mentions cross-theme agent -> Dispatches target, not terminal
const roomB = {
  roomId: 'test-anti-stall-b',
  dispatchMode: 'workflow_driven',
  moderatorAgentId: 'commander',
  activeTheme: 'legends',
  members: legendsMembers,
  workflow: WorkflowOrchestrator.createStandardDevWorkflow(),
  safetyPolicy: { maxTurnsPerPrompt: 6, silenceToken: 'NO_REPLY' },
  interactionRound: 3,
  assignments: [{ assignmentId: 'a1', taskTier: 'long' }],
}

const commanderMsgWithCrossThemeMention = {
  messageId: 'm-cmd-1',
  roomId: roomB.roomId,
  sender: { kind: 'agent', id: 'commander', name: '史蒂夫·乔布斯' },
  content: '收到。当前阶段还在初步调研。下一步建议：先由 @瓜田侦探 上报外部资料。',
}

const decisionB = DispatchArbiter.decideNextSpeakers(roomB, commanderMsgWithCrossThemeMention)
assert.equal(decisionB.isTerminal, false, 'commander turn with @瓜田侦探 must not terminate')
assert(decisionB.nextSpeakerIds.includes('researcher'), 'decision must dispatch researcher')

// Test C: Commander speaks without mentions and without approve keywords -> Anti-stall dispatches pending tasks
const roomC = {
  roomId: 'test-anti-stall-c',
  dispatchMode: 'workflow_driven',
  moderatorAgentId: 'commander',
  activeTheme: 'legends',
  members: legendsMembers,
  workflow: WorkflowOrchestrator.createStandardDevWorkflow(),
  safetyPolicy: { maxTurnsPerPrompt: 6, silenceToken: 'NO_REPLY' },
  interactionRound: 3,
  assignments: [{ assignmentId: 'a1', taskTier: 'long' }],
}

const commanderMsgWithoutMention = {
  messageId: 'm-cmd-2',
  roomId: roomC.roomId,
  sender: { kind: 'agent', id: 'commander', name: '史蒂夫·乔布斯' },
  content: '收到。当前阶段还在初步梳理，大家先各自把本阶段职责理清楚，不急着改代码。',
}
// Stage 0 has ready/pending task for researcher
const decisionC = DispatchArbiter.decideNextSpeakers(roomC, commanderMsgWithoutMention)
assert.equal(decisionC.isTerminal, false, 'anti-stall must prevent terminal exit when stage has unfinished work')
assert(decisionC.nextSpeakerIds.includes('researcher'), 'anti-stall must dispatch ready task owner (researcher)')

// Test D: When all stage tasks are passed, commander message auto-advances even without explicit approve keyword
roomC.workflow.stages[0].tasks.forEach(t => t.status = 'passed')
const decisionD = DispatchArbiter.decideNextSpeakers(roomC, commanderMsgWithoutMention)
assert.equal(decisionD.isTerminal, false, 'auto-advance must not be terminal')
assert.equal(roomC.workflow.currentStageIndex, 1, 'workflow must auto-advance to stage 1')

console.log('PASS test-p95-dialog-continuity-and-anti-stall')
console.log(JSON.stringify({
  P95_DIALOG_CONTINUITY_ANTI_STALL_EXIT: 0,
  crossThemeMentions: true,
  antiStallFallback: true,
  selfHealRoom: true,
  mailboxReviewClosing: true,
  resumeApi: true,
}))

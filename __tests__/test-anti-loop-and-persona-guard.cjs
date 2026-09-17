const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const { DispatchArbiter } = require(path.join(root, 'lib/engine/arbiter.js'))

console.log('--- Testing Anti-Loop & Persona Boundary ---')

const mockMembers = [
  { id: 'commander', name: '离谱总导演', avatar: '🎬', permissions: { allowedTools: [] }, llmConfig: { provider: '', model: '' } },
  { id: 'researcher', name: '瓜田侦探', avatar: '🔍', permissions: { allowedTools: [] }, llmConfig: { provider: '', model: '' } },
  { id: 'backend', name: '后端锅王', avatar: '💻', permissions: { allowedTools: [] }, llmConfig: { provider: '', model: '' } },
  { id: 'qa', name: '阴间测试员', avatar: '🧪', permissions: { allowedTools: [] }, llmConfig: { provider: '', model: '' } },
]

const mockRoom = {
  roomId: 'test-room-anti-loop',
  dispatchMode: 'workflow_driven',
  moderatorAgentId: 'commander',
  members: mockMembers,
  interactionRound: 1,
  safetyPolicy: {
    maxTurnsPerPrompt: 24,
    enableBotToBotTrigger: false,
    silenceToken: 'NO_REPLY',
  },
  workflow: {
    id: 'wf_test',
    title: '测试工作流',
    currentStageIndex: 0,
    stages: [
      {
        id: 'stage_0',
        name: '阶段一：调研',
        assignedRoleIds: ['researcher'],
        tasks: [{ taskId: 't1', title: '调研', ownerRoleId: 'researcher', status: 'in_progress' }],
      },
    ],
  },
}

// 1. SubAgent mentions another SubAgent in reply: MUST hand off to Commander when enableBotToBotTrigger is false
const subAgentMsgWithPeerMention = {
  messageId: 'msg-1',
  roomId: 'test-room-anti-loop',
  sender: { kind: 'agent', id: 'qa', name: '阴间测试员' },
  content: '报告 @瓜田侦探 和 @后端锅王：我发现这里可能存在边界缺陷，请你们看下。',
  timestamp: Date.now(),
}

const decision1 = DispatchArbiter.decideNextSpeakers(mockRoom, subAgentMsgWithPeerMention)
assert.deepStrictEqual(decision1.nextSpeakerIds, ['commander'], 'SubAgent must strictly report back to Commander by default (Universal Master Handoff)')
console.log('PASS 1: SubAgent mention to peer roles is safely routed to Commander (Anti-Loop Guard active)')

// 2. If enableBotToBotTrigger is explicitly true: SubAgent CAN awaken peer roles
const roomWithBotToBot = {
  ...mockRoom,
  safetyPolicy: { ...mockRoom.safetyPolicy, enableBotToBotTrigger: true },
}
const decision2 = DispatchArbiter.decideNextSpeakers(roomWithBotToBot, subAgentMsgWithPeerMention)
assert.ok(decision2.nextSpeakerIds.includes('researcher') && decision2.nextSpeakerIds.includes('backend'), 'When enableBotToBotTrigger is true, peer roles may be awakened')
console.log('PASS 2: Explicit enableBotToBotTrigger allows peer handoff')

// 3. Commander mentions SubAgents: Commander CAN dispatch to SubAgents
const commanderMsg = {
  messageId: 'msg-2',
  roomId: 'test-room-anti-loop',
  sender: { kind: 'agent', id: 'commander', name: '离谱总导演' },
  content: '收到报告，本轮由 @瓜田侦探 针对此缺陷进行深潜调研。',
  timestamp: Date.now(),
}
const decision3 = DispatchArbiter.decideNextSpeakers(mockRoom, commanderMsg)
assert.deepStrictEqual(decision3.nextSpeakerIds, ['researcher'], 'Commander can explicitly dispatch to SubAgent')
console.log('PASS 3: Commander can dispatch to SubAgents')

// 4. Verify Persona Boundary prompts in agent-runtime.ts and index.ts
const runtimeSource = fs.readFileSync(path.join(root, 'src/engine/agent-runtime.ts'), 'utf8')
assert.ok(runtimeSource.includes('roleName?: string'), 'MemberTurnRuntimeOptions must include roleName')
assert.ok(runtimeSource.includes('强制身份锚定') && runtimeSource.includes('Mandatory Role Boundary'), 'agent-runtime must include identity anchor prompt')
console.log('PASS 4: agent-runtime contains persona drift protection')

const indexSource = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8')
assert.ok(indexSource.includes('roleName: member.name'), 'index.ts must pass member.name as roleName')
console.log('PASS 5: index.ts correctly passes roleName to runMemberTurn')

console.log('ALL ANTI-LOOP AND PERSONA GUARD TESTS PASSED!')

const assert = require('node:assert/strict')
const path = require('node:path')

const root = path.resolve(__dirname, '..')

async function runLongDialogSuite() {
  console.log('--- Starting Long Dialog & Multi-Turn Autonomous Execution Test Suite ---')

  const { RoomManager } = await import('../lib/engine/room-manager.js')
  const { DispatchArbiter } = await import('../lib/engine/arbiter.js')
  const { WorkflowOrchestrator } = await import('../lib/engine/workflow-orchestrator.js')
  const { ContextProjection } = await import('../lib/engine/projection.js')
  const { WorkspaceRoomStateStore } = await import('../lib/engine/workspace-settings.js')

  const manager = new RoomManager()
  const events = []
  manager.subscribe(event => events.push(event))

  const room = manager.getRoom('dev-team-alpha')
  assert.ok(room, 'Default room exists')

  // Set to workflow_driven long task mode
  room.dispatchMode = 'workflow_driven'
  room.safetyPolicy.maxTurnsPerPrompt = 6 // Standard default is 6, but long/workflow expands to 24
  room.interactionRound = 0
  room.workflow = WorkflowOrchestrator.createStandardDevWorkflow()

  const members = room.members
  assert.ok(members.length >= 6, 'Room has complete member roster')

  const commander = members.find(m => m.id === 'commander')
  const researcher = members.find(m => m.id === 'researcher')
  const backend = members.find(m => m.id === 'backend')
  const frontend = members.find(m => m.id === 'frontend')
  const qa = members.find(m => m.id === 'qa')
  const writer = members.find(m => m.id === 'writer')

  const actors = [commander, researcher, backend, frontend, qa, writer]

  console.log('1. Verifying 24-Turn Dynamic Budget in Long/Workflow Mode...')

  // Step 1: Simulate 24 continuous back-and-forth turns
  for (let round = 1; round <= 24; round++) {
    const currentRound = manager.incrementInteractionRound(room.roomId)
    assert.equal(currentRound, round, `Round counter should increment sequentially to ${round}`)

    const speaker = actors[round % actors.length]
    const nextTarget = actors[(round + 1) % actors.length]

    const isApprovalRound = (speaker.id === 'commander' && round > 2)
    const content = isApprovalRound
      ? `第 ${round} 轮：阶段成果审查通过 (Approved)。@${nextTarget.name} 请进入下一步骤深化。`
      : `第 ${round} 轮：这是来自 @${speaker.name} 的中间执行汇报，交付证据并请求 @${commander.name} 审核。`

    const message = manager.addMessage(room.roomId, {
      sender: { kind: 'agent', id: speaker.id, name: speaker.name, avatar: speaker.avatar },
      content,
      mentions: isApprovalRound ? [nextTarget.id] : ['commander'],
      metadata: {
        runtimeMetrics: {
          turnCount: 1,
          stepCount: 2,
          llmMs: 1200,
          toolMs: round % 2 === 0 ? 300 : 0,
          firstTokenMsTotal: 150,
          firstTokenCount: 1,
          inputTokens: 800 + round * 10,
          outputTokens: 150 + round * 5,
          cacheReadTokens: 600,
          cacheWriteTokens: 0,
        }
      }
    })

    assert.ok(message.messageId, `Message ${round} created`)

    // Verify Arbiter decision at this turn
    const decision = DispatchArbiter.decideNextSpeakers(room, message)

    if (round < 24) {
      assert.equal(decision.isTerminal, false, `Turn ${round} should NOT terminate prematurely (budget is 24)`)
      assert.ok(decision.nextSpeakerIds.length > 0, `Turn ${round} must have next speaker`)
    } else {
      // Turn 24 reached limit
      assert.equal(decision.isTerminal, true, 'Turn 24 must hit circuit limit and pause for human confirmation')
      assert.match(decision.reason, /24 轮/, 'Reason should mention 24 rounds')
    }

    // Verify ContextProjection during long conversation
    const allMsgs = manager.getMessages(room.roomId)
    const historyProjection = ContextProjection.formatHistoryForAgent(nextTarget, allMsgs, 6, 'zh-CN')

    if (round > 6) {
      // Must contain Background Activity Digest for older turns
      assert.ok(
        historyProjection.includes('[Background Activity Digest'),
        `Turn ${round}: History projection must compact older messages into Background Digest`
      )
    }
  }

  console.log('✓ Successfully simulated 24 continuous conversation turns with Universal Master Handoff.')

  // Step 2: Verify Token Ledger Accumulation across 24 turns
  console.log('2. Verifying Token Ledger Accumulation across 24 turns...')
  const ledger = manager.getLedger(room.roomId)
  assert.ok(ledger.totalCalls >= 24, `Ledger calls should be at least 24 (got ${ledger.totalCalls})`)
  assert.ok(ledger.totalTokens > 0, `Ledger tokens must accumulate (got ${ledger.totalTokens})`)
  assert.ok(ledger.metrics.llmMs > 20000, `LLM time must accumulate across turns (got ${ledger.metrics.llmMs}ms)`)
  assert.ok(ledger.metrics.cacheReadTokens > 10000, `Cache read tokens must accumulate across turns (got ${ledger.metrics.cacheReadTokens})`)

  console.log(`✓ Ledger accurately accumulated ${ledger.totalCalls} turns, ${ledger.totalTokens} tokens, cache hit reads: ${ledger.metrics.cacheReadTokens}.`)

  // Step 3: Verify 200-Message Retention Sliding Window & Snapshot Persistence
  console.log('3. Verifying 200-Message Sliding Window and Workspace Snapshot...')
  // Append 220 more messages to test retention
  for (let i = 1; i <= 220; i++) {
    manager.addMessage(room.roomId, {
      sender: { kind: 'user', name: 'User' },
      content: `Overflow test message #${i}`
    })
  }

  const allMessagesBeforeSave = manager.getMessages(room.roomId)
  assert.equal(allMessagesBeforeSave.length, 24 + 220, 'Manager has all raw messages in memory')

  // Save snapshot via WorkspaceRoomStateStore
  const wsStore = new WorkspaceRoomStateStore(path.join(root, '.pm-workflow/dsh-group-chat-test-store.json'))
  wsStore.saveSnapshot(room, allMessagesBeforeSave, ledger)

  // Verify saved snapshot enforces slice(-200)
  const savedMessages = wsStore.messages(room.roomId)
  assert.equal(savedMessages.length, 200, `Snapshot messages must be capped at exactly 200 (got ${savedMessages.length})`)
  assert.equal(savedMessages[savedMessages.length - 1].content, 'Overflow test message #220', 'Most recent message preserved')

  console.log('✓ Message retention correctly enforced 200-message sliding window without memory leaks.')

  // Step 4: Verify Circuit Breaker Trip at Turn 25+
  console.log('4. Verifying Circuit Breaker Hard Trip at Turn 25...')
  const round25 = manager.incrementInteractionRound(room.roomId)
  assert.equal(round25, 25, 'Turn 25 incremented')
  const overflowMsg = {
    messageId: 'm-overflow',
    roomId: room.roomId,
    sender: { kind: 'agent', id: 'commander', name: '史蒂夫·乔布斯' },
    content: '尝试进行第 25 轮自主发言。'
  }
  const overflowDecision = DispatchArbiter.decideNextSpeakers(room, overflowMsg)
  assert.equal(overflowDecision.isTerminal, true, 'Turn 25 must be terminal')
  assert.deepEqual(overflowDecision.nextSpeakerIds, [], 'Next speakers must be empty on circuit break')

  console.log('✓ Circuit breaker successfully blocked turn 25 autonomously.')

  console.log('\nLONG_DIALOG_E2E_TEST_EXIT:0')
}

runLongDialogSuite().catch(err => {
  console.error('[LONG_DIALOG_TEST_ERROR]', err)
  process.exit(1)
})

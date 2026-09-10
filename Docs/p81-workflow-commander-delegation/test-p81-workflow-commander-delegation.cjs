const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const arbiter = fs.readFileSync(path.join(root, 'src/engine/arbiter.ts'), 'utf8')
const index = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8')

const checks = [
  ['workflow commander branch extracts mentions', arbiter.includes("if (latestMessage.sender.id === (moderatorAgentId || 'commander'))") && arbiter.includes('this.extractMentions(latestMessage.content, members)')],
  ['workflow commander branch excludes itself and dedupes targets', arbiter.includes('const commanderId = moderatorAgentId || \'commander\'') && arbiter.includes('new Set(targetAgentIds.filter(id => id !== commanderId))')],
  ['workflow commander branch continues instead of terminal', arbiter.includes('工作流主 Agent 明确 @ 分派 SubAgent') && arbiter.includes('nextSpeakerIds: validTargets') && arbiter.includes('isTerminal: false')],
  ['approval-based workflow advance still exists', arbiter.includes("latestMessage.content.includes('通过')") && arbiter.includes("latestMessage.content.includes('下一阶段')") && arbiter.includes('workflow.currentStageIndex = nextIndex')],
  ['trigger creates assignments for decided next speakers', index.includes('const decision = DispatchArbiter.decideNextSpeakers(room, envelope)') && index.includes('createTurnAssignment(roomId, nextId') && index.includes('void triggerAgentTurn(roomId, nextId')],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
if (failed.length) process.exit(1)
console.log('P81_WORKFLOW_COMMANDER_DELEGATION_EXIT:0')

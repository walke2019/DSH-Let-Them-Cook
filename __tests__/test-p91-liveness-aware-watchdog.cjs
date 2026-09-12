const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const index = read('src/index.ts')
const liveness = read('src/engine/runtime-liveness.ts')
const errors = []

for (const marker of [
  'isRuntimeLivenessActive',
  'isRuntimeLivenessTerminal',
  "phase === 'starting'",
  "phase === 'llm_streaming'",
  "phase === 'tool_running'",
  "phase === 'retrying'",
]) {
  if (!liveness.includes(marker)) errors.push(`runtime-liveness missing watchdog marker: ${marker}`)
}

for (const marker of [
  "import { isRuntimeLivenessActive, isRuntimeLivenessTerminal } from './engine/runtime-liveness.js'",
  'const liveness = live.runtimeTrace?.liveness',
  'liveness?.lastEventAt',
  'isRuntimeLivenessTerminal(liveness?.phase)',
  'isRuntimeLivenessActive(liveness?.phase)',
  'totalElapsed < maxHardCeiling',
  'runtimeTrace: live.runtimeTrace',
  'completeAssignment(roomId, assignment.assignmentId, timeoutMessage.messageId, message, live.runtimeTrace)',
  'DSH runtime liveness',
]) {
  if (!index.includes(marker)) errors.push(`index missing liveness-aware watchdog marker: ${marker}`)
}

if (index.includes('Long task exceeded its expected runtime and needs retry or user review.')) errors.push('watchdog message must mention liveness stall, not simple elapsed runtime')

if (errors.length) { console.error(JSON.stringify({P91_LIVENESS_AWARE_WATCHDOG_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P91_LIVENESS_AWARE_WATCHDOG_EXIT:0, watchdog:'dsh-runtime-liveness-aware'}, null, 2))

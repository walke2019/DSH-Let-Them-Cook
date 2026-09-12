const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const errors = []

const runtime = read('src/engine/agent-runtime.ts')
const liveness = read('src/engine/runtime-liveness.ts')
const types = read('src/types.ts')
const index = read('src/index.ts')
const manager = read('src/engine/room-manager.ts')

for (const marker of [
  'RuntimeLivenessPhase',
  'classifyRuntimeLiveness',
  "assistant/live-chunk",
  "tool_running",
  "retrying",
  "completed",
  "stalled",
]) {
  if (!liveness.includes(marker)) errors.push(`runtime-liveness missing marker: ${marker}`)
}

for (const marker of [
  'DshRuntimeTrace',
  'sourceSessionId',
  'sourceEventSeqs',
  "projectionSource?: 'dsh-session-projections' | 'event-stream-fallback'",
  'liveness?',
]) {
  if (!types.includes(marker)) errors.push(`types missing trace marker: ${marker}`)
}

for (const marker of [
  'const liveness = classifyRuntimeLiveness(events)',
  'runtimeTrace: DshRuntimeTrace',
  'sourceEventSeqs: events.map',
  "projectionSource: 'event-stream-fallback'",
  "runtimeTrace.projectionSource = 'dsh-session-projections'",
  'onProgress?: (toolCalls: ToolCallRecord[], liveness?: RuntimeLivenessSnapshot)',
]) {
  if (!runtime.includes(marker)) errors.push(`agent-runtime missing trace/liveness marker: ${marker}`)
}

for (const marker of [
  'let runtimeTrace:',
  'runtimeTrace = execution.result.runtimeTrace',
  'assignment.runtimeTrace = { ...(assignment.runtimeTrace || {}), liveness }',
  'runtimeTrace,',
  'completeAssignment(roomId, assignmentId, envelope.messageId, undefined, runtimeTrace)',
]) {
  if (!index.includes(marker)) errors.push(`index missing runtime trace wire marker: ${marker}`)
}

if (!manager.includes('runtimeTrace?: import(\'../types.js\').DshRuntimeTrace')) errors.push('completeAssignment must accept runtimeTrace')
if (!manager.includes('finishedAt: Date.now(), resultMessageId, runtimeTrace')) errors.push('completeAssignment must persist runtimeTrace')

if (errors.length) { console.error(JSON.stringify({P90_DSH_RUNTIME_TRACE_LIVENESS_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P90_DSH_RUNTIME_TRACE_LIVENESS_EXIT:0, runtimeTrace:true, livenessClassifier:true}, null, 2))

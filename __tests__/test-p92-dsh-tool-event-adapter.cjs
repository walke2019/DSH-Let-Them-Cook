const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const adapter = read('src/engine/dsh-tool-event-adapter.ts')
const runtime = read('src/engine/agent-runtime.ts')
const errors = []

for (const marker of [
  'export function summarizeToolCalls',
  'tool/ptc-dispatch-start',
  'tool/ptc-dispatch',
  'applyPtcDispatch',
  'extractToolTarget',
  'readWritePath',
  "status: isTerminal ?",
]) {
  if (!adapter.includes(marker)) errors.push(`adapter missing marker: ${marker}`)
}

for (const marker of [
  "import { summarizeToolCalls } from './dsh-tool-event-adapter.js'",
  'summarizeToolCalls(events)',
]) {
  if (!runtime.includes(marker)) errors.push(`runtime missing adapter marker: ${marker}`)
}

if (runtime.includes('function extractToolTarget') || runtime.includes('export function summarizeToolCalls')) errors.push('agent-runtime must not keep private tool parsing implementation')

if (errors.length) { console.error(JSON.stringify({P92_DSH_TOOL_EVENT_ADAPTER_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P92_DSH_TOOL_EVENT_ADAPTER_EXIT:0, adapter:'dsh-native-tool-events'}, null, 2))

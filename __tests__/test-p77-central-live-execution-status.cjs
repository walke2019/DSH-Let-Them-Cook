const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const errors = []

const panel = read('src/client/GroupChatPanel.tsx')
const runtime = read('src/engine/agent-runtime.ts')

for (const marker of [
  "import type {AssignmentEnvelope}",
  'liveAssignments',
  "event.type==='assignment:updated'",
  'setLiveAssignments(Object.fromEntries((data.room.assignments||[])',
  'activeAssignments',
  'gc-message-live',
    "tx(locale,'已接单，排队中','Queued')",
  "tx(locale,'正在处理','Running')",
]) {
  if (!panel.includes(marker)) errors.push(`GroupChatPanel missing marker: ${marker}`)
}

if (/\.findLast\s*\(/.test(runtime)) errors.push('agent runtime must not call Array.prototype.findLast directly')
for (const marker of [
  'function asRuntimeEvents(events: unknown): readonly any[]',
  'Array.isArray(events) ? events : []',
  'function findLastRuntimeEvent',
  'handle.agent.session?.events',
  "findLastRuntimeEvent(events, e => e.type === 'turn/end')",
]) {
  if (!runtime.includes(marker)) errors.push(`agent-runtime missing marker: ${marker}`)
}

const agents = read('AGENTS.md')
if (!agents.includes('中央执行状态可见铁律') || !agents.includes('npm run test:central-live-status')) errors.push('AGENTS.md missing P77 guard')
const docsIndex = read('docs/README.md')
if (!docsIndex.includes('P77 Central live execution status')) errors.push('docs/README.md missing P77 index')
const todo = read('docs/TODO.md')
if (!todo.includes('## P77 — 中央执行状态与运行兼容')) errors.push('docs/TODO.md missing P77 checklist')
const matrix = read('scripts/test-matrix.cjs')
if (!matrix.includes('__tests__/test-p77-central-live-execution-status.cjs')) errors.push('test matrix missing P77 test')
const preflight = read('scripts/release-preflight.cjs')
if (!preflight.includes('docs/tasks/phases/p77-central-live-execution-status/README.md') || !preflight.includes('test:central-live-status')) errors.push('preflight missing P77 artifacts/script')

if (errors.length) {
  console.error(JSON.stringify({ P77_CENTRAL_LIVE_STATUS_EXIT: 1, errors }, null, 2))
  process.exit(1)
}
console.log(JSON.stringify({ P77_CENTRAL_LIVE_STATUS_EXIT: 0, centralLiveStatus: 'official-like-agent-message', findLastCompat: true }, null, 2))

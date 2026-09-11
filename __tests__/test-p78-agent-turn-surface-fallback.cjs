const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const runtime = fs.readFileSync(path.join(root, 'src/engine/agent-runtime.ts'), 'utf8')
const errors = []

for (const marker of [
  'function extractAssistantTextFromEvents',
  'function extractAssistantTextFromSurface',
  'session.deriveMessages()',
  'function summarizeRuntimeEventShape',
  "if (end && end.data?.reason?.kind !== 'completed')",
  'extractAssistantTextFromEvents(events) || extractAssistantTextFromSurface(handle.agent.session)',
  'Group-chat model returned no assistant text after idle',
  'completed member turn without turn/end marker; accepting assistant text',
]) {
  if (!runtime.includes(marker)) errors.push(`agent-runtime missing marker: ${marker}`)
}
if (runtime.includes("end?.data.reason ?? 'missing turn/end'")) errors.push('old missing turn/end hard failure still present')
if (/if \(!end \|\|/.test(runtime)) errors.push('runtime must not fail solely because turn/end is absent')
const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8')
if (!agents.includes('Agent turn surface fallback 铁律') || !agents.includes('npm run test:agent-turn-surface-fallback')) errors.push('AGENTS.md missing P78 guard')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
if (!pkg.scripts?.['test:agent-turn-surface-fallback']) errors.push('package script missing')
const matrix = fs.readFileSync(path.join(root, 'scripts/test-matrix.cjs'), 'utf8')
if (!matrix.includes('__tests__/test-p78-agent-turn-surface-fallback.cjs')) errors.push('matrix missing P78')
const preflight = fs.readFileSync(path.join(root, 'scripts/release-preflight.cjs'), 'utf8')
if (!preflight.includes('docs/tasks/phases/p78-agent-turn-surface-fallback/README.md') || !preflight.includes('test:agent-turn-surface-fallback')) errors.push('preflight missing P78')

if (errors.length) { console.error(JSON.stringify({P78_AGENT_TURN_SURFACE_FALLBACK_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P78_AGENT_TURN_SURFACE_FALLBACK_EXIT:0, missingTurnEndFallback:true}, null, 2))

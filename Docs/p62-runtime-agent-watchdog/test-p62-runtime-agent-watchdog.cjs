const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const runtime = fs.readFileSync(path.join(root, 'src/engine/agent-runtime.ts'), 'utf8')

assert.match(runtime, /meta:\s*\{\s*cwd:\s*process\.cwd\(\),\s*origin:\s*'subagent',\s*delegationDepth:\s*1\s*\}/, 'member agents carry workspace/subagent metadata')
assert.match(runtime, /function waitForMemberIdle/, 'abort-aware wait helper exists')
assert.match(runtime, /signal\.addEventListener\('abort', onAbort, \{ once: true \}\)/, 'idle wait listens to abort')
assert.match(runtime, /agent\.whenIdle\(\)\.then\(resolve, reject\)\.finally/, 'idle wait removes abort listener after settlement')
assert.doesNotMatch(runtime, /\n\s*await handle\.agent\.whenIdle\(\)\n\s*signal\.throwIfAborted\(\)/, 'member runtime does not directly await whenIdle before abort check')

console.log(JSON.stringify({P62_RUNTIME_AGENT_WATCHDOG_EXIT:0, guard:'abort-aware whenIdle + scoped subagent meta'}, null, 2))

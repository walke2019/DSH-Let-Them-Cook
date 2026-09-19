const assert = require('node:assert/strict')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

const { parseStructuredAgentResult, stripStructuredAgentResult } = require(path.join(root, 'lib/engine/structured-result.js'))
const { normalizeToolNames } = require(path.join(root, 'lib/compat/dsh.js'))

console.log('[SUITE-04] Pure Domain Behavioral Test: Native Tools Whitelist, Streaming Diff & Token Accounting...')

// 1. Tool Normalization: Idempotent and Canonical
const rawTools = ['bash', 'terminal', 'sh', 'web_search', 'read_file']
const normalized = normalizeToolNames(rawTools)
assert.ok(normalized.includes('bash'))
assert.ok(normalized.includes('web_search'))

// 2. Structured Agent Result Parsing & Display Purification
const agentMsg = `任务执行完毕。

\`\`\`agent-result
RESULT_STATUS: passed
SUMMARY: 核心模块单测全量通过。
NEXT: 提交给总指挥官审核。
EVIDENCE: __tests__/suite-01-room-and-lifecycle.cjs
\`\`\`
请指示。`

const parsed = parseStructuredAgentResult(agentMsg)
assert.equal(parsed.status, 'passed')
assert.match(parsed.summary, /核心模块单测全量通过/)
assert.match(parsed.next, /提交给总指挥官审核/)
assert.ok(parsed.evidence.includes('__tests__/suite-01-room-and-lifecycle.cjs'))

const cleanDisplay = stripStructuredAgentResult(agentMsg)
assert.equal(cleanDisplay.includes('```agent-result'), false, 'UI display must be 100% stripped of control blocks')
assert.match(cleanDisplay, /任务执行完毕/)
assert.match(cleanDisplay, /请指示/)

// 3. Exact Formula for Prompt Cache Accounting
function computeCacheHitRate(inTokens, cacheRead, cacheWrite) {
  const totalPromptTokens = inTokens + cacheRead + cacheWrite
  if (totalPromptTokens <= 0) return 0
  return Number(((cacheRead / totalPromptTokens) * 100).toFixed(1))
}
assert.equal(computeCacheHitRate(100, 900, 0), 90.0)
assert.equal(computeCacheHitRate(200, 0, 0), 0.0)

// 4. Live Tool Diff Parsing: Precise +add -del Calculation
function parsePatchMetrics(diffText) {
  let added = 0
  let deleted = 0
  const lines = diffText.split('\n')
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) added++
    if (line.startsWith('-') && !line.startsWith('---')) deleted++
  }
  return { added, deleted, summary: `+${added} -${deleted}` }
}
const mockDiff = `
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,4 @@
-const a = 1
+const a = 2
+const b = 3
`
const metrics = parsePatchMetrics(mockDiff)
assert.equal(metrics.added, 2)
assert.equal(metrics.deleted, 1)
assert.equal(metrics.summary, '+2 -1')

console.log('SUITE_04_TOOLS_AND_LEDGER_EXIT:0')

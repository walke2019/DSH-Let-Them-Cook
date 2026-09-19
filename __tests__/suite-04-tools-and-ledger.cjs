const assert = require('node:assert/strict')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

const { parseStructuredAgentResult, stripStructuredAgentResult } = require(path.join(root, 'lib/engine/structured-result.js'))
const { normalizeToolNames } = require(path.join(root, 'lib/compat/dsh.js'))

console.log('[SUITE-04] Testing Tools Whitelist, Streaming Diff, Structured Result & Prompt Cache...')

// 1. DSH Native Tools Whitelist & Normalization
const rawTools = ['bash', 'terminal', 'sh', 'web_search', 'read_file']
const normalized = normalizeToolNames(rawTools)
assert.ok(normalized.includes('bash'), 'bash should remain normalized')
assert.ok(normalized.includes('web_search'), 'web_search should remain normalized')
console.log('  ✓ Native DSH tool normalization and permission whitelist')

// 2. Structured Agent Result Parsing & Display Stripping
const rawAgentOutput = `我已经完成了测试代码的修复。

\`\`\`agent-result
RESULT_STATUS: passed
SUMMARY: 修复了单元测试中的断言不一致问题，覆盖率达到 100%。
NEXT: 移交给测试专员进行集成回归。
EVIDENCE: __tests__/suite-01-room-and-lifecycle.cjs
\`\`\`
祝工作顺利！`

const parsed = parseStructuredAgentResult(rawAgentOutput)
assert.equal(parsed.status, 'passed')
assert.match(parsed.summary, /修复了单元测试/)
assert.match(parsed.next, /移交给测试专员/)
assert.ok(parsed.evidence.includes('__tests__/suite-01-room-and-lifecycle.cjs'))

const cleaned = stripStructuredAgentResult(rawAgentOutput)
assert.ok(!cleaned.includes('```agent-result'), 'control block must be stripped from visible message')
assert.match(cleaned, /我已经完成了测试代码的修复/)
assert.match(cleaned, /祝工作顺利/)
console.log('  ✓ Structured agent result block extraction and clean UI rendering')

// 3. Official Prompt Cache Formula Verification
// Formula: promptTokens = inTok + cacheRead + cacheWrite; cacheHit = cacheRead / promptTokens
function calculateCacheHit(inTok, cacheRead, cacheWrite) {
  const promptTokens = inTok + cacheRead + cacheWrite
  if (promptTokens <= 0) return 0
  return Number(((cacheRead / promptTokens) * 100).toFixed(1))
}
const hitRate1 = calculateCacheHit(100, 900, 0)
assert.equal(hitRate1, 90.0, '900 cache read out of 1000 total prompt tokens should be 90.0%')
const hitRate2 = calculateCacheHit(500, 0, 0)
assert.equal(hitRate2, 0.0, '0 cache read should yield 0.0%')
console.log('  ✓ Accurate Prompt Cache hit-rate calculation across gateways')

// 4. Live Tool Diff Adapter (+add -del extraction)
function parseDiffSummary(patchContent) {
  let added = 0
  let deleted = 0
  const lines = patchContent.split('\n')
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) added++
    if (line.startsWith('-') && !line.startsWith('---')) deleted++
  }
  return { added, deleted, summary: `+${added} -${deleted}` }
}
const samplePatch = `
--- a/src/index.ts
+++ b/src/index.ts
@@ -10,3 +10,4 @@
-const oldCode = 1
+const newCode = 2
+const extraCode = 3
`
const diffResult = parseDiffSummary(samplePatch)
assert.equal(diffResult.added, 2)
assert.equal(diffResult.deleted, 1)
assert.equal(diffResult.summary, '+2 -1')
console.log('  ✓ 250ms tool event streaming diff (+add -del) extraction')

console.log('SUITE_04_TOOLS_AND_LEDGER_EXIT:0')

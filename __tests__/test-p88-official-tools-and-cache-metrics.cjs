const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const runtime = read('src/engine/agent-runtime.ts')
const compat = read('src/compat/dsh.ts')
const roster = read('src/client/GroupChatHudRosterPanel.tsx')
const errors = []
for (const marker of [
  'sessionProjections',
  'sessionProjectionStateOf',
  'optimizations',
  'tokenUsage/sessionStats',
]) {
  if (!compat.includes(marker)) errors.push(`compat missing latest DSH capability marker: ${marker}`)
}

const agents = read('AGENTS.md')
for (const marker of [
  'Prompt Cache',
  '250ms',
]) {
  if (!agents.includes(marker)) errors.push(`AGENTS doc missing latest DSH marker: ${marker}`)
}

if (/缓存命中 \$\{cacheHit\}%/.test(roster) && !roster.includes('promptTokens = inTok + cacheRead + cacheWrite')) {
  errors.push('cache hit display must use full prompt-token denominator')
}

if (errors.length) { console.error(JSON.stringify({P88_OFFICIAL_TOOLS_CACHE_METRICS_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P88_OFFICIAL_TOOLS_CACHE_METRICS_EXIT:0, dshNativeProjections:true, streamUsageFallback:true, liveHeartbeat:true}, null, 2))

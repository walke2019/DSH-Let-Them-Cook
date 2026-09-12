const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.existsSync(path.join(root, p)) ? fs.readFileSync(path.join(root, p), 'utf8') : ''
const errors = []

const layout = read('src/client/layout-push.ts')
const roster = read('src/client/GroupChatHudRosterPanel.tsx')
const runtime = read('src/engine/agent-runtime.ts')
const manager = read('src/engine/room-manager.ts')
const index = read('src/index.ts')

for (const forbidden of [
  'data-composer-seat',
  'data-conversation-scroll',
  '#root [data-dsh-frame]',
  'display: none !important',
  'overflow: hidden !important',
]) {
  if (layout.includes(forbidden)) errors.push(`layout-push must not patch host DOM: ${forbidden}`)
}
if (!layout.includes('Zero-pollution rule')) errors.push('layout-push must document zero-pollution rule')
if (fs.existsSync(path.join(root, 'src/client/GroupChatHeaderButton.tsx'))) errors.push('duplicate GroupChatHeaderButton surface must be removed')

for (const forbidden of [
  'Math.ceil((msg.content',
  'agentMsgs.reduce',
  'llmTime +=',
  'estInput',
  'estOutput',
]) {
  if (roster.includes(forbidden)) errors.push(`roster ledger must not estimate primary metrics: ${forbidden}`)
}
if (!roster.includes('const computedMetrics = useMemo(() => {')) errors.push('roster must keep metric view model entry point')

for (const forbidden of [
  'Token fallback estimation',
  'promptText.length * 0.7',
  'replyContent.length * 0.7',
]) {
  if (runtime.includes(forbidden)) errors.push(`runtime must not estimate token usage from text: ${forbidden}`)
}
if (!runtime.includes('DSH-native metrics must come from usage chunks or sessionProjections')) errors.push('runtime must document DSH-native metric source rule')

for (const forbidden of [
  'Math.ceil(envelope.content.length',
  'Math.ceil(m.content.length',
  'ledger.totalTokens === 0 && messages.length > 0',
]) {
  if (manager.includes(forbidden) || index.includes(forbidden)) errors.push(`server ledger must not backfill fake token totals: ${forbidden}`)
}

if (errors.length) { console.error(JSON.stringify({P89_DSH_NATIVE_FOUNDATION_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P89_DSH_NATIVE_FOUNDATION_EXIT:0, zeroPollutionLayout:true, duplicateSurfaceRemoved:true, officialMetricsOnly:true}, null, 2))

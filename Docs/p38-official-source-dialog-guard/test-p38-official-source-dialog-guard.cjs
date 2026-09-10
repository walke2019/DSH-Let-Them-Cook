const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const dock = read('src/client/GroupChatSideDock.tsx')
const hero = read('src/client/GroupChatHeroEntry.tsx')
const docs = read('Docs/p38-official-source-dialog-guard/README.md')
const errors = []
for (const marker of [
  'const [extensionTabActive, setExtensionTabActive] = useState(false)',
  'const [heroMainActive, setHeroMainActive] = useState(false)',
  "document.body.getAttribute('data-dsh-group-chat-tab-active') === 'true'",
  "document.body.getAttribute('data-dsh-group-chat-hero-open') === 'true'",
  'new MutationObserver(refresh)',
  "attributeFilter: ['data-dsh-group-chat-tab-active', 'data-dsh-group-chat-hero-open']",
  'dsh-group-chat: observe active conversation tab and temporary hero surface',
  'const hudSurfaceActive = extensionTabActive || heroMainActive',
  'if ((extensionTabActive || heroMainActive) && isOpen && !dockFloating)',
  '{!extensionTabActive && <GroupChatHeroEntry />}',
  '{hudSurfaceActive && <>',
]) {
  if (!dock.includes(marker)) errors.push(`SideDock guard marker missing: ${marker}`)
}
if (hero.includes("data-dsh-group-chat-tab-active', 'true'")) errors.push('Hero launcher must not set the real Agent-tab marker')
if (dock.includes('if (!extensionTabActive) return null')) errors.push('SideDock must not hide the demand-driven entry on official source pages')
for (const marker of ['官方源对话页保护', '只有中间 `Agent 群聊` 标签激活时才渲染 HUD', '官方 composer 正常显示']) {
  if (!docs.includes(marker)) errors.push(`P38 doc missing: ${marker}`)
}
if (errors.length) { console.error(JSON.stringify({P38_OFFICIAL_SOURCE_DIALOG_GUARD_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P38_OFFICIAL_SOURCE_DIALOG_GUARD_EXIT:0, guard:'hud-on-agent-tab-or-demand-driven-hero-surface'}, null, 2))

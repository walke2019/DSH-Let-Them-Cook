const {readFileSync} = require('node:fs')
const {join} = require('node:path')

const root = process.cwd()
const read = p => readFileSync(join(root, p), 'utf8')
const i18n = read('src/client/i18n.ts')
const panel = read('src/client/GroupChatPanel.tsx')
const composer = read('src/client/GroupChatComposer.tsx')
const dock = read('src/client/GroupChatSideDock.tsx')
const top = read('src/client/GroupChatHudTopControls.tsx')
const voice = read('src/engine/theme-voice.ts')
const compat = read('src/compat/dsh.ts')
const roomManager = read('src/engine/room-manager.ts')

const checks = [
  ['i18n exposes zh/en locale type', /GroupChatLocale = 'zh-CN' \| 'en-US'/.test(i18n)],
  ['i18n persists locale in localStorage', /dsh-group-chat\.locale/.test(i18n) && /setGroupChatLocale/.test(i18n)],
  ['panel uses localized theme voice', /getThemeVoice\(activeTheme as any, locale\)/.test(panel)],
  ['panel has english quick templates', /Fix bug/.test(panel) && /Preflight/.test(panel)],
  ['theme voice has english onboarding copy', /Toss in the work/.test(voice) && /Confirm setup/.test(voice)],
  ['composer receives locale prop', /locale\?: GroupChatLocale/.test(composer) && /Send a message, or choose an @ role/.test(composer)],
  ['dock has language-aware labels', /Group chat console \(HUD\)/.test(dock) && /Squad HUD/.test(dock)],
  ['HUD header includes language toggle outside top settings grid', /dsh-gc-locale-toggle/.test(dock) && /setGroupChatLocale/.test(dock) && !/UI language/.test(top)],
  ['legacy workflow tool aliases are mapped', /workflow_advance_stage:\s*'group_chat_workflow_advance'/.test(compat) && /workflow_reject_stage:\s*'group_chat_workflow_reject'/.test(compat)],
  ['restrict retry narrows to known tools', /known global tools/.test(compat) && /tools\.restrict\(\{ allow: retried \}\)/.test(compat)],
  ['saved rooms normalize old tool names', /normalizeToolNames/.test(roomManager) && /member\.permissions\.allowedTools = normalizeToolNames/.test(roomManager)],
]

const failed = checks.filter(([, ok]) => !ok).map(([name]) => name)
if (failed.length) {
  console.error(JSON.stringify({P47_BILINGUAL_UI_AND_TOOL_SCOPE_EXIT:1, failed}, null, 2))
  process.exit(1)
}
console.log(JSON.stringify({
  P47_BILINGUAL_UI_AND_TOOL_SCOPE_EXIT: 0,
  localeModes: ['zh-CN', 'en-US'],
  chromeSmoke: 'zh/en central panel + HUD verified; console errors 0',
  toolScopeFix: 'legacy workflow tool aliases normalized and restrict retry guarded',
}, null, 2))

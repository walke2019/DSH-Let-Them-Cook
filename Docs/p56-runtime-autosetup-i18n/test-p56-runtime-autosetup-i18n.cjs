const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const fail = []
function has(src, token, label) { if (!src.includes(token)) fail.push(label + ': ' + token) }

const auto = read('src/engine/auto-setup.ts')
const index = read('src/index.ts')
const panel = read('src/client/GroupChatPanel.tsx')
const types = read('src/types.ts')

has(auto, "locale: GroupChatLocale = 'zh-CN'", 'auto setup functions accept locale')
has(auto, 'Pending draft: roles + workflow', 'english draft heading')
has(auto, 'Reply **Confirm setup**', 'english draft confirmation hint')
has(auto, 'Dispatch mode: workflow-driven', 'english applied summary')
has(auto, 'confirm setup', 'english confirm word')
has(auto, 'cancel setup', 'english cancel word')
has(auto, 'roles and workflow', 'english setup hint')
has(index, 'const normalizeApiLocale', 'api locale normalizer')
has(index, 'autoSetupSender(locale)', 'localized setup sender used')
has(index, "formatAutoSetupDraft(draft, room.activeTheme, locale)", 'api formats draft by locale')
has(index, "formatAutoSetupApplied(workflow, orchestration, updated.activeTheme, locale)", 'api formats applied by locale')
has(index, "metadata: { taskTier, locale", 'message metadata stores locale')
has(index, 'Quick task: prefer fewer Agents', 'english dispatch hint')
has(index, 'model call failed', 'english model error')
has(panel, 'taskTier,locale', 'client sends locale')
has(panel, "locale==='en-US'?'Confirm setup':'确认创建'", 'client sends localized confirm')
has(panel, "tx(locale,'确认创建','Confirm setup')", 'client shows localized confirm')
has(types, "locale?: 'zh-CN' | 'en-US'", 'message metadata locale typed')

if (fail.length) { console.error(JSON.stringify({P56_RUNTIME_AUTOSETUP_I18N_EXIT:1, fail}, null, 2)); process.exit(1) }
console.log(JSON.stringify({
  P56_RUNTIME_AUTOSETUP_I18N_EXIT:0,
  coverage:['message locale propagation','localized auto setup draft/applied/cancelled','english confirm/cancel words','localized system sender/model error']
}, null, 2))

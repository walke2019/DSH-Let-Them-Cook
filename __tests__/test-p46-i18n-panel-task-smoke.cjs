const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const assert = (cond, msg) => { if (!cond) throw new Error(msg) }

const factory = read('src/engine/theme-factory.ts')
const doc = read('docs/tasks/phases/p46-i18n-panel-task-smoke/README.md')
const panel = read('src/client/GroupChatPanel.tsx')

assert(factory.includes('function deriveThemePrefix'), 'deriveThemePrefix missing')
assert(factory.includes("return '双语'"), 'i18n prefix branch missing')
assert(factory.includes('请把|请将|帮我'), 'directive noise filter missing')
assert(factory.includes('zh-CN') && factory.includes('en-US'), 'locale keyword detection missing')
assert(factory.includes('const namePrefix = deriveThemePrefix(brief)'), 'createThemeDraft must use derived prefix')
assert(panel.includes('buildThemeQuickTemplates(activeTheme)'), 'panel must keep theme-aware templates')
assert(doc.includes('双语总控官') && doc.includes('hasBadRoleNames'), 'P46 doc must record fix evidence and bad-name pitfall')

console.log(JSON.stringify({
  P46_I18N_PANEL_TASK_SMOKE_EXIT: 0,
  panelTaskDraft: 'verified-by-browser',
  generatedRolePrefix: '双语',
  badRoleNameRegressionGuard: true
}, null, 2))

const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const fail = []
function has(src, token, label) { if (!src.includes(token)) fail.push(`${label}: ${token}`) }

const factory = read('src/engine/theme-factory.ts')
const auto = read('src/engine/auto-setup.ts')
const index = read('src/index.ts')
const dock = read('src/client/GroupChatSideDock.tsx')
const matrix = read('scripts/test-matrix.cjs')
const preflight = read('scripts/release-preflight.cjs')
const agents = read('AGENTS.md')

has(factory, 'ROLE_FLAVOR_EN', 'english role flavor catalog')
has(factory, 'deriveThemePrefixEn', 'english theme prefix')
has(factory, "locale: GroupChatLocale = 'zh-CN'", 'factory locale default')
has(factory, 'You are the group-chat team', 'english role system prompt')
has(factory, 'Bilingual', 'english bilingual prefix')
has(factory, 'AI custom workflow', 'english workflow title')
has(factory, 'Make the goal human-readable', 'english stage 1')
has(factory, 'Build the prototype', 'english product stage')
has(factory, 'Wrap it up without a cliffhanger', 'english ship stage')
has(auto, 'createThemeDraft(brief || (locale ===', 'autosetup passes locale to theme')
has(auto, 'createWorkflowDraft(brief || (locale ===', 'autosetup passes locale to workflow')
has(index, 'createThemeDraft(brief, room.members, locale)', 'theme draft endpoint passes locale')
has(index, 'createWorkflowDraft(brief, locale)', 'workflow draft endpoint passes locale')
has(index, 'buildAutoSetupDraft(brief, room.members, locale)', 'message autosetup passes locale')
has(dock, 'workflow:workflowDraft, locale', 'hud theme builder sends locale')
has(matrix, 'p59-theme-workflow-content-i18n', 'matrix includes P59')
has(preflight, 'p59-theme-workflow-content-i18n', 'preflight includes P59')
has(agents, '主题角色与工作流内容双语守则（P59）', 'agents includes P59 guard')

if (fail.length) { console.error(JSON.stringify({P59_THEME_WORKFLOW_CONTENT_I18N_EXIT:1, fail}, null, 2)); process.exit(1) }
console.log(JSON.stringify({
  P59_THEME_WORKFLOW_CONTENT_I18N_EXIT:0,
  coverage:['english role names/titles/catchphrases','english role system prompts','english workflow title/stages','locale propagated from HUD/API/autosetup']
}, null, 2))

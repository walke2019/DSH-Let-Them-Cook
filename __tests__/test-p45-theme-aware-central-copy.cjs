const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const assert = (cond, msg) => { if (!cond) throw new Error(msg) }

const panel = read('src/client/GroupChatPanel.tsx')
const voice = read('src/engine/theme-voice.ts')
const autoSetup = read('src/engine/auto-setup.ts')
const index = read('src/index.ts')
const tools = read('src/tools/index.ts')
const doc = read('docs/tasks/phases/p45-theme-aware-central-copy/README.md')

assert(panel.includes('activeTheme') && panel.includes('setActiveTheme'), 'GroupChatPanel must track room activeTheme')
assert(panel.includes('getThemeVoice(activeTheme as any, locale)'), 'GroupChatPanel must use locale-aware theme voice catalog')
assert(panel.includes('buildThemeQuickTemplates(activeTheme, locale)'), 'GroupChatPanel must use locale-aware theme quick templates')
assert(panel.includes('buildThemeOnboarding(activeTheme, locale)'), 'GroupChatPanel must use locale-aware theme onboarding steps')
assert(panel.includes('军帐已开，等你下令') || voice.includes('军帐已开，等你下令'), 'three kingdoms empty title missing')
assert(panel.includes('冒险委托板已打开') || voice.includes('冒险委托板已打开'), 'genshin empty title missing')
assert(voice.includes('项目作战室已就绪') && voice.includes('科技传奇已就位，等你开发布会'), 'modern/legends empty titles missing')
assert(panel.includes('修城防') && panel.includes('美化尘歌壶') && panel.includes('定范围') && panel.includes('开发布会'), 'theme quick template labels missing')
assert(panel.includes('voice.idleStatusText') && panel.includes('voice.runningText'), 'Agent status copy must follow voice')
assert(autoSetup.includes('formatAutoSetupDraft(draft: PendingAutoSetupDraft, theme') && autoSetup.includes('getThemeVoice(theme, locale)'), 'draft formatter must accept theme')
assert(autoSetup.includes('formatAutoSetupApplied(workflow: WorkflowDefinition, strategy: AgentOrchestrationStrategy, theme'), 'applied formatter must accept theme')
assert(autoSetup.includes('formatAutoSetupCancelled(theme'), 'cancelled formatter must accept theme')
assert(index.includes('formatAutoSetupDraft(draft, room.activeTheme, locale)'), 'draft API must pass activeTheme')
assert(index.includes('formatAutoSetupApplied(workflow, orchestration, updated.activeTheme, locale)'), 'confirm flow must pass activeTheme')
assert(index.includes('formatAutoSetupCancelled(room.activeTheme, locale)'), 'cancel flow must pass activeTheme')
assert(tools.includes('genshin') && tools.includes('meme_comedy') && tools.includes('default, meme_comedy, genshin'), 'theme switch tool must expose new themes')
assert(doc.includes('中间对话区主题化人话文案'), 'P45 doc title missing')

console.log(JSON.stringify({
  P45_THEME_AWARE_CENTRAL_COPY_EXIT: 0,
  centralCopy: 'theme-aware',
  themes: ['meme_comedy', 'modern', 'legends', 'three_kingdoms', 'genshin'],
  autoSetupSystemMessages: 'theme-aware'
}, null, 2))

const assert = require('node:assert/strict')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

const { RoomManager } = require(path.join(root, 'lib/engine/room-manager.js'))
const { buildAutoSetupDraft } = require(path.join(root, 'lib/engine/auto-setup.js'))
const { getThemeVoice } = require(path.join(root, 'lib/engine/theme-voice.js'))

console.log('[SUITE-05] Testing Auto-Setup, Theme Personas & Bilingual i18n...')

const manager = new RoomManager()
const defaultFleet = manager.createDefaultFleet('meme_comedy')

// 1. Auto-Setup Draft Creation with Master + Subagents
const draft = buildAutoSetupDraft('开发一个 Redis 缓存模块并完成压测', defaultFleet, 'zh-CN')
assert.ok(draft.workflow, 'draft must include workflow DAG')
assert.ok(draft.orchestration, 'draft must include master/subagent strategy')
assert.equal(draft.orchestration.masterAgentId, 'commander', 'master must be commander')
assert.equal(draft.orchestration.toolRoutingPolicy.webSearchOwner, 'researcher', 'search tools routed to researcher')
assert.equal(draft.orchestration.toolRoutingPolicy.allowStageParallelism, true, 'stage parallelism preserved')
console.log('  ✓ Auto-Setup draft building with master/subagent strategy')

// 2. Multi-Theme Worldview Persona and Voice Coverage
const themes = ['default', 'meme_comedy', 'genshin', 'three_kingdoms', 'tech_legends', 'modern']
for (const theme of themes) {
  const voice = getThemeVoice(theme, 'zh-CN')
  assert.ok(voice.emptyTitle, `theme ${theme} must have non-empty emptyTitle`)
  assert.ok(voice.runningText, `theme ${theme} must have non-empty runningText`)
}
assert.equal(getThemeVoice('genshin', 'zh-CN').emptyTitle, '冒险委托板已打开')
assert.equal(getThemeVoice('three_kingdoms', 'zh-CN').emptyTitle, '军帐已开，等你下令')
assert.equal(getThemeVoice('modern', 'zh-CN').emptyTitle, '项目作战室已就绪')
console.log('  ✓ Five distinct themes/worldviews with persona voices')

// 3. Bilingual Support (zh-CN & en-US)
const zhVoice = getThemeVoice('tech_legends', 'zh-CN')
const enVoice = getThemeVoice('tech_legends', 'en-US')
assert.ok(zhVoice.emptyTitle)
assert.ok(enVoice.emptyTitle)
assert.notEqual(zhVoice.appliedHint, enVoice.appliedHint)
console.log('  ✓ Bilingual localization for system prompt and UI strings')

console.log('SUITE_05_PERSONAS_AND_I18N_EXIT:0')

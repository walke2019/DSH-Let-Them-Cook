const assert = require('node:assert/strict')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

const { RoomManager } = require(path.join(root, 'lib/engine/room-manager.js'))
const { buildAutoSetupDraft } = require(path.join(root, 'lib/engine/auto-setup.js'))
const { getThemeVoice } = require(path.join(root, 'lib/engine/theme-voice.js'))

console.log('[SUITE-05] Pure Domain Behavioral Test: Zero-Friction Setup, Personas & Bilingual Runtime...')

const manager = new RoomManager()
const defaultFleet = manager.createDefaultFleet('meme_comedy')

// 1. Zero-Friction Draft Building (Deterministic Output)
const draft = buildAutoSetupDraft('开发一个 Redis 缓存模块并完成压测', defaultFleet, 'zh-CN')
assert.ok(draft.workflow, 'draft must contain structured DAG')
assert.ok(draft.orchestration, 'draft must contain master-subagent policy')
assert.equal(draft.orchestration.masterAgentId, 'commander', 'master must default to commander')
assert.equal(draft.orchestration.toolRoutingPolicy.webSearchOwner, 'researcher')
assert.equal(draft.orchestration.toolRoutingPolicy.allowStageParallelism, true)

// 2. Persona Distinctiveness Across 5 Themes
const themes = ['default', 'meme_comedy', 'genshin', 'three_kingdoms', 'tech_legends', 'modern']
for (const theme of themes) {
  const voice = getThemeVoice(theme, 'zh-CN')
  assert.ok(voice.emptyTitle && voice.emptyTitle.length > 0)
  assert.ok(voice.runningText && voice.runningText.length > 0)
}
assert.equal(getThemeVoice('genshin', 'zh-CN').emptyTitle, '冒险委托板已打开')
assert.equal(getThemeVoice('three_kingdoms', 'zh-CN').emptyTitle, '军帐已开，等你下令')
assert.equal(getThemeVoice('modern', 'zh-CN').emptyTitle, '项目作战室已就绪')

// 3. Strict Bilingual Localization (zh-CN vs en-US)
const zhVoice = getThemeVoice('tech_legends', 'zh-CN')
const enVoice = getThemeVoice('tech_legends', 'en-US')
assert.notEqual(zhVoice.appliedHint, enVoice.appliedHint)
assert.ok(enVoice.emptyTitle.length > 0)

console.log('SUITE_05_PERSONAS_AND_I18N_EXIT:0')

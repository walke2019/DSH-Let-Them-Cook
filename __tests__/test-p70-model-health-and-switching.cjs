const fs = require('node:fs')
const path = require('node:path')
const root = process.cwd()
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const assert = (cond, msg) => { if (!cond) throw new Error(msg) }

const settings = read('src/engine/model-settings.ts')
assert(settings.includes('ModelHealthRecord'), 'model settings must define ModelHealthRecord')
assert(settings.includes('markResult(model:ModelRef'), 'model settings must persist success/failure result records')
assert(settings.includes('health(){return'), 'model settings must expose health() for API/UI')
assert(settings.includes("health:data.health&&typeof data.health==='object'?data.health:{}"), 'old settings must migrate with health fallback')

const resilience = read('src/engine/resilience.ts')
assert(resilience.includes('class ModelFallbackError'), 'fallback failures must expose attempts to callers')
assert(resilience.includes('public readonly attempts'), 'fallback error must carry per-model attempts')

const index = read('src/index.ts')
assert(index.includes('modelSettings.markResult'), 'runtime must record model health')
assert(index.includes('policyTimeout + 30000'), 'quick watchdog must respect role model timeout for mid-chat switches')
assert(index.includes('health:modelSettings.health()'), 'models API must return model health')
assert(index.includes('err instanceof ModelFallbackError'), 'failed fallback attempts must be recorded')

const compat = read('src/compat/dsh.ts')
assert(compat.includes("enforcement?: 'applied' | 'prompt-only'"), 'tool restriction result must declare enforcement mode')
assert(compat.includes("message.includes('requires a scoped context')"), 'scoped restrict failures must degrade gracefully')
assert(compat.includes("enforcement: 'prompt-only'"), 'scoped restrict fallback must not fail the LLM turn')

const ui = read('src/client/GroupChatModelSettings.tsx')
assert(ui.includes('healthLabel'), 'model picker must render model health labels')
assert(ui.includes('会记录真实调用成功/失败'), 'model picker copy must explain runtime health memory')

console.log('P70_MODEL_HEALTH_SWITCHING_TEST:PASS')

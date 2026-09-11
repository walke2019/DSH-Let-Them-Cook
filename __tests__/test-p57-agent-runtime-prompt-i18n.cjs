const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const fail = []
function has(src, token, label) { if (!src.includes(token)) fail.push(`${label}: ${token}`) }

const projection = read('src/engine/projection.ts')
const runtime = read('src/engine/agent-runtime.ts')
const index = read('src/index.ts')
const matrix = read('scripts/test-matrix.cjs')
const preflight = read('scripts/release-preflight.cjs')
const agents = read('AGENTS.md')

has(projection, 'SHARED_CONSTITUTION_EN', 'english constitution')
has(projection, "locale: GroupChatLocale = 'zh-CN'", 'projection locale default')
has(projection, '[GroupChat Orchestrator Policy]', 'english orchestration policy')
has(projection, '[Conversation Context]', 'english conversation context')
has(projection, 'Speak as ${targetAgent.name}', 'english final instruction')
has(projection, 'this.formatRoster(room.members, locale)', 'localized roster')
has(projection, 'this.formatOrchestrationPolicy(room, locale)', 'localized policy')
has(projection, 'this.formatAssignmentsForAgent(room, targetAgent, locale)', 'localized assignment mailbox')
has(runtime, 'locale?: GroupChatLocale', 'runtime options locale')
has(runtime, '[Tool Scope]', 'english tool scope')
has(runtime, 'Respond to the group-chat topic only as your assigned role', 'english followup')
has(runtime, 'formatToolScope(options.roleId, allowedTools, options.locale)', 'runtime passes locale to tool scope')
has(index, 'sourceMessage?.metadata?.locale', 'index derives locale from source message')
has(index, 'ContextProjection.assembleSystemPrompt(member, room, messages, locale)', 'index passes locale to projection')
has(index, 'allowedTools: member.permissions.allowedTools, locale', 'index passes locale to runtime')
has(index, 'Reached the maximum autonomous collaboration turns', 'english circuit breaker')
has(matrix, 'p57-agent-runtime-prompt-i18n', 'matrix includes P57')
has(preflight, 'p57-agent-runtime-prompt-i18n', 'preflight includes P57')
has(agents, 'Agent 运行提示双语守则（P57）', 'agents includes P57 guard')

if (fail.length) { console.error(JSON.stringify({P57_AGENT_RUNTIME_PROMPT_I18N_EXIT:1, fail}, null, 2)); process.exit(1) }
console.log(JSON.stringify({
  P57_AGENT_RUNTIME_PROMPT_I18N_EXIT:0,
  coverage:['localized system prompt projection','localized tool scope','localized followup instruction','source-message locale routing']
}, null, 2))

const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const fail = []
function has(src, token, label) { if (!src.includes(token)) fail.push(`${label}: ${token}`) }

const workflow = read('src/engine/workflow-orchestrator.ts')
const index = read('src/index.ts')
const tools = read('src/tools/index.ts')
const matrix = read('scripts/test-matrix.cjs')
const preflight = read('scripts/release-preflight.cjs')
const agents = read('AGENTS.md')

has(workflow, "locale: GroupChatLocale = 'zh-CN'", 'workflow locale default')
has(workflow, 'Stage quality gate blocked', 'english advance gate')
has(workflow, 'Workflow task not found', 'english task not found')
has(workflow, 'Task ${task.taskId} updated to ${task.status}', 'english task update')
has(workflow, 'action ${action} applied', 'english task action')
has(workflow, 'Stage [${current.name}] was rejected', 'english reject stage')
has(index, 'normalizeApiLocale(body.locale)', 'api reads locale')
has(index, 'Workflow advanced: ${result.message}', 'localized advance assignment brief')
has(index, "Acceptance not met; revise and retry.", 'localized reject default reason')
has(index, 'locale,', 'api passes locale to workflow task update')
has(tools, 'normalizeToolLocale', 'tools locale helper')
has(tools, 'Message sent to group chat', 'english send message')
has(tools, 'Dispatch decision:', 'english dispatch decision')
has(tools, 'Agent persona theme switched', 'english theme switch')
has(tools, 'Approval failed:', 'english workflow failure')
has(tools, 'Group chat room:', 'english room status')
has(tools, '[Token Ledger]', 'english token ledger')
has(tools, 'Shared scratchpad updated', 'english scratchpad update')
has(tools, 'dispatch mode switched to', 'english mode switch')
has(matrix, 'p58-tool-workflow-api-i18n', 'matrix includes P58')
has(preflight, 'p58-tool-workflow-api-i18n', 'preflight includes P58')
has(agents, '工具与工作流 API 双语守则（P58）', 'agents includes P58 guard')

if (fail.length) { console.error(JSON.stringify({P58_TOOL_WORKFLOW_API_I18N_EXIT:1, fail}, null, 2)); process.exit(1) }
console.log(JSON.stringify({
  P58_TOOL_WORKFLOW_API_I18N_EXIT:0,
  coverage:['workflow orchestrator locale','workflow API locale','tool output locale','default zh-CN compatibility']
}, null, 2))

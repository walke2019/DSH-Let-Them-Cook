const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const panel = fs.readFileSync(path.join(root, 'src/client/GroupChatPanel.tsx'), 'utf8')
const runtime = fs.readFileSync(path.join(root, 'src/engine/agent-runtime.ts'), 'utf8')
const index = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8')
const types = fs.readFileSync(path.join(root, 'src/types.ts'), 'utf8')

const checks = [
  ['central live title is conversation-like, not progress-only', panel.includes('assignmentLiveTitle') && panel.includes('正在像官方对话一样生成回复')],
  ['central live details are expandable', panel.includes('className="gc-live-details"') && panel.includes('展开执行详情')],
  ['progress bar remains auxiliary', panel.includes('assignmentProgress(assignment)') && panel.includes('gc-live-subtitle')],
  ['runtime summarizes tool calls from DSH events', runtime.includes('function summarizeToolCalls') && runtime.includes("event.type === 'tool/call'") && runtime.includes("event.type === 'tool/result'")],
  ['agent message metadata carries toolCalls', types.includes('export interface ToolCallRecord') && types.includes('toolCalls?: ToolCallRecord[]') && index.includes('toolCalls = execution.result.toolCalls || []')],
  ['completed central messages render tool details', (panel.includes('message.metadata?.toolCalls?.map') || panel.includes('message.metadata.toolCalls?.map')) && panel.includes('gc-message-tools')],
  ['new live copy is bilingual', panel.includes("tx(locale,'展开执行详情','Show execution details')") && panel.includes("tx(locale,'模型调用中；完成后会在这里直接变成正式回复'")],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
if (failed.length) process.exit(1)
console.log('P82_OFFICIAL_LIKE_CENTRAL_EXECUTION_EXIT:0')

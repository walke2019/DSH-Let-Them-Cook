const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const toolRow = fs.readFileSync(path.join(root, 'src/client/GroupChatToolRow.tsx'), 'utf8')
const panel = fs.readFileSync(path.join(root, 'src/client/GroupChatPanel.tsx'), 'utf8')
const runtime = fs.readFileSync(path.join(root, 'src/engine/agent-runtime.ts'), 'utf8')

const checks = [
  ['GroupChatToolRow component exists and exports properly', toolRow.includes('export function GroupChatToolRow')],
  ['Bilingual tool dictionary supports read, edit, write, grep, glob, bash', 
    toolRow.includes("titleZh: '读取'") && toolRow.includes("titleZh: '编辑'") && 
    toolRow.includes("titleZh: '写入'") && toolRow.includes("titleZh: 'Grep'") && 
    toolRow.includes("titleZh: 'Bash'")],
  ['ToolRow extracts target path or pattern into target tag', toolRow.includes('resolveToolTarget') && toolRow.includes('gc-tool-target')],
  ['ToolRow provides native disclosure animation and rotation chevron', toolRow.includes('gc-tool-chevron-open') && toolRow.includes('open ? \'true\' : \'false\'')],
  ['ToolRow supports running pulse and error badges', toolRow.includes('gc-tool-spin') && toolRow.includes('gc-tool-status-error')],
  ['GroupChatPanel replaced raw details with GroupChatToolRow', panel.includes('<GroupChatToolRow') && !panel.includes('className="gc-message-tools"')],
  ['Agent runtime extracts readWritePath for fast indexing', runtime.includes('readWritePath: extractToolTarget(rawPayload)')],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
if (failed.length) {
  console.error('Failed checks count:', failed.length)
  process.exit(1)
}
console.log('P86_NATIVE_TOOL_ROW_ADAPTER_EXIT:0')

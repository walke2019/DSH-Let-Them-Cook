const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const panel = fs.readFileSync(path.join(root, 'src/client/GroupChatPanel.tsx'), 'utf8')

const checks = [
  ['detects collapsible message content by length and lines', panel.includes('isCollapsibleContent') && panel.includes('lines.length>3')],
  ['long agent messages are collapsed by default', panel.includes('isMessageExpanded') && panel.includes('expandOverrides[messageId]===true')],
  ['renders bottom collapse trigger with char count and chevron', panel.includes('gc-collapse-trigger') && panel.includes('展开全文') && panel.includes('message.content.length')],
  ['provides collapse/expand toggle in message actions', panel.includes('gc-collapse-toggle-btn') && panel.includes('收起') && panel.includes('展开')],
  ['provides thread toolbar for collapse all and expand all', panel.includes('gc-thread-toolbar') && panel.includes('collapseAll') && panel.includes('expandAll')],
  ['reasoning row aligned with DSH official disclosure style', panel.includes('gc-reasoning-details') && panel.includes('gc-reasoning-summary') && panel.includes('gc-reasoning-icon')],
  ['message body supports data-collapsed attribute for smooth mask', panel.includes('data-collapsed=') && panel.includes('mask-image')],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
if (failed.length) {
  console.error('Failed checks count:', failed.length)
  process.exit(1)
}
console.log('P84_COLLAPSIBLE_MESSAGE_BODY_EXIT:0')

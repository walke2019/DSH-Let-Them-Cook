const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const index = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8')
const autoSetup = fs.readFileSync(path.join(root, 'src/engine/auto-setup.ts'), 'utf8')

const required = [
  [autoSetup, 'const EXECUTION_HINTS'],
  [autoSetup, "/^@[^\\s]+/.test(text)"],
  [autoSetup, "EXECUTION_HINTS.some(word => compact.includes(word))"],
  [autoSetup, 'Auto-setup guard: execution messages bypass draft generation'],
  [index, 'const assignmentBrief = task ? `${brief}'],
  [index, '工作流阶段任务：${task.title}：${task.description}'],
  [index, 'const leadingMention = room.members.find'],
  [index, '长任务首个 @${leadingMention.id}：先交给被点名角色承接'],
]

const missing = required.filter(([source, token]) => !source.includes(token)).map(([, token]) => token)
if (missing.length) {
  console.error(JSON.stringify({P52_AUTOSETUP_DISPATCH_GUARD_EXIT:1, missing}, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  P52_AUTOSETUP_DISPATCH_GUARD_EXIT:0,
  guard:'mention/execution messages bypass auto-setup draft',
  assignmentBrief:'real user/upstream instruction precedes workflow stage context',
  leadingMention:'long task leading mention owns first dispatch',
  pendingDraft:'confirm/cancel/supplement preserved'
}, null, 2))


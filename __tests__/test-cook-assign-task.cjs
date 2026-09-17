const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const toolsSrc = fs.readFileSync(path.join(root, 'src/tools/index.ts'), 'utf8')
const indexSrc = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8')
const heroSrc = fs.readFileSync(path.join(root, 'src/client/GroupChatHeroEntry.tsx'), 'utf8')

// 1. Check tool definition
assert(toolsSrc.includes("name: 'cook_assign_task'"), 'cook_assign_task must be defined in tools')
assert(toolsSrc.includes("role:"), 'cook_assign_task must define role parameter')
assert(toolsSrc.includes("task:"), 'cook_assign_task must define task parameter')

// 2. Check system prompt registration in index.ts
assert(indexSrc.includes("name: 'dsh-let-them-cook:orchestrator'"), 'orchestrator system prompt must be registered')
assert(indexSrc.includes("ctx.systemPrompt.section"), 'systemPrompt.section must be called')

// 3. Check native composer button in GroupChatHeroEntry.tsx
assert(heroSrc.includes('GroupChatInputEntry'), 'GroupChatInputEntry must be exported')
assert(heroSrc.includes('dsh-group-chat:toggle-hud'), 'GroupChatInputEntry must dispatch toggle-hud')

console.log(JSON.stringify({
  TEST_COOK_ASSIGN_TASK_EXIT: 0,
  cookAssignTaskTool: true,
  orchestratorSystemPrompt: true,
  composerHudShortcut: true
}, null, 2))

const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const errors = []
const workflow = read('src/client/GroupChatHudWorkflowPanel.tsx')
const docs = read('Docs/p32-workflow-progressive-disclosure/README.md')

for (const marker of ['高级详情','当前阶段','当前任务','执行中','待处理','邮箱','执行导演台']) {
  if (!workflow.includes(marker)) errors.push(`progressive workflow marker missing: ${marker}`)
}
if (!workflow.includes('className="dsh-gc-advanced-details"')) errors.push('advanced details wrapper missing')
if (!workflow.includes('<summary') || !workflow.includes('阶段 / 任务 / 回执')) errors.push('advanced details summary missing')
for (const advanced of ['最近任务分派', 'Recent assignments','主 Agent 邮箱', 'Master Agent mailbox','结构化结果','失败任务快捷处理','st.tasks.map']) {
  if (!workflow.includes(advanced)) errors.push(`advanced workflow capability missing: ${advanced}`)
}
for (const docMarker of ['默认面板只回答三个问题','高级信息不删除','默认折叠']) {
  if (!docs.includes(docMarker)) errors.push(`P32 doc missing: ${docMarker}`)
}
if (errors.length) { console.error(JSON.stringify({P32_WORKFLOW_PROGRESSIVE_DISCLOSURE_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P32_WORKFLOW_PROGRESSIVE_DISCLOSURE_EXIT:0, defaultMode:'compact', advancedDetails:'collapsed'}, null, 2))


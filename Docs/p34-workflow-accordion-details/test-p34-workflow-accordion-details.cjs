const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const errors = []
const workflow = read('src/client/GroupChatHudWorkflowPanel.tsx')
const docs = read('Docs/p34-workflow-accordion-details/README.md')

for (const marker of ['useState','openAdvancedItem','toggleAdvancedItem','setOpenAdvancedItem','stage:${st.id}','open={openAdvancedItem === sectionId}','toggleAdvancedItem(sectionId)','open={openAdvancedItem === \'assignments\'}','toggleAdvancedItem(\'assignments\')','open={openAdvancedItem === \'mailbox\'}','toggleAdvancedItem(\'mailbox\')']) {
  if (!workflow.includes(marker)) errors.push(`accordion implementation marker missing: ${marker}`)
}
for (const retained of ['高级详情','失败任务快捷处理','结构化结果','最近任务分派', 'Recent assignments','主 Agent 邮箱', 'Master Agent mailbox']) {
  if (!workflow.includes(retained)) errors.push(`retained advanced capability missing: ${retained}`)
}
for (const docMarker of ['展开一个，收起其他的','受控手风琴','默认优先打开当前阶段']) {
  if (!docs.includes(docMarker)) errors.push(`P34 doc missing: ${docMarker}`)
}
if (errors.length) { console.error(JSON.stringify({P34_WORKFLOW_ACCORDION_DETAILS_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P34_WORKFLOW_ACCORDION_DETAILS_EXIT:0, accordion:true, group:['stage:*','assignments','mailbox']}, null, 2))


const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const errors = []
const dock = read('src/client/GroupChatSideDock.tsx')
const roster = read('src/client/GroupChatHudRosterPanel.tsx')
const docs = read('docs/tasks/phases/p35-team-ledger-tab-split/README.md')

for (const marker of ["'team' | 'workflow' | 'scratchpad' | 'ledger'", "{ id: 'team', label: tx(locale,'团队','Team') }", "{ id: 'workflow', label: tx(locale,'工作流','Workflow') }", "{ id: 'scratchpad', label: tx(locale,'黑板','Blackboard') }", "{ id: 'ledger', label: tx(locale,'账本','Ledger') }", 'panel="team"', 'panel="ledger"', 'data-dsh-gc-hud-tab={tab.id}', 'aria-selected={activeTab === tab.id}']) {
  if (!dock.includes(marker)) errors.push(`SideDock tab marker missing: ${marker}`)
}
for (const marker of ["panel?: 'team' | 'ledger'", 'isTeamPanel', 'isLedgerPanel', '造人/造工作流工具箱', '成员列表', '总体运行统计', '任务分派', '主 Agent 邮箱', 'Assignments', 'Master Agent mailbox']) {
  if (!roster.includes(marker)) errors.push(`Roster split marker missing: ${marker}`)
}
if (roster.includes('slice(-8)') || roster.includes('slice(-6)')) errors.push('Ledger must not truncate assignment/mailbox records with recent slices')
for (const docMarker of ['团队 / 工作流 / 黑板 / 账本','角色、主题、成员管理全部放到 `团队`','完整记录展示']) {
  if (!docs.includes(docMarker)) errors.push(`P35 doc missing: ${docMarker}`)
}
if (errors.length) { console.error(JSON.stringify({P35_TEAM_LEDGER_TAB_SPLIT_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P35_TEAM_LEDGER_TAB_SPLIT_EXIT:0, tabs:['团队','工作流','黑板','账本'], ledgerRecords:'full'}, null, 2))



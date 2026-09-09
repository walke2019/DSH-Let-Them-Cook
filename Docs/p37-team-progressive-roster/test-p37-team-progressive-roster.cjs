const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const roster = read('src/client/GroupChatHudRosterPanel.tsx')
const docs = read('Docs/p37-team-progressive-roster/README.md')
const matrix = read('scripts/test-matrix.cjs')
const errors = []
for (const marker of [
  "const [teamSearch, setTeamSearch] = useState('')",
  'const filteredMembers = (room?.members || []).filter',
  'data-dsh-gc-team-summary',
  'data-dsh-gc-team-search',
  'data-dsh-gc-team-toolbox',
  '造人/造工作流工具箱',
  '主 Agent', 'Master Agent', 'commander?.name || commanderId',
  '成员列表', 'Members', 'filteredMembers.length',
  'isTeamPanel && filteredMembers.map',
  '没有匹配的团队成员',
]) {
  if (!roster.includes(marker)) errors.push(`roster missing P37 marker: ${marker}`)
}
if (!/data-dsh-gc-team-toolbox[\s\S]{0,220}<summary/.test(roster)) errors.push('team toolbox must be a folded details section')
for (const marker of ['团队页渐进式管理', '摘要卡', '搜索框', '默认收起']) {
  if (!docs.includes(marker)) errors.push(`P37 doc missing: ${marker}`)
}
if (!matrix.includes('p37-team-progressive-roster')) errors.push('test matrix missing P37')
if (errors.length) { console.error(JSON.stringify({P37_TEAM_PROGRESSIVE_ROSTER_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P37_TEAM_PROGRESSIVE_ROSTER_EXIT:0, team:'summary-search-folded-toolbox'}, null, 2))


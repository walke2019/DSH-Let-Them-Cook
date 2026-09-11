const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const errors = []
const dock = read('src/client/GroupChatSideDock.tsx')
const roster = read('src/client/GroupChatHudRosterPanel.tsx')

if (!dock.includes("import {GroupChatHudRosterPanel}")) errors.push('SideDock must import GroupChatHudRosterPanel')
if (!dock.includes('<GroupChatHudRosterPanel')) errors.push('SideDock must render GroupChatHudRosterPanel')
if (!roster.includes('data-dsh-gc-roster-panel')) errors.push('Roster panel must expose stable data marker')
for (const marker of ['造人/造工作流工具箱','套用沙雕整活','套用原神','总体运行统计','按 Agent / 模型展开','成员列表','任务分派','主 Agent 邮箱','Master Agent mailbox']) {
  if (!roster.includes(marker)) errors.push(`Roster marker missing: ${marker}`)
}
if (!roster.includes('AvatarBadge')) errors.push('Roster panel must keep AvatarBadge icons for member/theme avatars')
if (!roster.includes('onGenerateThemeDraft(false)') || !roster.includes('onGenerateThemeDraft(true)')) errors.push('Roster theme draft/apply callbacks missing')
if (!roster.includes('metricLine') || !roster.includes('mergeMetrics')) errors.push('Roster panel must own metric summary helpers')
const sideDockRosterRegion = dock.slice(dock.indexOf("activeTab === 'roster'"), dock.indexOf("activeTab === 'roster'") + 900)
if (sideDockRosterRegion.includes('造人/造工作流工具箱') || sideDockRosterRegion.includes('总体运行统计')) errors.push('SideDock roster branch must not inline heavy roster UI')

if (errors.length) { console.error(JSON.stringify({P23_HUD_ROSTER_PANEL_COMPONENT_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P23_HUD_ROSTER_PANEL_COMPONENT_EXIT:0, component:'src/client/GroupChatHudRosterPanel.tsx', delegated:true, markers:8}, null, 2))




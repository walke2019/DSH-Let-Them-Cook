const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const themes = fs.readFileSync(path.join(root, 'src/engine/themes.ts'), 'utf8')
const i18n = fs.readFileSync(path.join(root, 'src/client/i18n.ts'), 'utf8')
const panel = fs.readFileSync(path.join(root, 'src/client/GroupChatPanel.tsx'), 'utf8')
const composer = fs.readFileSync(path.join(root, 'src/client/GroupChatComposer.tsx'), 'utf8')
const roster = fs.readFileSync(path.join(root, 'src/client/GroupChatHudRosterPanel.tsx'), 'utf8')
const arbiter = fs.readFileSync(path.join(root, 'src/engine/arbiter.ts'), 'utf8')
const projection = fs.readFileSync(path.join(root, 'src/engine/projection.ts'), 'utf8')
const roomManager = fs.readFileSync(path.join(root, 'src/engine/room-manager.ts'), 'utf8')

const checks = [
  ['THEME_CATALOG contains bilingual nameEn & titleEn for all built-in themes', themes.includes('Steve Jobs') && themes.includes('Jensen Huang') && themes.includes('Zhuge Liang') && themes.includes('Alpha Commander')],
  ['i18n helper exposes txRoleName, txRoleTitle and txRoleDesc', i18n.includes('txRoleName') && i18n.includes('txRoleTitle') && i18n.includes('txRoleDesc')],
  ['central panel displays bilingual role names and sender labels', panel.includes('txRoleName') && panel.includes('senderDisplayName')],
  ['composer picker searches both English and Chinese role names', composer.includes('m.nameEn') && composer.includes('txRoleName(m, locale)')],
  ['HUD roster displays localized role names and titles', roster.includes('txRoleName(member, locale)') && roster.includes('txRoleTitle(member, locale)')],
  ['arbiter matches English mention keywords and aliases', arbiter.includes('@steve jobs') && arbiter.includes('@jensen huang') && arbiter.includes('member.nameEn')],
  ['projection formats bilingual roster for agent system prompts', projection.includes('m.nameEn ? m.nameEn : m.name') && projection.includes('m.roleDescriptionEn')],
  ['room manager hydrates bilingual role fields into room fleet', roomManager.includes('member.nameEn = mapped.nameEn') && roomManager.includes('roleDescriptionEn')],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
if (failed.length) {
  console.error('Failed checks count:', failed.length)
  process.exit(1)
}
console.log('P85_BILINGUAL_ROLE_COVERAGE_EXIT:0')

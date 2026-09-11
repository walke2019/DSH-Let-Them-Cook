const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const manager = fs.readFileSync(path.join(root, 'src/engine/room-manager.ts'), 'utf8')
const index = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8')
const tools = fs.readFileSync(path.join(root, 'src/tools/index.ts'), 'utf8')

const required = [
  [manager, "exportMeetingSummary(roomId: string, locale: 'zh-CN' | 'en-US' = 'zh-CN')"],
  [manager, 'Group Chat Collaboration Summary'],
  [manager, 'Exported at:'],
  [manager, '## 6. Token Ledger'],
  [manager, 'Total calls:'],
  [index, "url.searchParams.get('locale') === 'en-US' ? 'en-US' : 'zh-CN'"],
  [tools, "locale: { type: 'string'"],
  [tools, "args.locale === 'en-US' ? 'en-US' : 'zh-CN'"],
]

const missing = required.filter(([source, token]) => !source.includes(token)).map(([, token]) => token)
if (missing.length) {
  console.error(JSON.stringify({P55_BILINGUAL_EXPORT_SUMMARY_EXIT:1, missing}, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  P55_BILINGUAL_EXPORT_SUMMARY_EXIT:0,
  api:'GET /dsh-group-chat/api/export?locale=en-US',
  tool:'group_chat_export_summary locale',
  fields:['title','exportedAt','workflow','roster','assignments','messages','ledger']
}, null, 2))

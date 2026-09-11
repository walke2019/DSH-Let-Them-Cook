const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const fail = []
function has(src, token, label) { if (!src.includes(token)) fail.push(`${label}: ${token}`) }
function notHas(src, token, label) { if (src.includes(token)) fail.push(`${label} still has old token: ${token}`) }

const themes = read('src/engine/themes.ts')
const arbiter = read('src/engine/arbiter.ts')
const topControls = read('src/client/GroupChatHudTopControls.tsx')
const tools = read('src/tools/index.ts')
const roomManager = read('src/engine/room-manager.ts')
const pkg = JSON.parse(read('package.json'))
const matrix = read('scripts/test-matrix.cjs')
const preflight = read('scripts/release-preflight.cjs')
const agents = read('AGENTS.md')

for (const token of ['史蒂夫·乔布斯','埃隆·马斯克','黄仁勋','雷布斯','比尔·盖茨','张小龙']) has(themes, token, 'tech legends roster')
for (const token of ['产品暴君·最终拍板','第一性原理·情报火箭','算力教父·底座炼金','极致性价比·发布会门面','系统级挑刺·兼容性老炮','少即是多·人话体验']) has(themes, token, 'tech legends title')
for (const token of ['给你打出发布会级方案','证据和机会一起发射','体验要让用户忍不住下单','让用户少想一步']) has(themes, token, 'tech legends human copy')
for (const token of ['@马斯克','@musk','@黄仁勋','@雷布斯','@雷军','@盖茨','@张小龙']) has(arbiter, token, 'tech legends aliases')
has(topControls, '科技传奇', 'HUD theme label zh')
has(topControls, 'Tech legends', 'HUD theme label en')
has(tools, '科技传奇', 'tool result label')
has(roomManager, 'themedFleet = new Map', 'switchTheme rebuilds themed prompts')
has(roomManager, 'member.systemPrompt = themedAgent.systemPrompt', 'switchTheme applies themed system prompt')
notHas(themes, '居里夫人', 'old non-tech legends researcher')
notHas(themes, '达芬奇', 'old non-tech legends frontend')
notHas(themes, '纳西姆·塔勒布', 'old non-tech legends qa')
notHas(themes, '海明威', 'old non-tech legends writer')
has(pkg.scripts['test:tech-legends-theme'] || '', 'p60-tech-legends-theme', 'package script')
has(matrix, 'p60-tech-legends-theme', 'matrix includes P60')
has(preflight, 'p60-tech-legends-theme', 'preflight includes P60')
has(agents, '科技传奇主题守则（P60）', 'agents P60 guard')

if (fail.length) { console.error(JSON.stringify({P60_TECH_LEGENDS_THEME_EXIT:1, fail}, null, 2)); process.exit(1) }
console.log(JSON.stringify({
  P60_TECH_LEGENDS_THEME_EXIT:0,
  roster:['乔布斯 commander','马斯克 researcher','黄仁勋 backend','雷布斯 frontend','比尔·盖茨 qa','张小龙 writer'],
  label:'科技传奇 / Tech legends',
  aliases:['@乔布斯','@马斯克','@黄仁勋','@雷布斯','@雷军','@盖茨','@张小龙']
}, null, 2))

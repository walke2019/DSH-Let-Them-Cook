const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const assert = (cond, msg) => { if (!cond) { console.error(`P75_DISTINCT_THEME_COPY_FAIL: ${msg}`); process.exit(1) } }

const panel = read('src/client/GroupChatPanel.tsx')
const voice = read('src/engine/theme-voice.ts')
const agents = read('AGENTS.md')

const zhTitles = ['把活儿丢进群，AI 小队开整', '项目作战室已就绪', '科技传奇已就位，等你开发布会', '军帐已开，等你下令', '冒险委托板已打开']
const enTitles = ['Toss in the work; the AI squad gets weirdly useful', 'Executive project room is ready', 'Tech legends are on standby', 'The war room awaits your command', 'The adventure commission board is open']
for (const title of [...zhTitles, ...enTitles]) assert(voice.includes(title), `missing distinct voice title: ${title}`)
assert(new Set(zhTitles).size === zhTitles.length, 'zh-CN empty titles must be unique')
assert(new Set(enTitles).size === enTitles.length, 'en-US empty titles must be unique')

for (const marker of ['定范围', '开发布会', '修城防', '美化尘歌壶', 'Fix bug', 'Define scope', 'Launch mission']) assert(panel.includes(marker), `missing quick template marker: ${marker}`)
for (const marker of ['1. 定目标', '1. 讲发布会', '1. 下军令', '1. 写委托', '1. 说清目标', '1. Define outcome', '1. Pitch the mission']) assert(panel.includes(marker), `missing onboarding marker: ${marker}`)
assert(agents.includes('中央起始文案主题差异铁律') && agents.includes('npm run test:distinct-theme-copy'), 'AGENTS must document distinct theme copy guard')

console.log(JSON.stringify({
  P75_DISTINCT_THEME_COPY_EXIT: 0,
  zhTitles,
  enTitles
}, null, 2))

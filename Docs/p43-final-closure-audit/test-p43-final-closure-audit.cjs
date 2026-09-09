const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const errors = []
const roadmap = read('Docs/ecosystem-assessment-and-roadmap.md')
const todo = read('Docs/TODO.md')
const readme = read('Docs/README.md')
const preflight = read('scripts/release-preflight.cjs')
if (/\[ \]/.test(roadmap)) errors.push('roadmap still contains unchecked items')
for (const marker of ['可用候选版', '当前可用版阻塞项为 0', '剩余非阻塞优化']) {
  if (!roadmap.includes(marker) && !todo.includes(marker)) errors.push(`closure marker missing: ${marker}`)
}
for (const marker of ['test:ui:visual', 'test:ui:switch', 'test:ui:refresh', 'test:ui:entry', 'p42-agent-chat-entry-usable-regression']) {
  if (!preflight.includes(marker) && !readme.includes(marker)) errors.push(`release/test coverage marker missing: ${marker}`)
}
if (!todo.includes('P43：最终收口审计')) errors.push('TODO missing P43 closure phase')
if (!readme.includes('p43-final-closure-audit')) errors.push('Docs README missing P43 link')
if (errors.length) { console.error(JSON.stringify({P43_FINAL_CLOSURE_AUDIT_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P43_FINAL_CLOSURE_AUDIT_EXIT:0, blockingRemaining:0, status:'usable-release-candidate-closed'}, null, 2))

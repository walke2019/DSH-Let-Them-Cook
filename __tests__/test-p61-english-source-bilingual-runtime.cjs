const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const fail = []
function walk(dir, out = []) {
  for (const file of fs.readdirSync(dir)) {
    const p = path.join(dir, file)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(file)) out.push(p)
  }
  return out
}
function comments(src) {
  const out = []
  for (let i = 0; i < src.length;) {
    if (src[i] === '/' && src[i + 1] === '/') {
      let j = i + 2
      while (j < src.length && src[j] !== '\n') j++
      out.push(src.slice(i, j))
      i = j
      continue
    }
    if (src[i] === '/' && src[i + 1] === '*') {
      let j = i + 2
      while (j < src.length && !(src[j] === '*' && src[j + 1] === '/')) j++
      j = Math.min(j + 2, src.length)
      out.push(src.slice(i, j))
      i = j
      continue
    }
    if (src[i] === '"' || src[i] === "'" || src[i] === '`') {
      const quote = src[i++]
      let escaped = false
      while (i < src.length) {
        const c = src[i++]
        if (escaped) { escaped = false; continue }
        if (c === '\\') { escaped = true; continue }
        if (c === quote) break
      }
      continue
    }
    i++
  }
  return out
}
for (const file of walk(path.join(root, 'src'))) {
  for (const comment of comments(read(path.relative(root, file)))) {
    if (/[\u4e00-\u9fff]/.test(comment)) fail.push(`${path.relative(root, file)}: ${comment.replace(/\s+/g, ' ').slice(0, 120)}`)
  }
}
const i18n = read('src/client/i18n.ts')
const auto = read('src/engine/auto-setup.ts')
const projection = read('src/engine/projection.ts')
const themeFactory = read('src/engine/theme-factory.ts')
const hudTop = read('src/client/GroupChatHudTopControls.tsx')
if (!i18n.includes('detectGroupChatLocale') || !i18n.includes('navigator?.language')) fail.push('client locale auto detection missing')
if (!auto.includes("locale === 'en-US'")) fail.push('auto setup runtime bilingual branching missing')
if (!projection.includes("locale === 'en-US'")) fail.push('agent context projection bilingual branching missing')
if (!themeFactory.includes('ROLE_FLAVOR_EN') || !themeFactory.includes('deriveThemePrefixEn')) fail.push('theme/workflow content bilingual generation missing')
if (!hudTop.includes('Tech legends') || !hudTop.includes('科技传奇')) fail.push('theme UI bilingual label missing')
const matrix = read('scripts/test-matrix.cjs')
const preflight = read('scripts/release-preflight.cjs')
const agents = read('AGENTS.md')
if (!matrix.includes('p61-english-source-bilingual-runtime')) fail.push('matrix missing P61')
if (!preflight.includes('p61-english-source-bilingual-runtime')) fail.push('preflight missing P61')
if (!agents.includes('English source / bilingual runtime guard（P61）')) fail.push('AGENTS missing P61 guard')
if (fail.length) { console.error(JSON.stringify({P61_ENGLISH_SOURCE_BILINGUAL_RUNTIME_EXIT:1, fail}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P61_ENGLISH_SOURCE_BILINGUAL_RUNTIME_EXIT:0, sourceComments:'english-only', runtimeCopy:'zh-CN/en-US auto-matched'}, null, 2))



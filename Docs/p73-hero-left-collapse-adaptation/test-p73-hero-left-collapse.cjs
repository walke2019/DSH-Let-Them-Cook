const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const sourcePath = path.join(root, 'src/client/GroupChatHeroEntry.tsx')
const source = fs.readFileSync(sourcePath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`P73_HERO_LEFT_COLLAPSE_FAIL: ${message}`)
    process.exit(1)
  }
}

assert(source.includes('left:var(--dsh-group-chat-hero-left,280px)'), 'hero main must use dynamic left custom property with 280px fallback')
assert(!source.includes('.gc-hero-main{pointer-events:auto;position:fixed;z-index:47;left:280px;'), 'hero main must not keep fixed 280px left edge')
assert(source.includes('function resolveHeroLeftOffset()'), 'left offset resolver must exist')
assert(source.includes("text.includes('探索未至之境')"), 'resolver must match zh-CN official center hero copy')
assert(source.includes("text.includes('Describe what')"), 'resolver must match en-US official center hero copy')
assert(source.includes('collapsedRail'), 'resolver must include collapsed rail fallback')
assert(source.includes("document.body.style.setProperty('--dsh-group-chat-hero-left'"), 'open state must publish hero left custom property')
assert(source.includes("document.body.style.removeProperty('--dsh-group-chat-hero-left')"), 'close cleanup must remove hero left custom property')
assert(source.includes('new MutationObserver(onReflow)'), 'open state must observe official shell layout changes')
assert(source.includes("window.addEventListener('resize', onReflow)"), 'open state must adapt to viewport/sidebar reflow')

console.log('P73_HERO_LEFT_COLLAPSE_EXIT:0')

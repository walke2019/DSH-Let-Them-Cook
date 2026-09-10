const fs = require('node:fs')
const path = require('node:path')

const root = process.cwd()
const source = fs.readFileSync(path.join(root, 'src/client/GroupChatHeroEntry.tsx'), 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`)
    process.exit(1)
  }
  console.log(`PASS ${message}`)
}

assert(source.includes("el.closest('[data-dsh-group-chat-hero-entry],.gc-hero-main,.dsh-gc-sidebar-host')"), 'real-tab lookup excludes plugin hero and HUD surfaces')
assert(source.includes("el.classList.contains('gc-input-entry-button')") && source.includes("el.classList.contains('gc-hero-button')"), 'real-tab lookup excludes its own entry buttons')
assert(source.includes("el.getAttribute('role') === 'tab'") || source.includes('[role="tab"]'), 'real-tab lookup requires tab semantics before clicking')
assert(source.includes("siblingText.includes('对话') && siblingText.includes('轨迹')"), 'fallback tab heuristic stays scoped to the official conversation tab strip')
assert(source.includes('if (clickVisibleGroupChatTab()) return') && source.includes('setMainOpen(true)') && source.includes('openDetachedHeroMain(locale)'), 'entries fall back to the temporary hero main when no real tab exists')
assert(source.includes("const DETACHED_HERO_ROOT_ID = 'dsh-group-chat-detached-hero-root'") && source.includes('createRoot(host)') && source.includes('document.body.appendChild(host)'), 'input entry can open a detached body-level hero surface even if its slot unmounts')
assert(source.includes('detachedHeroRoot?.unmount()') && source.includes("document.getElementById(DETACHED_HERO_ROOT_ID)?.remove()"), 'detached hero close path unmounts and removes its body host')

console.log('P83_HERO_ENTRY_SELF_CLICK_GUARD_EXIT:0')

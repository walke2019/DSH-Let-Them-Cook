const fs = require('node:fs')
const path = require('node:path')

const root = process.cwd()
const source = fs.readFileSync(path.join(root, 'src/client/GroupChatHeroEntry.tsx'), 'utf8')
const sideDock = fs.readFileSync(path.join(root, 'src/client/GroupChatSideDock.tsx'), 'utf8')
const panel = fs.readFileSync(path.join(root, 'src/client/GroupChatPanel.tsx'), 'utf8')

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
assert(source.includes('if (clickVisibleGroupChatTab()) return') && source.includes('openHeroMain()'), 'input shortcut delegates fallback opening to the stable shell overlay entry')
assert(source.includes('function DetachedHeroMain') && source.includes('<GroupChatPanel mode="dock" />'), 'temporary hero main renders the real group chat panel')
assert(source.includes('data-dsh-group-chat-input-entry-root') && !source.includes('return <>\n    <button type="button" className="gc-input-entry-button"'), 'input slot returns one wrapper element, not a fragment that can crash DSH renderer')
assert(!/export function GroupChatInputEntry\(\)[\s\S]*?<DetachedHeroMain/.test(source), 'input slot must not render the temporary hero panel directly')
assert(sideDock.includes('data-dsh-group-chat-overlay-root') && !sideDock.includes('return (\n    <>'), 'shell overlay returns one wrapper element, not a fragment')
assert(!source.includes('react-dom/client') && !source.includes('createRoot('), 'temporary hero must not use a nested React root that crashes DSH slot rendering')
assert(panel.includes('const useMarkdown = mode === \'full\'') && panel.includes('function SafeMessageText'), 'temporary hero dock mode avoids MarkdownText outside the official conversation view provider')

console.log('P83_HERO_ENTRY_SELF_CLICK_GUARD_EXIT:0')

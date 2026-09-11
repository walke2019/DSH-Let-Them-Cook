const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const panel = read('src/client/GroupChatPanel.tsx')
const composer = read('src/client/GroupChatComposer.tsx')
const sideDock = read('src/client/GroupChatSideDock.tsx')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(
  panel.includes('.gc-chat-messages{padding-left:24px;padding-right:24px;}'),
  'HUD-open message list must keep symmetric 24px horizontal padding',
)
assert(
  !panel.includes('.gc-chat-messages{padding-left:8px;padding-right:8px;}'),
  'HUD-open message list must not collapse to the old 8px edge padding',
)
assert(
  composer.includes('.gc-composer{padding-left:24px;padding-right:24px;}'),
  'HUD-open composer must keep symmetric 24px horizontal padding',
)
assert(
  !composer.includes('.gc-composer{padding-left:8px;padding-right:8px;}'),
  'HUD-open composer must not collapse to the old 8px edge padding',
)
assert(
  sideDock.includes("body.style.setProperty('--dsh-group-chat-hud-overlay-width', `${Math.max(0, hudWidth + 8)}px`)"),
  'Docked HUD avoidance must include the 8px seam before the HUD',
)

console.log(JSON.stringify({
  P72_HUD_MESSAGE_MARGINS_EXIT: 0,
  messagePadding: '24px symmetric',
  composerPadding: '24px symmetric',
  hudSeam: 'hudWidth + 8px',
}, null, 2))

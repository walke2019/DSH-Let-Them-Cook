# P72 — HUD message margin alignment

The docked HUD should not make the central Agent chat feel glued to either side. When the HUD is open, the center panel keeps a small seam before the HUD and preserves symmetric horizontal padding for both the message list and composer.

## Changes

- `GroupChatSideDock` now publishes `--dsh-group-chat-hud-overlay-width` as `hudWidth + 8px`, so the center conversation leaves an explicit visual seam before the docked HUD.
- `GroupChatPanel` keeps `.gc-chat-messages` at `24px` left and right padding while the HUD is docked.
- `GroupChatComposer` keeps `.gc-composer` at `24px` left and right padding while the HUD is docked.

## Verification

- `npm run test:hud-message-margins`
- `npm run test:ui:entry`
- `npm run test:ui:switch`
- `npm run test:ui:refresh`
- `npm run test:matrix`

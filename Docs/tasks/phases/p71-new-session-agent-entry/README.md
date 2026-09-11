# P71 — New-session Agent group chat entry

## Problem

A newly opened official DSH chat can show the blank hero state before any session body exists. The `conversation.view` tab is only visible after the official session chrome is available, so users had no obvious path into the plugin from a fresh chat.

## Fix

- Keep the official new-chat hero layout available and avoid the single `conversation.hero.agentPreset` slot because it collides with the source agent-preset chip.
- Add a lightweight `shell.overlay` launcher that first tries to switch to the real `Agent 群聊` tab when it exists.
- If the current page is still the blank official hero with no visible tab row, open an in-place center work surface (`#dsh-group-chat-hero-main`) that renders the original `GroupChatPanel` so the group-chat input is immediately visible.
- Add a small `conversation.input.left` shortcut inside the official composer once session-scoped input seats are available; when the real tab is not available it opens the same center work surface.
- Restore the original right-side 群聊控制台 (HUD) when the temporary group-chat surface is open; before opening the entry, keep HUD hidden so official pages stay clean.
- Keep the group-chat composer sticky at the bottom of the temporary surface and place the send button in the bottom-right grid area.

## Guardrails

- Do not take over `conversation.body` or `conversation.session.header`.
- Do not use `conversation.hero.agentPreset`.
- Do not set `data-dsh-group-chat-tab-active` from the launcher; only the real `Agent 群聊` tab owns that marker.
- The fallback surface may set `data-dsh-group-chat-hero-open` while open and must remove it on close/unmount.
- The entry must be bilingual and human-friendly.

## Click regression note

The first overlay launcher draft set `data-dsh-group-chat-tab-active` when opening. `GroupChatSideDock` treats that marker as the real `Agent 群聊` tab being active, so the launcher unmounted itself before the panel could render. The launcher now uses a separate `data-dsh-group-chat-hero-open` marker and renders a center work surface instead of pretending to be the real tab.

## UX correction

A second lightweight-only draft merely focused the official composer and showed guidance. That kept the source hero clean but hid the group-chat composer, which made the entry feel broken. The current behavior restores the original group-chat main interface on click while preserving a clear `回到源对话 / Back to source chat` escape.

## Open-source comparison

AgentTeams uses a lighter official-style entry: a closed-namespace slash command, a gesture boundary, `shell.overlay` activity panel, `conversation.chat.node` cards, and hidden command result rows. We keep our richer middle `Agent 群聊` tab and HUD, but the new-session entry follows the same idea: small official-adjacent activation first, then an explicit plugin work surface.

## Sidebar and composer correction

The temporary center surface is treated as an active group-chat work surface even when the official `Agent 群聊` tab is not visible yet. Therefore `GroupChatSideDock` now watches both `data-dsh-group-chat-tab-active` and `data-dsh-group-chat-hero-open`:

- closed source page: lightweight entry only, no HUD;
- temporary group-chat surface open: restore the original HUD/sidebar and auto-open it;
- real `Agent 群聊` tab active: keep the standard HUD behavior.

The bottom composer uses `position: sticky; bottom: 0` inside the message scroller. The composer toolbar uses a grid layout so the send button stays at the lower-right edge while the quick/long-task hint can occupy the lower text row without pushing the send button away.

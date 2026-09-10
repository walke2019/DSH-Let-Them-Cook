# P79 — Composer outside scroll guard

## Problem

After a fresh DSH conversation receives a real Agent reply, the central `Agent 群聊` message list can grow enough that the bottom composer is no longer visible. The previous structure placed `.gc-chat-bottom` inside the scrollable `.gc-chat-scroll` content and relied on `position: sticky`.

## Fix

- Keep `.gc-chat-scroll` as the only scrollable message region.
- Render `.gc-chat-bottom` as a direct flex child of `.gc-conversation`, outside `.gc-chat-scroll`.
- Use `position: relative; flex: 0 0 auto` for the bottom composer so it remains visible like the official DSH chat composer.
- Continue measuring `--gc-bottom-height` so the message list keeps enough bottom padding when auto-scrolling.
- Clamp `.gc-conversation` to the actual remaining viewport height from its current top, because the official tab container can otherwise size the plugin surface by content instead of by the visible screen.

## Guard

Run `npm run test:composer-outside-scroll` after changes touching `GroupChatPanel`, the message thread, central live status, or the composer layout.

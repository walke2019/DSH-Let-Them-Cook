# P64 — Chat UI Composer and Progression Regression

## Goal
Keep the middle `Agent 群聊` conversation usable while the companion HUD is open, especially in narrow in-app browser panes.

## Contract
- The central message log remains the only chat entry point; the right HUD never duplicates message dispatch.
- A user can type bilingual text in the middle composer, send it, and immediately see the user bubble appended to the message log.
- The composer clears after send and disables the send button when empty.
- Docked HUD padding is capped by the actual middle tab width, not by `100vw`, so it cannot squeeze the message area into a one-character strip.
- Under narrow viewports, the docked HUD becomes a slim reveal strip until hovered/focused/resized; the message log and composer keep at least a practical reading/input surface.
- API/debug scripts that post non-ASCII content must use UTF-8 bytes or the real browser input path to avoid mojibake false alarms.

## Manual evidence from local browser
- Filled the real middle textarea with `@writer UI输入复测：中文 English 输入区是否正常？请只回复一句：收到 UI 复测。`.
- The send button became enabled.
- Clicking send appended the exact Chinese/English user bubble to the message log and cleared the composer.
- Closing the HUD restored a clean center view and bottom composer in the in-app browser.

## Files
- `src/client/GroupChatPanel.tsx`
- `src/client/GroupChatSideDock.tsx`
- `src/client/GroupChatComposer.tsx`

## Automated browser evidence
Headless Chromium regression against `http://127.0.0.1:3080/` after the fix:

```json
{
  "active": "true",
  "distanceToBottom": 0,
  "inputVisible": true,
  "sendDisabled": true,
  "lastText": "收到 UI 复测。",
  "hudCount": 1,
  "centralCount": 1
}
```

Console contained only KaTeX Unicode warnings from historical Markdown content; no blocking runtime error was observed.

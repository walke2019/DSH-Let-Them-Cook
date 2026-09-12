# P89 — DSH Native Foundation & Zero-Pollution Layout

## Goal

Establish the modern DSH-native foundation for DSH Let Them Cook without patch-style host DOM manipulation or duplicated chat surfaces.

## Delivered

- Removed legacy duplicate header/entry surface and kept the plugin-owned shell only.
- Enforced the zero-pollution layout rule: plugin CSS and geometry changes target only plugin-owned roots or scoped body flags.
- Removed primary token/ledger estimates derived from message text length.
- Kept official DSH as the fact source for sessions, metrics, tools, and events.

## Key Files

- `src/client/layout-push.ts`
- `src/client/GroupChatHudRosterPanel.tsx`
- `src/client/GroupChatHudWorkflowPanel.tsx`
- `src/engine/room-manager.ts`
- `src/index.ts`

## Verification

- `npm run test:dsh-native-foundation`
- `npm run test:matrix`
- `npm run preflight`

## Engineering Rule

Do not reintroduce host selectors such as `[data-composer-seat]`, `[data-conversation-scroll]`, or global hiding of official DSH UI. The extension must stay inside DSH extension seams and plugin-owned surfaces.

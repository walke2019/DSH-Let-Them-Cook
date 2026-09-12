# P93 — DSH Capability Diagnostics UI

## Goal

Expose DSH-native capability detection in the HUD so users can see which official seams and fact sources are active.

## Delivered

- Added `GroupChatHudDiagnosticsPanel`.
- Added HUD tab: `诊断 / Diagnostics`.
- SideDock fetches `/dsh-group-chat/api/compat` and passes the report to the diagnostics panel.
- Diagnostics displays native capability status for:
  - `agents.create`
  - `sessionProjections.stateOf`
  - `tools.restrict({ allow })`
  - `webServer.register`
  - `agentDefaultModel.currentSelection`
  - `llm.listProviders/listModels`
- Diagnostics displays current fact sources:
  - ledger
  - watchdog
  - tool events
  - approval
  - workflow

## Key Files

- `src/client/GroupChatHudDiagnosticsPanel.tsx`
- `src/client/GroupChatSideDock.tsx`
- `src/client/group-chat-hud-types.ts`
- `src/compat/dsh.ts`

## Verification

- `npm run test:capability-diagnostics-ui`
- `npm run test:matrix`

## Engineering Rule

When native DSH capabilities are missing, the HUD must say so explicitly. The extension must not disguise plugin-local behavior as native DSH behavior.

# P94 — Approval / Workflow Bridge Diagnostics

## Goal

Create a modern bridge-detection layer for DSH native approval and workflow seams without polluting DSH core or pretending unavailable native features exist.

## Delivered

- Added `src/engine/dsh-approval-workflow-bridge.ts`.
- `detectDshCompat()` now reports bridge features and fact sources.
- HUD diagnostics now shows:
  - `approval.request`
  - `workflow.run`
  - approval source
  - workflow source
- Source labels are explicit:
  - `dsh-user-approval` or `plugin-transaction-card`
  - `dsh-workflow-run` or `plugin-workflow-dag`

## Current Boundary

The bridge currently detects and reports native seam availability. It does not claim to execute out-of-turn native approval requests. DSH approval requests require an open agent turn, so plugin transaction cards remain the safe semantic layer when no valid DSH approval context exists.

The local dependency inspection in this workstream confirmed `dsh-user-approval` is installed. It did not establish that a native DSH workflow package is installed in the current workspace, so workflow integration remains explicitly reported as source diagnostics unless a native workflow run service is present.

## Key Files

- `src/engine/dsh-approval-workflow-bridge.ts`
- `src/compat/dsh.ts`
- `src/client/GroupChatHudDiagnosticsPanel.tsx`
- `src/client/GroupChatSideDock.tsx`

## Verification

- `npm run test:approval-workflow-bridge`
- `npm run test:capability-diagnostics-ui`
- `npm run test:matrix`

## Engineering Rule

Bridge first, no fake-native behavior. DSH-native references may be attached only when the corresponding DSH seam exists and the current runtime context is valid for that seam.

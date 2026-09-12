# P92 — DSH Native Tool Event Adapter

## Goal

Move tool presentation parsing out of the agent runtime and into a dedicated DSH-native event adapter.

## Delivered

- Added `src/engine/dsh-tool-event-adapter.ts`.
- `agent-runtime.ts` now delegates tool summarization to the adapter.
- Adapter supports DSH tool events:
  - `tool/call`
  - `tool/result`
  - `tool/ptc-dispatch-start`
  - `tool/ptc-dispatch`
- Output remains the stable `ToolCallRecord` UI contract consumed by `GroupChatToolRow`.
- Preserves read/write target extraction, edit diff stats, bash descriptions, duration, and error status.

## Key Files

- `src/engine/dsh-tool-event-adapter.ts`
- `src/engine/agent-runtime.ts`
- `src/client/GroupChatToolRow.tsx`
- `docs/agents/02-tools-and-ledger.md`

## Verification

- `npm run test:dsh-tool-event-adapter`
- `npm run test:native-tool-row-adapter`
- `npm run test:official-like-central-execution`
- `npm run test:matrix`

## Engineering Rule

The runtime executes member turns; the adapter interprets DSH tool events. Do not reintroduce private tool parsing inside `agent-runtime.ts`.

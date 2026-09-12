# P90 — DSH Runtime Trace & Liveness Binding

## Goal

Bind group-chat assignments and messages to the underlying DSH subagent session facts, then expose a runtime liveness snapshot derived from DSH events.

## Delivered

- Added `DshRuntimeTrace` metadata on assignments and group messages.
- Added `classifyRuntimeLiveness(events)` for DSH session event streams.
- Persisted source session id, source event seqs, projection source, and liveness phase.
- Updated `runMemberTurn()` progress callbacks to stream both tool calls and liveness updates.

## Liveness Phases

- `empty`
- `starting`
- `llm_streaming`
- `tool_running`
- `retrying`
- `completed`
- `failed`
- `stalled`

## Key Files

- `src/engine/runtime-liveness.ts`
- `src/engine/agent-runtime.ts`
- `src/types.ts`
- `src/index.ts`
- `src/engine/room-manager.ts`

## Verification

- `npm run test:dsh-runtime-trace-liveness`
- `npm run test:matrix`

## Engineering Rule

Runtime status must be derived from DSH session events and projections whenever available. Assignment state must not depend only on elapsed wall-clock time.

# P91 — DSH Liveness-Aware Assignment Watchdog

## Goal

Upgrade the assignment watchdog from a simple timeout check into a DSH runtime-liveness-aware state machine.

## Delivered

- Watchdog now reads `assignment.runtimeTrace.liveness` before failing a task.
- Active phases (`starting`, `llm_streaming`, `tool_running`, `retrying`) extend the check window within the hard ceiling.
- Terminal phases (`completed`, `failed`) stop duplicate watchdog actions.
- Stalled tasks preserve `runtimeTrace` in the failure message and assignment record.
- User-facing timeout copy now states that the task stalled according to DSH runtime liveness.

## Key Files

- `src/index.ts`
- `src/engine/runtime-liveness.ts`
- `docs/agents/03-orchestration-and-anti-stall.md`

## Verification

- `npm run test:liveness-aware-watchdog`
- `npm run test:assignment-watchdog-timeout`
- `npm run test:matrix`

## Engineering Rule

The watchdog must not kill a task simply because it exceeded a nominal expected duration while DSH events still show active streaming, tool execution, or retry progress.

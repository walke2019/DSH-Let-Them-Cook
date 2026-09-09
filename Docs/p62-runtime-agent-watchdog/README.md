# P62 Runtime Agent Watchdog

This checkpoint was added after a real DSH group-chat long-task run against the `dsh-agent-teams` comparison scenario.

## Finding

The extension successfully dispatched a long task from the center Agent Chat into multiple role assignments, and several model turns completed with runtime metrics. However, two follow-up assignments stayed in `running` state for more than six minutes. This exposed a runtime gap: `ModelResilienceManager` aborted the member turn, but `runMemberTurn()` awaited `agent.whenIdle()` directly, so a host loop that did not settle after cancellation could leave the assignment apparently running.

## Fix

- Programmatic group-chat agents now include explicit session metadata: `cwd`, `origin: 'subagent'`, and `delegationDepth: 1`.
- `runMemberTurn()` now races `agent.whenIdle()` with the abort signal so model timeout/fallback can surface immediately instead of waiting forever.

## Maintenance note

Do not call `agent.whenIdle()` directly in group-chat member execution. Always use an abort-aware wait helper so the HUD, assignment ledger, and fallback model chain converge on a visible completed/failed state.

# P63 Assignment Watchdog Timeout

Real DSH testing showed that a member Agent may remain visible as `running` longer than the model retry chain, especially when the underlying Agent loop is slow to quiesce. The runtime-level abort-aware wait helps model fallback, but the user-facing assignment ledger also needs a UI-state watchdog.

## Behavior

Every created assignment schedules a bounded watchdog based on `expectedMs`:

- quick task: `expectedMs + 30s`
- long task: `expectedMs + 60s`

If the assignment is still `queued` or `running`, the plugin writes a system timeout message, marks the assignment failed, updates the workflow task to failed with exit code `124`, broadcasts an error status to the HUD, and persists the workspace snapshot.

## Goal

The center chat and HUD must never leave users guessing whether a task is still working, frozen, or already failed. Long-running work can be retried explicitly; stale work is no longer silent.

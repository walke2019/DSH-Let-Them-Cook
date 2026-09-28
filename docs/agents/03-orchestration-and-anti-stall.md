# 03 — Orchestration and Anti-Stall

This guide owns the multi-Agent state machine, DAG gates, handoff, cancellation, and self-healing contracts.

> The sole package identity is `@dsh-external/dsh-let-them-cook`. `dsh-group-chat` is limited to runtime API paths, workspace storage, the runtime skill id, and CSS/data markers.

## Terminal assignment contract

- A tool-triggered assignment receives the exact live parent Agent from `exec.agent`; autonomous continuation resolves the same live registry instance bound to `room.masterSessionId`. A matching string id is insufficient.
- Terminal specialist work calls `ctx.subagents.start('spawn', ...)` with that parent and an exact native tool filter.
- The runtime must `await SubagentRun.result` as the only terminal delivery boundary.
- `run.dispose()` executes in `finally` for success, failure, validation error, and cancellation. Disposal failure is reported but cannot rewrite an already settled workflow outcome.
- Terminal one-shot assignments and continuable subagents are distinct lifecycles and must not be mixed.

## Workflow event invariant

For every started run, `tool-workflow/run-start` pairs with exactly one `tool-workflow/run-end`, and `tool-workflow/agent-start` pairs with exactly one `tool-workflow/agent-end`. Success, failure, empty output, result rejection, validation failure, and cancellation all settle explicitly. Orphaned or duplicate end events are contract violations.

## Assignment uniqueness

A room may have only one active (`queued` or `running`) assignment for the exact tuple:

```text
ownerRoleId + stageId + workflowTaskId
```

Dispatch and anti-stall paths reuse that active assignment instead of creating another run.

## Handoff, gates, and healer behavior

- Specialists report evidence to `commander`; they do not trigger unbounded peer-to-peer loops.
- DAG stages advance only after their quality contracts and `verifyCommand` gates pass.
- Watchdogs convert stalled work into an explicit failed state and mailbox alert.
- A system-healer review is created only when no equivalent active assignment exists.
- If a system-healer assignment fails, the relevant unread reports that triggered that attempt are marked handled so the same evidence cannot wake the commander forever.
- Missing parent ownership, timeout, or malformed results fail loudly; no history guessing or implicit fallback is allowed.

## Verification

- `__tests__/suite-02-workflow-dag.cjs`
- `__tests__/suite-03-runtime-anti-stall.cjs`

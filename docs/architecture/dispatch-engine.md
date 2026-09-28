# Dispatch Engine Protocol

## Identity and state boundary

The only package/profile identity is `@dsh-external/dsh-let-them-cook`. `dsh-group-chat` is an internal namespace for API paths, workspace storage, runtime skill, and CSS/data markers. Room state is persisted under `.pm-workflow/dsh-group-chat/`; private plugin room-state Session events are forbidden.

## Dispatch flow

```text
native DSH conversation goal
  → commander clarifies and decomposes
  → user confirms role/workflow draft when configuration changes
  → assignments enter the current workspace room
  → specialists execute in parallel by responsibility
  → mailbox reports return to commander
  → quality gates verify and commander closes
```

The native conversation is the only prompt surface. Status and controls are available in the native DSH right-sidebar tab after the user explicitly opens it.

## Roles and tool ownership

- `commander`: decomposition, dispatch, review, conflict reduction, approval, final answer.
- `researcher`: web research and source extraction.
- `backend`: server, data, state machine, and repository implementation.
- `frontend`: React/TypeScript/CSS and browser UI validation.
- `qa`: tests, edge cases, red-team review, and gates.
- `writer`: durable documentation and release communication.

Concrete tool-heavy work has one accountable owner. Parallelism is allowed across distinct responsibilities, not duplicate execution of the same operation.

## Terminal Subagent execution

A terminal assignment must:

1. receive the exact live parent Agent (`exec.agent` for tool calls, or the same registry instance bound to `room.masterSessionId` for autonomous continuation);
2. call `ctx.subagents.start('spawn', ...)` with that parent and an exact tool filter;
3. `await SubagentRun.result`;
4. validate the terminal result and update the Assignment;
5. call `run.dispose()` in `finally` for success, failure, or cancellation.

No global-current-session lookup, parent-id approximation, tool alias guessing, or prompt-only capability fallback is allowed.

## Assignment and workflow invariants

`AssignmentEnvelope` includes `assignmentId`, `ownerRoleId`, `stageId`, `workflowTaskId`, status, and evidence. A room has at most one active (`queued` or `running`) assignment for `ownerRoleId + stageId + workflowTaskId`.

Every started run records exactly one paired native lifecycle:

- `tool-workflow/run-start` → `tool-workflow/run-end`
- `tool-workflow/agent-start` → `tool-workflow/agent-end`

Success, failure, validation error, empty output, and cancellation all terminate explicitly. Missing or duplicate end events are invalid.

## Anti-stall and mailbox

Specialists return results to commander through mailbox records. Watchdogs fail stalled work loudly. A system-healer review is scheduled only when no equivalent active assignment exists. If that healer attempt fails, the relevant unread reports are consumed/marked handled so they cannot trigger an infinite wake-up loop.

## UI projection

Assignment, mailbox, workflow, and ledger data render only inside the explicitly opened native right-sidebar pane registered through guide metadata, `sidebarRightTabs`, `sidebar.right.pane.tab`, and `sidebar.right.pane.tab.title`. DSH owns placement and sizing; the plugin never auto-opens or adds a separate conversation UI.

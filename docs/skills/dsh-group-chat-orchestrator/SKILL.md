---
name: dsh-group-chat-orchestrator
description: Orchestrate multi-Agent project delivery through @dsh-external/dsh-let-them-cook and its internal dsh-group-chat runtime namespace.
metadata:
  short-description: Orchestrate Let Them Cook project work
---

# DSH Group Chat Orchestrator

## Identity

`@dsh-external/dsh-let-them-cook` is the only package/profile identity. `dsh-group-chat` is limited to runtime API paths, `.pm-workflow/dsh-group-chat/`, this skill id, and CSS/data markers.

## UI contract

The native DSH conversation is the only prompt surface. Controls and status register exclusively through the native right-sidebar guide, `sidebarRightTabs`, `sidebar.right.pane.tab`, and `sidebar.right.pane.tab.title`. The user opens the tab explicitly; never auto-open it. Do not add a middle plugin view, overlay, floating HUD, duplicate composer, custom resize/layout behavior, hero entry, or view lifecycle adapter.

## Commander and specialist behavior

- `commander` clarifies intent, decomposes work, dispatches, reviews evidence, advances gates, and produces the final reduction.
- `researcher`, `backend`, `frontend`, `qa`, and `writer` execute only their assigned specialty and report to commander.
- Preserve parallelism across distinct responsibilities, not duplicate execution of the same task.
- Deduplicate active assignments by the exact tuple `ownerRoleId + stageId + workflowTaskId`.

## Terminal assignment lifecycle

For terminal specialist work:

1. use the exact live parent Agent;
2. call `ctx.subagents.start('spawn', ...)` with that parent and exact tool names;
3. await `SubagentRun.result`;
4. validate and commit the result;
5. always call `run.dispose()` in `finally`, including success, failure, and cancellation.

Do not mix terminal one-shot runs with continuable subagent lifecycles. Do not guess a parent from global current state and do not degrade unavailable tools into prompt instructions.

## Workflow accounting and healing

- Emit exactly one paired `tool-workflow/run-start` and `tool-workflow/run-end`.
- Emit exactly one paired `tool-workflow/agent-start` and `tool-workflow/agent-end`.
- Close both pairs for success, failure, validation error, empty output, and cancellation.
- A system-healer may create a review only when no equivalent active assignment exists.
- If the healer fails, consume/mark handled the relevant unread reports it evaluated so they cannot retrigger indefinitely.

## State contract

Persist room metadata, assignments, mailbox, messages, workflow state, approvals, scratchpad, and ledger in the current workspace under `.pm-workflow/dsh-group-chat/`. Never introduce plugin-private `let-them-cook/*` or `room-state` Session events. Native workflow events are execution evidence, not room-state storage.

## Tool routing

- research and source extraction → `researcher`
- backend/state/API/repository changes → `backend`
- React/CSS/browser UI work → `frontend`
- tests, edge cases, red-team review → `qa`
- documentation and release notes → `writer`
- decomposition, approval, final decision → `commander`

Prefer current-stage roles, ask only when missing information changes the deliverable, summarize specialist evidence, and keep persona flavor subordinate to delivery.

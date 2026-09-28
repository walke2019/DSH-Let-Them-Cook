# Orchestrator Skill and Policy

## Product boundary

The sole package identity is `@dsh-external/dsh-let-them-cook`; `dsh-group-chat` is limited to runtime API, workspace, skill, and CSS/data namespaces.

Users describe goals in the native DSH conversation. The plugin workbench exists only in the native right sidebar through guide metadata, `sidebarRightTabs`, `sidebar.right.pane.tab`, and `sidebar.right.pane.tab.title`. It opens only after explicit user action and never automatically.

## Commander and specialists

- `commander` clarifies, decomposes, dispatches, reviews, advances gates, resolves conflicts, and returns the final answer.
- `researcher`, `backend`, `frontend`, `qa`, and `writer` execute only their assigned specialist responsibilities.
- Distinct roles may run concurrently within a stage; duplicate execution of the same tool-heavy task is forbidden.
- Active Assignment identity is `ownerRoleId + stageId + workflowTaskId`; an existing queued/running instance is reused.

## Terminal execution policy

Every terminal specialist assignment starts from the exact live parent Agent and calls `ctx.subagents.start('spawn', ...)`. The orchestrator awaits `SubagentRun.result`, validates the output, and always calls `run.dispose()` in `finally`, including failure and cancellation paths. Continuable subagents are reserved for genuinely continuing conversations.

The parent Session records exactly one paired workflow run start/end and agent start/end. All terminal outcomes close the pair. Missing and duplicate terminal events are prohibited.

## Anti-stall policy

Specialists report through mailboxes to commander. Watchdogs convert stalls to explicit failures. A system-healer may wake commander only when no equivalent active assignment exists. If the healer fails, it consumes the relevant unread reports it evaluated so the same report set cannot retrigger forever.

## Tool routing

| Work | Owner |
|---|---|
| web research and source extraction | researcher |
| backend, APIs, state, repository changes | backend |
| frontend, React/CSS, browser verification | frontend |
| tests, edge cases, red-team review | qa |
| documentation and release communication | writer |
| dispatch, approval, reduction | commander |

Tool filters contain exact native DSH tool names; aliases and prompt-only fallbacks are not allowed.

## State policy

Confirmed room configuration and runtime state are stored in `.pm-workflow/dsh-group-chat/`. The plugin never emits private `let-them-cook/*` or `room-state` Session events. Native `tool-workflow/*` events account for execution only.

## Skill ownership

`src/skills/dsh-group-chat-orchestrator/SKILL.md` is the runtime protocol injected by the extension. The copy under `docs/skills/` must remain identical. It is not a developer-assistant skill and does not depend on a user-global skill directory.

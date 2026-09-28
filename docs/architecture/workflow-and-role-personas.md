# Workflow and Role Personas

## Identity and interaction

`@dsh-external/dsh-let-them-cook` is the only package/profile name. Role, workflow, room, and theme runtime data use the internal `dsh-group-chat` namespace.

Users describe work in the native DSH conversation. Team/workflow controls and status are available only in the native right-sidebar workbench after the user explicitly opens its guide entry; the plugin never auto-opens it.

## Default roles

| Role | Responsibility |
|---|---|
| `commander` | clarify, decompose, dispatch, review, approve, reduce |
| `researcher` | research and source extraction |
| `backend` | server, state, API, repository implementation |
| `frontend` | React/TypeScript/CSS and browser UI validation |
| `qa` | tests, boundary analysis, release gates |
| `writer` | durable documentation and release notes |

Themes may change names and tone, but never permissions, ownership, evidence, or quality gates.

## Workflow generation

A clear goal may produce a role/workflow draft. Configuration changes are committed to the current workspace only after user confirmation. The default lifecycle covers clarification, decomposition, implementation, QA, and commander closure.

Terminal assignments use the exact live parent Agent with `ctx.subagents.start('spawn', ...)`, await `SubagentRun.result`, and dispose in `finally`. Active assignments deduplicate by `ownerRoleId + stageId + workflowTaskId`.

Each run has exactly one `tool-workflow` run start/end pair and one agent start/end pair across success, failure, and cancellation. A failed system-healer consumes the relevant unread reports that triggered its review.

## Persistence

Room, roster, theme, workflow, assignments, mailboxes, messages, approvals, scratchpad, and ledger persist under `.pm-workflow/dsh-group-chat/`. Private `let-them-cook/*` and `room-state` Session events are forbidden; native workflow events do not replace workspace state.

## Model matching

Model configuration uses capability tags rather than one hard-coded model id. User-selected role models take precedence, followed by recent compatible models, provider catalog matches, and the host default where explicitly supported.

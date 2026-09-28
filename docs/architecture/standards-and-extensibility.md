# Extension Standards and Extensibility

## Package boundary

`@dsh-external/dsh-let-them-cook` is the sole installable and DSH profile identity. `dsh-group-chat` is runtime-only: API URLs, `.pm-workflow/dsh-group-chat/`, `dsh-group-chat-orchestrator`, and CSS/data markers.

The extension must not modify DSH core, replace official presets, issue hard-coded model HTTP calls, or hijack the native conversation. All host and client resources are registered through lifecycle-owned `ctx.effect()` cleanup.

## Client seam

The only supported client integration is the DSH-native right sidebar:

| Contract | Requirement |
|---|---|
| discovery | contribute a native guide entry |
| type registration | `sidebarRightTabs.register(...)` |
| body | keyed `sidebar.right.pane.tab` |
| title | keyed `sidebar.right.pane.tab.title` |
| open behavior | explicit user action only; never auto-open |
| layout | owned entirely by DSH |

No middle plugin view, overlay, floating/docked HUD, duplicate composer, custom resize handle, host padding/transform, hero injection, or view lifecycle adapter is permitted.

## Runtime execution seam

Terminal assignments require the exact live parent Agent, `ctx.subagents.start('spawn', ...)`, `await SubagentRun.result`, and `run.dispose()` in `finally`. Tool filters use exact registered names and fail loudly on invalid input.

Every native workflow run and agent start has exactly one matching end on success, failure, and cancellation. Active assignments deduplicate by `ownerRoleId + stageId + workflowTaskId`. Failed system-healer reviews consume the relevant unread reports that caused the attempt.

## Data scope

Room metadata, members, themes, workflows, assignments, mailboxes, messages, approvals, scratchpad, model settings, and ledger stay in the current workspace under `.pm-workflow/dsh-group-chat/`. They are not mirrored through private `let-them-cook/*` or `room-state` Session events. Native DSH events remain runtime evidence only.

## Runtime skill

`dsh-group-chat-orchestrator` defines collaboration behavior, role boundaries, tool routing, and stability rules. The extension remains responsible for native UI registration, APIs, state machine transitions, and persistence.

## Release validation

```bash
npm run typecheck
npm test
npm run preflight
```

Browser acceptance verifies that the right-sidebar guide entry appears, remains closed until selected by the user, renders its body/title through the native keyed slots, and leaves the DSH conversation unchanged.

Package metadata, bundle registration, profile patches, and client module identity must all use `@dsh-external/dsh-let-them-cook`.

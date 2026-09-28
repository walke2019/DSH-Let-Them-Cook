# 🍳 DSH Let Them Cook

<p align="center">
  <b>English</b> | <a href="./docs/README.md">简体中文技术文档</a>
</p>

`@dsh-external/dsh-let-them-cook` is a workspace-scoped multi-Agent orchestration plugin for DeepSeek Harness (DSH). A commander decomposes work, terminal specialists execute real DSH tools, quality gates verify results, and the team reports a single deliverable back through the native conversation.

## Naming contract

- **Only installable package and DSH profile identity:** `@dsh-external/dsh-let-them-cook`.
- **Runtime namespace only:** `dsh-group-chat`, reserved for `/dsh-group-chat/api/...`, `.pm-workflow/dsh-group-chat/`, the `dsh-group-chat-orchestrator` skill, and CSS/data markers.
- Never install or register `@dsh-external/dsh-group-chat`.

## What it provides

- Commander-led decomposition, delegation, review, and final reduction.
- Specialist roles for research, backend, frontend, QA, and documentation.
- Native DSH tool execution with exact tool filters and evidence-based output.
- Workflow DAGs, assignment/mailbox coordination, approval controls, token accounting, and anti-stall behavior.
- Bilingual copy and themed personas without weakening role or quality boundaries.

## Native DSH UI boundary

The plugin contributes exactly one client surface: a DSH-native right-sidebar tab.

```text
Native DSH conversation (the only prompt surface)
        │
        └── Native right sidebar guide
              └── sidebarRightTabs registration
                    ├── sidebar.right.pane.tab
                    └── sidebar.right.pane.tab.title
```

The user opens the tab explicitly from the native sidebar guide. The plugin never auto-opens it during startup, session selection, task dispatch, event delivery, or restoration. DSH owns pane placement and sizing.

The current implementation does **not** add a middle conversation tab, overlay, floating HUD, second composer, custom resize handle, host padding transform, hero entry, or view lifecycle adapter.

## Terminal assignment lifecycle

Every terminal assignment follows one deterministic path:

1. Resolve the exact live parent Agent. Tool calls use `exec.agent`; autonomous continuation resolves the same registry instance bound to the room.
2. Call `ctx.subagents.start('spawn', ...)` with that parent and an exact `toolFilter`.
3. Await `SubagentRun.result` as the only terminal delivery boundary.
4. Validate and commit the specialist result.
5. Call `run.dispose()` in `finally`, including success, failure, validation errors, and cancellation.

Terminal one-shot runs and continuable subagents are separate lifecycles and are never mixed.

## Workflow accounting and anti-stall invariants

Each started workflow run has exactly one paired native event sequence:

```text
tool-workflow/run-start    → tool-workflow/run-end
tool-workflow/agent-start  → tool-workflow/agent-end
```

The pairs close exactly once on success, failure, or cancellation. No terminal path may leave an orphaned “running” record or emit duplicate end events.

Active assignments are unique by the exact tuple:

```text
ownerRoleId + stageId + workflowTaskId
```

Dispatch and self-healing reuse an existing `queued` or `running` assignment for that tuple. If a system-healer review fails, the unread reports that triggered it are marked handled so the same evidence cannot retrigger an infinite loop.

## State and persistence

Room metadata, members, assignments, mailbox, messages, workflow state, approvals, scratchpad, and ledger are persisted in the current workspace under:

```text
.pm-workflow/dsh-group-chat/
```

The plugin does not use private `let-them-cook/*` or `room-state` Session events. Native DSH Session events describe runtime execution; workspace storage remains the source of truth for room state.

## Installation

```bash
git clone https://github.com/walke2019/DSH-Let-Them-Cook.git
cd DSH-Let-Them-Cook
npm install
npm run typecheck
npm run build:all
```

Register the package in the DSH web profile:

```yaml
- insert:
    - id: dsh-let-them-cook
      name: '@dsh-external/dsh-let-them-cook'
```

Start DSH Web and open the complete authenticated URL printed by DSH. In the conversation page, open the native right sidebar, select `+`, and choose **Agent Chat / Agent 群聊**. This explicit action opens the workbench; installation never opens it automatically.

For local development, rebuild the client before refreshing the browser:

```bash
npm run build:all
```

A host-only hot reload may report that client reload was skipped; hard-refresh the browser after rebuilding when client code changes.

## Quality gates

```bash
npm run typecheck
npm test
npm run preflight
```

The six domain suites cover room lifecycle, workflow DAGs, anti-stall behavior, tools and ledger, personas and localization, and the end-to-end delivery loop.

## Architecture references

- [`docs/agents/01-ui-and-lifecycle.md`](./docs/agents/01-ui-and-lifecycle.md)
- [`docs/agents/02-tools-and-ledger.md`](./docs/agents/02-tools-and-ledger.md)
- [`docs/agents/03-orchestration-and-anti-stall.md`](./docs/agents/03-orchestration-and-anti-stall.md)
- [`docs/agents/04-i18n-personas-workspaces.md`](./docs/agents/04-i18n-personas-workspaces.md)
- [`docs/README.md`](./docs/README.md)
- [`AGENTS.md`](./AGENTS.md)

## License

MIT

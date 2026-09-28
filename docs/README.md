# DSH Let Them Cook — Documentation Hub

This repository follows an Agent-native, contract-first architecture and keeps project documentation at or below the 15-file limit.

## Naming contract

- Sole installable package and DSH profile identity: `@dsh-external/dsh-let-them-cook`.
- Internal runtime namespace: `dsh-group-chat`, limited to `/dsh-group-chat/api/...`, `.pm-workflow/dsh-group-chat/`, `dsh-group-chat-orchestrator`, and CSS/data markers.
- `@dsh-external/dsh-group-chat` is never an installable or registrable package name.

## Current runtime contract

- UI is exclusively a DSH-native right-sidebar tab: guide metadata + `sidebarRightTabs` + keyed `sidebar.right.pane.tab` and `sidebar.right.pane.tab.title` contributions.
- The user opens it explicitly; the plugin never auto-opens it.
- There is no plugin middle conversation view, overlay, floating HUD, custom resize/layout manipulation, or view lifecycle adapter.
- Terminal assignments use the exact live parent Agent, call `ctx.subagents.start('spawn', ...)`, await `SubagentRun.result`, and dispose in `finally`.
- Room state is workspace-persisted under `.pm-workflow/dsh-group-chat/`; private plugin room-state Session events are forbidden.
- Native `tool-workflow` run/agent start/end events pair exactly once for success, failure, and cancellation.
- Active assignments deduplicate by `ownerRoleId + stageId + workflowTaskId`; failed system-healer runs consume the relevant unread reports.

## Long-lived guides

- [`README.md`](../README.md) — English product and installation guide.
- [`AGENTS.md`](../AGENTS.md) — engineering constitution.
- [`agents/01-ui-and-lifecycle.md`](./agents/01-ui-and-lifecycle.md) — native right-sidebar UI and lifecycle.
- [`agents/02-tools-and-ledger.md`](./agents/02-tools-and-ledger.md) — native tools, evidence, and workflow accounting.
- [`agents/03-orchestration-and-anti-stall.md`](./agents/03-orchestration-and-anti-stall.md) — Subagent lifecycle, DAG, dedupe, and healer behavior.
- [`agents/04-i18n-personas-workspaces.md`](./agents/04-i18n-personas-workspaces.md) — localization, personas, and workspace isolation.
- [`architecture/dispatch-engine.md`](./architecture/dispatch-engine.md) — dispatch protocol.
- [`architecture/standards-and-extensibility.md`](./architecture/standards-and-extensibility.md) — extension seams and release standards.
- [`architecture/workflow-and-role-personas.md`](./architecture/workflow-and-role-personas.md) — role and workflow policy.
- [`architecture/orchestrator-skill-and-policy.md`](./architecture/orchestrator-skill-and-policy.md) — runtime skill policy.
- [`architecture/ecosystem-assessment-and-roadmap.md`](./architecture/ecosystem-assessment-and-roadmap.md) — current capability assessment and roadmap.
- [`TODO.md`](./TODO.md) — 按领域维护的已实现事实与真实后续事项。
- [`tasks/milestones-index.md`](./tasks/milestones-index.md) — 领域知识索引，指向长期专著、架构说明与验证入口。

## Maintenance rules

Do not add slice documents. Update these long-lived guides in place. Validate every change with `npm test` and `npm run preflight`.

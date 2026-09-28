# Ecosystem Assessment and Roadmap

## Current architecture

`@dsh-external/dsh-let-them-cook` is a Cordis host/client extension that does not modify DSH core. `dsh-group-chat` remains an internal runtime namespace only.

| Capability | Current contract |
|---|---|
| UI | DSH-native right-sidebar guide, `sidebarRightTabs`, keyed tab body/title; explicit user open and never auto-open |
| conversation | native DSH conversation is the sole prompt surface |
| execution | exact live parent + `ctx.subagents.start('spawn')` + awaited `SubagentRun.result` + unconditional disposal |
| state | workspace persistence under `.pm-workflow/dsh-group-chat/`; no private room-state Session events |
| accounting | exactly-once paired `tool-workflow` run/agent start/end events |
| anti-stall | active-assignment tuple dedupe and failed-healer report consumption |
| roles | commander plus research/backend/frontend/QA/writer specialists |

The project is a usable candidate when all six standard verification suites and preflight pass and browser verification confirms native sidebar registration.

## DSH ecosystem boundary

- DSH owns the conversation, sidebar layout, pane sizing, and tab navigation.
- The extension contributes one native sidebar type and its guide/body/title registrations.
- dsh-mnemon and other context plugins remain independent; this plugin neither replaces their storage nor injects room state into them.
- Native DSH Session events may represent execution lifecycle. Room state itself remains workspace-persisted.

## Historical UI experiments — superseded

Earlier milestones explored a middle Agent Chat view, overlays, floating or docked HUDs, custom layout avoidance, custom resizing, hero entries, and view lifecycle adapters. Those experiments are retained only as history in the TODO/milestone archive. They are not current behavior and must not be reintroduced.

## Current differentiators

1. Users state goals in the native DSH conversation instead of configuring a graph first.
2. Commander and specialist boundaries are explicit, with real native tools and evidence.
3. Workflow stages allow distinct-role parallelism while assignment tuple dedupe prevents duplicate active runs.
4. Native workflow event pairing makes success, failure, and cancellation visible without orphaned “running” records.
5. Workspace-scoped persistence prevents cross-session room leakage.
6. The optional native sidebar workbench provides status and controls without becoming another chat surface.

## Reliability and assignment-state separation

The native sidebar now treats `room.assignments.length` as lifetime history only. Live work is exactly `queued | running`; `blocked` is an attention state; `completed | failed | cancelled` are terminal history. Shared exhaustive selectors drive the sidebar counters and the Agent prompt projection, so terminal records cannot appear as current work.

The deterministic reliability matrix covers successful delivery, provider rejection, empty output, pre-start cancellation, in-run cancellation, unconditional disposal, exactly-once workflow event closure, active tuple reuse, and new attempts after terminal settlement. Real-provider soak tests remain an explicit operational check rather than a nondeterministic CI dependency.

## Roadmap

1. Run longer real-model workflows and evaluate token usage, cancellation, and mailbox reduction quality against the deterministic reliability baseline.
2. Add a read-only workflow diagnostics view for orphan-run and Assignment/Run linkage inspection, with user-confirmed repair actions.
3. Add more workspace workflow templates without weakening the current execution contracts.
4. Improve persona/theme import and export while preserving role permissions.
5. Continue visual polish inside native sidebar primitives only; do not introduce custom host layout behavior.

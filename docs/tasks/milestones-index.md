# DSH Let Them Cook — Historical Milestones

> The sole package identity is `@dsh-external/dsh-let-them-cook`; `dsh-group-chat` is a runtime namespace only.

## Current-contract override

This file is a historical index, not an implementation specification. Any historical references to a middle Agent Chat view, overlay, floating/docked HUD, custom host spacing or resizing, hero entry, duplicate composer, or view lifecycle adapter are **superseded**.

Current behavior is authoritative:

- one native DSH right-sidebar guide/tab/body/title integration;
- explicit user open and never auto-open;
- exact live parent + `ctx.subagents.start('spawn')` + awaited `SubagentRun.result` + `finally` disposal;
- workspace-persisted room state and no private plugin room-state Session events;
- exactly-once paired native workflow run/agent lifecycle events;
- active assignment dedupe by `ownerRoleId + stageId + workflowTaskId`;
- failed system-healer consumption of relevant unread reports.

## Historical index

| Milestones | Historical focus | Current owner |
|---|---|---|
| P1–P10 | Assignment, mailbox, DAG, structured delivery | agents 02/03 |
| P11–P20 | Superseded UI experiments plus setup drafting and copy | agent 01 current contract; agent 04 |
| P21–P40 | Superseded custom layout experiments and isolation regressions | agent 01 current contract |
| P41–P60 | bilingual runtime, themes, task tiers | agent 04 |
| P61–P80 | watchdogs, master handoff, plus superseded custom composer experiments | agents 01/03 |
| P81–P98 | native tools, token evidence, decisions, workflow closure | agents 02/03 and suite 06 |

All durable knowledge belongs in the four agent guides and architecture references. Do not create new P-series slice documents or tests.

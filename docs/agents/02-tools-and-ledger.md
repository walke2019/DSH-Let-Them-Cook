# 02 — Native Tools and Ledger

This guide defines tool execution, workflow accounting, and usage evidence for `@dsh-external/dsh-let-them-cook`. `dsh-group-chat` is an internal runtime namespace only.

## Native tool execution

- Specialists receive exact registered DSH tool names such as `read`, `edit`, `bash`, `grep`, and `glob`.
- The official `toolFilter: { allow }` is the capability boundary. Empty, duplicate, unknown, or unauthorized names fail loudly; aliases and prompt-only fallbacks are forbidden.
- Tool results, file diffs, exit codes, and model usage must come from actual DSH runtime evidence, never estimates or simulated tools.

## Workflow accounting

Every started terminal assignment has one unique workflow `runId` in its exact parent Session:

1. emit `tool-workflow/run-start` exactly once;
2. emit `tool-workflow/agent-start` exactly once;
3. emit `tool-workflow/agent-end` exactly once;
4. emit `tool-workflow/run-end` exactly once.

Success maps to `completed`, failure and validation errors to `failed/error`, and cancellation to `cancelled`. No code path may omit an end event or emit an end event twice. This pairing is the authoritative native workflow ledger and prevents orphaned “running” cards.

## State boundary

Room metadata, assignments, mailbox, messages, workflow state, scratchpad, and token ledger are persisted under `.pm-workflow/dsh-group-chat/`. The plugin does not append private `let-them-cook/*` or `room-state` Session events. Native DSH events may provide execution evidence but are not the room-state persistence channel.

## Structured delivery and collaboration

- Specialist results use structured status, summary, next action, and evidence fields.
- Captain Task Protocol exposes `claim`, `block`, `handoff`, `report`, and `close` operations.
- Active assignments are deduplicated by the exact tuple `ownerRoleId + stageId + workflowTaskId`.

## Verification

- `__tests__/suite-04-tools-and-ledger.cjs`
- `__tests__/suite-03-runtime-anti-stall.cjs`

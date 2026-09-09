# P65 Captain Task Protocol

## Goal
Adds a workspace-scoped captain route map for every central chat task, so commander intent, selected SubAgents, dependencies and progress are visible before the run feels like random group chat.

## Product rule
- Keep official DSH chat untouched.
- Store all orchestration data in the current workspace room snapshot.
- Commander remains the master Agent; other roles are SubAgents.
- User-facing surfaces stay bilingual and concise.

## Verification
Run `node Docs/p65-captain-task-protocol/test-p65-captain-task-protocol.cjs` plus `npm run test:matrix` before release.

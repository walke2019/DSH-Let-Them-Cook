# P69 Task Cockpit Productization

## Goal
Moves the experience toward a task cockpit: compact captain plan, loop-quality state, approvals and current task instead of a toy chat-only view.

## Product rule
- Keep official DSH chat untouched.
- Store all orchestration data in the current workspace room snapshot.
- Commander remains the master Agent; other roles are SubAgents.
- User-facing surfaces stay bilingual and concise.

## Verification
Run `node Docs/p69-task-cockpit-productization/test-p69-task-cockpit-productization.cjs` plus `npm run test:matrix` before release.

# P67 Approve & Run Transaction Card

## Goal
Adds pending approval transactions with will-change and rollback plan fields, displayed in HUD before write-like operations are accepted.

## Product rule
- Keep official DSH chat untouched.
- Store all orchestration data in the current workspace room snapshot.
- Commander remains the master Agent; other roles are SubAgents.
- User-facing surfaces stay bilingual and concise.

## Verification
Run `node docs/tasks/phases/p67-approve-run-transaction-card/test-p67-approve-run-transaction-card.cjs` plus `npm run test:matrix` before release.

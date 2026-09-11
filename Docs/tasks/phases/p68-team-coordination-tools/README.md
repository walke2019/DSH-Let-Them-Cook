# P68 Team Coordination Tools

## Goal
Exposes Agent-callable coordination tools: claim, block, handoff, report, close and transaction actions, while retaining commander/subagent routing.

## Product rule
- Keep official DSH chat untouched.
- Store all orchestration data in the current workspace room snapshot.
- Commander remains the master Agent; other roles are SubAgents.
- User-facing surfaces stay bilingual and concise.

## Verification
Run `node docs/tasks/phases/p68-team-coordination-tools/test-p68-team-coordination-tools.cjs` plus `npm run test:matrix` before release.

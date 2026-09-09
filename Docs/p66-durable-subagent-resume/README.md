# P66 Durable SubAgent Resume

## Goal
Adds coordination events and blocked/resume states so interrupted or blocked SubAgent work can be recovered through explicit task events instead of disappearing after reload.

## Product rule
- Keep official DSH chat untouched.
- Store all orchestration data in the current workspace room snapshot.
- Commander remains the master Agent; other roles are SubAgents.
- User-facing surfaces stay bilingual and concise.

## Verification
Run `node Docs/p66-durable-subagent-resume/test-p66-durable-subagent-resume.cjs` plus `npm run test:matrix` before release.

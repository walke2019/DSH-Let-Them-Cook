# Git release checklist

Updated: 2026-09-10

This project directory is currently not a Git repository: `git rev-parse --show-toplevel` returns `fatal: not a git repository`.

## Current release scope

- P60 Tech legends theme:
  - `legends` is shown as `科技传奇 / Tech legends`.
  - Roster: Jobs, Musk, Jensen Huang, Lei Jun / 雷布斯, Bill Gates, Zhang Xiaolong.
  - Theme switching updates both visible persona fields and `systemPrompt`.
- P61 English source comments + bilingual runtime:
  - Source comments in `src/**/*.ts(x)` are English-only.
  - Runtime user-facing copy still supports zh-CN/en-US auto matching.
- Documentation synchronized:
  - `README.md`
  - `docs/README.md`
  - `docs/TODO.md`
  - `docs/architecture/business-specification.md`
  - `docs/architecture/workflow-and-role-personas.md`
  - `AGENTS.md`

## Validation already run

```bash
npm run build:all
npm run preflight
npm run test:english-source-bilingual-runtime
npm run test:matrix
```

Latest full matrix result: `TEST_MATRIX_EXIT:0`.

## Ignore policy

Runtime/test-cache directories are ignored and should not be committed:

- `.pm-workflow/`
- `.playwright-cli/`
- `node_modules/`
- `lib/`

## First-time Git initialization

Run these only if this directory is intended to become the Git repository root:

```bash
git init
git branch -M main
git add .
git status
git commit -m "feat: stabilize group chat orchestration and bilingual themes"
git remote add origin <YOUR_REMOTE_URL>
git push -u origin main
```

## Existing remote repository flow

If the real repository already exists elsewhere, copy or move this project into that repo, then run:

```bash
git status
git add .
git commit -m "feat: stabilize group chat orchestration and bilingual themes"
git push
```

## Pre-push sanity check

Before pushing, keep these gates green:

```bash
npm run preflight
npm run test:matrix
```

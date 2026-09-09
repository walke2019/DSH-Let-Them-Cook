# DSH Group Chat

Workspace-scoped multi-Agent group-chat orchestration plugin for DeepSeek Harness (DSH).

`dsh-group-chat` is a Cordis extension for DSH. It does **not** replace the official chat. Instead, it adds a dedicated **Agent Chat** workspace tab where users can describe a project task in plain language, review an AI-generated role/workflow draft, confirm it, and then let a master Agent coordinate SubAgents through planning, execution, QA, documentation, and final handoff.

## Language support

- **Default documentation language:** English, for open-source readability.
- **Runtime UI:** automatically matches `zh-CN` / `en-US` from browser language or user selection.
- **Chinese support:** Chinese UI copy, Chinese mention aliases, Chinese role names, and Chinese themed personas remain first-class product behavior.
- **Source comments:** `src/**/*.ts(x)` comments and internal engineering notes should stay in English.

## Core capabilities

- **Middle `Agent Chat` tab:** safely registered through `conversation.view` with a stable `prepare()` adapter; the official DSH `Dialog` tab remains untouched.
- **Right-side `Group Chat HUD`:** mounted through `shell.overlay`; shows workflow, execution status, scratchpad, ledger, team, role, and model settings.
- **One-line setup flow:** if the user intent is clear, generate a draft; if not, ask a clarifying question; only write to the workspace after user confirmation.
- **Master Agent + SubAgents:** `commander` understands intent, asks follow-ups, delegates, reviews, and closes; `researcher/backend/frontend/qa/writer` execute specialized work.
- **Tool ownership and dedupe:** search/crawl/data extraction goes to `researcher`; backend/API/state to `backend`; UI/browser debugging to `frontend`; QA to `qa`; docs to `writer`.
- **Workspace-scoped state:** roles, themes, workflows, recent models, fallback models, scratchpad, assignments, mailbox, and ledger are stored under `.pm-workflow/dsh-group-chat/` by default.
- **Stable HUD layout:** docked/floating/draggable/resizable HUD, no global AppFrame squeezing, and scoped spacing only inside the `Agent Chat` tab.
- **Bilingual runtime generation:** server APIs, tools, Agent prompts, theme drafts, and workflow drafts support `zh-CN / en-US`.

## Built-in themes

- Default: Meme Squad
- Meme Squad
- Genshin / Teyvat
- Modern Elite
- Three Kingdoms
- Tech Legends: Jobs / Musk / Jensen Huang / Lei Jun / Bill Gates / Zhang Xiaolong

The default generated setup uses the Meme Squad tone: playful, human-readable, and delivery-focused. Switching to Tech Legends creates the feeling of having tech giants working for the user.

## References and integration notes

This project was designed with several prior art and integration constraints in mind:

- **DSH official extension seams:** use `conversation.view` for the middle Agent Chat tab and `shell.overlay` for the companion HUD; do not modify DSH core source or hijack the official Dialog tab.
- **Hermes-style isolation:** named bot roles, capability stripping, central message routing, and no private external sends from SubAgents.
- **OpenClaw-style coordination:** `NO_REPLY` silence token, role-scoped responses, anti-loop rules, and explicit dispatcher ownership.
- **dsh-mnemon / memory integration:** memory/context injection can coexist with this plugin. Historical `prepare` errors should be diagnosed as either frontend `conversation.view.prepare` adapter issues or backend tool scheduler / duplicated `@deepseek-ai/dsh-tools` symbol issues, not blindly attributed to the group-chat plugin.
- **Workspace-first state:** role themes, workflows, model choices, scratchpad, assignments, mailbox, and ledger stay under the current workspace by default.

## Project structure

```text
dsh-group-chat/
├── README.md
├── AGENTS.md
├── Docs/
│   ├── README.md
│   ├── TODO.md
│   ├── business-specification.md
│   ├── technical-architecture.md
│   ├── dispatch-engine.md
│   ├── standards-and-extensibility.md
│   ├── workflow-and-role-personas.md
│   └── ... phase-specific docs and validation records
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── compat/
│   ├── engine/
│   └── client/
├── scripts/
├── package.json
├── tsconfig.json
└── tsdown.config.ts
```

## Development and validation

```bash
npm run typecheck
npm run build:all
npm run test:matrix
npm run preflight
```

Local DSH Web usually runs at:

```text
http://127.0.0.1:3080/
```

For UI changes, also verify in a browser:

- The official `Dialog` tab still works.
- The `Agent Chat` tab exists and does not trigger `prepare` errors.
- The HUD does not cover the middle composer.
- HUD text does not overflow the right panel.
- The middle layout remains stable when the official left sidebar expands/collapses.

## Pre-push checklist

```bash
npm run build:all
npm run preflight
npm run test:matrix
```

Latest full validation result: `TEST_MATRIX_EXIT:0`.

## Documentation

See [`Docs/README.md`](Docs/README.md).

## 中文支持

本项目 README 默认使用英文，方便开源社区阅读；运行态仍完整支持中文：中文界面、中文 `@角色`、中文主题名、中文提示词和 `zh-CN / en-US` 自动匹配都保留。

## License

MIT License

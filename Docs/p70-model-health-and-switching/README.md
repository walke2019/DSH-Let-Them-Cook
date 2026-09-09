# P70 — Model health memory and mid-chat switching

## Goal

During group-chat execution, the plugin should remember which model IDs actually worked in the current workspace and help the user recover when a role is using an unavailable model ID.

## Contract

- Role model edits remain workspace-scoped in `.pm-workflow/dsh-group-chat/model-settings.json`.
- Recent model IDs still keep at most six entries.
- Runtime execution records per-model success/failure health with `successCount`, `failureCount`, `lastStatus`, `lastUsedAt`, and optional `lastError`.
- `/dsh-group-chat/api/models` returns `health` so the picker can show whether a recent/recommended model is verified or failed.
- If DSH rejects hard `tools.restrict()` because the active runtime exposes only a global tools service, the plugin must degrade to prompt-only tool scope instead of failing the model turn before it reaches the LLM.
- Automatic fallback remains the first recovery path; users can still manually switch a role model during an ongoing conversation.

## UX

The role model picker shows health labels near recent and recommended models:

- `可用 · 成功 N` for models that completed a real group-chat turn.
- `上次失败 · N 次` for models that failed during fallback attempts.
- `未实测` for catalog/recent models without runtime evidence.

This keeps the extension playful but practical: users can let the system auto-fallback, or quickly choose a known-good model when a role stalls.

## Watchdog note

Quick tasks keep a low-latency UX, but the watchdog now respects a role's configured model timeout so a valid mid-chat model switch is not killed before the selected/fallback model can answer.


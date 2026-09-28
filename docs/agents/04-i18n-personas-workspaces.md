# 04 — Internationalization, Personas, and Workspaces

This guide defines bilingual behavior, persona themes, and workspace isolation.

> `@dsh-external/dsh-let-them-cook` is the only installable identity. `.pm-workflow/dsh-group-chat/` is a stable internal runtime directory, not a package name.

## Bilingual runtime

System prompts, API errors, native-sidebar copy, exports, and orchestration notices support `zh-CN` and `en-US`. Runtime copy follows the active user locale and must not silently switch languages.

## Personas and themes

The runtime supports default/meme, modern, Teyvat, Three Kingdoms, and technology-legend themes. Persona flavor never overrides role boundaries, tool permissions, evidence requirements, or delivery quality.

## Workspace isolation

- The exact live DSH Session identity deterministically scopes a room; global “current room” guessing and cross-session fallback are forbidden.
- Room metadata, members, assignments, mailboxes, messages, workflow state, scratchpad, approvals, and ledger are persisted in the current workspace under `.pm-workflow/dsh-group-chat/`.
- In-memory room objects are runtime projections of workspace-persisted state, not an independent source of truth.
- Session switching selects the corresponding room projection without copying state across sessions.
- The plugin never writes private `let-them-cook/*` or `room-state` Session events. Native `tool-workflow/*` events describe execution lifecycle only and do not replace workspace room persistence.

## UI locale boundary

Locale controls and localized status appear only inside the DSH-native right-sidebar pane registered through `sidebarRightTabs` and its keyed tab/title seats. The user opens that pane explicitly; localization must never auto-open it.

## Verification

- `__tests__/suite-05-personas-and-i18n.cjs`
- `__tests__/suite-01-room-and-lifecycle.cjs`

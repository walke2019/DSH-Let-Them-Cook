# 01 — UI and Lifecycle

This guide defines the only supported client surface for `@dsh-external/dsh-let-them-cook`.

> `@dsh-external/dsh-let-them-cook` is the sole installable package identity. `dsh-group-chat` is reserved for runtime API paths, `.pm-workflow/dsh-group-chat/`, the `dsh-group-chat-orchestrator` skill, and CSS/data markers.

## Current UI contract

1. **Native right sidebar only.** The client registers one DSH-native right-sidebar type through `sidebarRightTabs`, contributes its guide entry, and supplies content through the keyed `sidebar.right.pane.tab` and `sidebar.right.pane.tab.title` seats.
2. **Explicit user open.** Registration exposes the entry in the native sidebar guide. The plugin never opens it during startup, session switching, task dispatch, event delivery, or restoration.
3. **No parallel conversation surface.** The native DSH conversation remains the sole prompt surface. The plugin adds no middle conversation tab and no second composer.
4. **Native layout ownership.** DSH owns sidebar placement, sizing, panes, and tab lifetime. The plugin does not inject overlays, floating docks, custom resize handles, body-padding shifts, or host-layout transforms.
5. **Scoped cleanup.** Every tab type and slot registration is owned by `ctx.effect()` and disposed with the client fiber. Session selection is read from the native sessions service.
6. **Sidebar-contained interaction.** Team, workflow, scratchpad, ledger, diagnostics, and approval controls render only inside the explicitly opened native sidebar pane.

## Retired implementations

The following are historical and superseded; they are not current architecture and must not be restored: middle-view injection, overlay or floating HUDs, hero-entry injection, custom resize behavior, custom conversation padding, and view lifecycle adapters.

## Verification

- `__tests__/suite-01-room-and-lifecycle.cjs`
- `__tests__/suite-06-e2e-closed-loop.cjs`
- Browser verification confirms that the native guide entry exists, the tab stays closed until a user opens it, and the DSH conversation remains unchanged.

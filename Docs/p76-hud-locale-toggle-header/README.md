# P76 HUD header language toggle

## Problem
The HUD top settings area was overloaded: theme, dispatch mode, help, and language all lived in the same compact grid. On a 300px docked HUD, the second row made the top settings feel crowded and harder to scan.

## Fix
Move the zh-CN/en-US language switch out of `GroupChatHudTopControls` and into the HUD title-bar action cluster, before the Float/Dock and Close buttons. The top settings grid now focuses on theme + dispatch mode + QA only.

## Guard
`npm run test:hud-locale-toggle-header` checks:
- `GroupChatHudTopControls` no longer renders the language select row;
- `GroupChatSideDock` owns a `.dsh-gc-locale-toggle` button;
- the toggle calls `setGroupChatLocale()` and keeps bilingual labels.

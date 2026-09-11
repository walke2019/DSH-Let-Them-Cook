# P73 Hero fallback left-collapse adaptation

## Problem
When the official DSH left sidebar is collapsed, the temporary new-session `Agent 群聊` fallback panel still used a fixed `left: 280px`, leaving a wide dead gap between the collapsed rail and the group-chat surface.

## Fix
`GroupChatHeroEntry` now computes the current official center-column left offset and writes it to `--dsh-group-chat-hero-left`. The fallback panel uses this scoped variable instead of a hard-coded 280px value, updates on resize/DOM mutation, and removes the variable when closed.

## Guard
`npm run test:hero-left-collapse` verifies:
- no fixed `left:280px` remains on `.gc-hero-main`;
- the fallback panel uses `--dsh-group-chat-hero-left`;
- collapsed-center detection accepts the official center copy and rail fallback;
- close cleanup removes `--dsh-group-chat-hero-left`.

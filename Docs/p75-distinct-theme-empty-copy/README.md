# P75 Distinct central empty-state copy for built-in themes

## Problem
The central `Agent 群聊` empty state only had dedicated copy for `meme_comedy`, `three_kingdoms`, and `genshin`. `modern` and `legends` fell back to the default/meme-style copy, so switching between 沙雕整活、现代精英 and 科技传奇 could show nearly identical starting text.

## Fix
- Added independent zh-CN/en-US `ThemeVoiceProfile` entries for `modern` and `legends`.
- Added independent quick template chips for `modern` and `legends`.
- Added independent three-step onboarding text for `modern` and `legends`.

## Guard
`npm run test:distinct-theme-copy` checks that all five built-in themes have distinct central empty-state titles, onboarding labels, and quick template labels.

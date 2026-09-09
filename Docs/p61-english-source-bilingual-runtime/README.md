# P61 — English source comments + bilingual runtime copy

Goal: make the codebase friendlier for open-source contributors by keeping source comments and internal engineering notes in English, while preserving automatic zh-CN/en-US matching for user-facing runtime copy.

## Rules

- Source comments in `src/**/*.ts(x)` should be English.
- Chinese text is allowed when it is intentionally user-facing runtime copy, Chinese mention aliases, built-in persona names, or zh-CN prompt/content output.
- New UI/HUD copy should go through locale-aware helpers such as `tx(locale, zh, en)` or explicit `locale === 'en-US'` branches for server-side text.
- Theme/workflow generation must keep bilingual output through `ROLE_FLAVOR_EN`, `deriveThemePrefixEn()`, and locale propagation from HUD/API/message entry points.

## Validation

- Scans TypeScript/TSX comments and fails on Chinese characters in comments.
- Verifies locale auto detection and bilingual runtime branches remain present.
- Keeps the P60 Tech legends bilingual label covered.

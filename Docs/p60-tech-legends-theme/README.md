# P60 — 科技传奇主题重塑

目标：把原来的“现代传奇”从泛名人主题改成更符合用户预期的“科技界巨头来给我打工”氛围，让主题本身更有区分度和趣味性，而不是只换头像名字。

## 改动

- `src/engine/themes.ts`
  - `legends` 主题调整为科技传奇阵容：乔布斯、马斯克、黄仁勋、雷布斯、比尔·盖茨、张小龙。
  - 每个角色按职责绑定科技圈人格表达：产品拍板、第一性原理调研、算力/底座、发布会式 UI、系统级 QA、人话体验文案。
- `src/engine/room-manager.ts`
  - 切换内置主题时同步重建对应角色的 `systemPrompt`，避免只换名字头像、Agent 内核人格仍停留在旧主题。
- `src/engine/arbiter.ts`
  - 补充科技传奇常用 @ 别名：`@马斯克`、`@雷布斯`、`@雷军`、`@黄仁勋`、`@盖茨`、`@张小龙` 等。
- `src/client/GroupChatHudTopControls.tsx`
  - 前端下拉显示从“现代传奇”调整为“科技传奇 / Tech legends”。
- `src/tools/index.ts`
  - `group_chat_switch_theme` 的中文提示同步使用“科技传奇”。

## 验收

- HUD 主题下拉显示“科技传奇”。
- 切换 `legends` 后，成员名册呈现科技巨头团队，而不是泛名人混搭。
- `@马斯克`、`@雷布斯` 等人话别名能命中对应角色。
- P60 回归加入 `npm run test:matrix` 与发布预检。

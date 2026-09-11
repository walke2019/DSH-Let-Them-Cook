# P59 — 主题角色与工作流生成内容双语

目标：前几轮已经让 UI、API、工具输出、Agent Prompt 支持中英双语；本轮补齐“生成出来的角色与工作流内容本身”，避免英文用户创建后仍得到中文角色名、中文口头禅和中文阶段名。

## 改动

- `src/engine/theme-factory.ts`
  - 增加 `ROLE_FLAVOR_EN`。
  - 增加 `deriveThemePrefixEn()`。
  - `buildHumanSystemPrompt()` 支持 `locale`，英文下生成英文世界观/口头禅/职责提示。
  - `createThemeDraft()` 支持 `locale`，英文下生成英文角色名、title、catchphrase、systemPrompt。
  - `createWorkflowDraft()` 支持 `locale`，英文下生成英文 workflow title、stage name、description。
- `src/engine/auto-setup.ts`
  - `buildAutoSetupDraft()` 支持 `locale` 并传给 theme/workflow factory。
- `src/index.ts`
  - `/auto-plan`、`/message` 自动建群草案使用当前 locale 创建角色/工作流。
  - `/theme/draft`、`/theme/apply-draft` 读取 `body.locale` 创建对应语言草案。
- `src/client/GroupChatSideDock.tsx`
  - HUD 造人/造工作流工具箱请求携带当前 locale。

## 验收

- `locale=en-US` 创建草案时，角色名出现类似 `Bilingual Lead / Bilingual Scout`。
- 英文 workflow 出现 `AI custom workflow`、`Make the goal human-readable`、`Build the prototype`。
- 中文默认路径保持沙雕但靠谱中文主题。

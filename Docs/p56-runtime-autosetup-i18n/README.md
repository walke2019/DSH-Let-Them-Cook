# P56 — 运行态自动建群/工作流双语收敛

目标：补齐中央 Agent 群聊中“自动创建角色 + 工作流”流程的运行态中英文能力，避免用户切到英文后仍看到中文系统提示或中文确认按钮。

## 改动

- `src/client/GroupChatPanel.tsx`
  - 发送 `/api/message` 时带上当前 `locale`。
  - 自动建群草案操作按钮按语言显示并发送 `Confirm setup` / `Cancel setup` 或中文确认词。
- `src/index.ts`
  - 增加 `normalizeApiLocale()`。
  - 用户消息 metadata 记录 `locale`。
  - 自动配置助手、群聊系统错误提示、dispatchHint、确认/取消/追问/草案 response reason 支持中英文。
- `src/engine/auto-setup.ts`
  - `classifyAutoSetupIntent()` 支持 locale 参数。
  - 支持英文确认/取消/修改词。
  - `formatAutoSetupDraft()`、`formatAutoSetupApplied()`、`formatAutoSetupCancelled()` 支持中英文输出。
- `src/types.ts`
  - `GroupMessageEnvelope.metadata.locale` 增加语言标记。

## 验收

- 英文 locale 下草案包含 `Pending draft: roles + workflow`、`Reply **Confirm setup**`。
- 中文 locale 默认仍保留 `待确认草案：角色 + 工作流`、`回复 **确认创建**`。
- 英文确认/取消词可被识别。
- 前端发送消息携带 locale，草案按钮按当前语言发送对应确认词。

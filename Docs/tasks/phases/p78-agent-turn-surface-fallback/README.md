# P78 — Agent turn surface fallback

## 背景

真实日志显示 `cpa/gemini-3.8-flash-high` 连续失败，最新错误从早期 `findLast` 兼容崩溃变成：

```text
Group-chat agent turn failed: "missing turn/end"
```

持久化记录显示同一模型在工作区模型健康里为 `successCount: 0`、`failureCount: 12`，最后错误即 `missing turn/end`。这说明当前 DSH agent loop 在某些版本/模型路径下可能已经完成 idle，但 session log 未提供传统 `turn/end` 边界；继续把缺少 `turn/end` 当成绝对失败，会把可能已经进入 session surface 的 assistant 文本丢掉。

## 修复

- `runMemberTurn()` 先检查失败态 `turn/end`，存在且非 completed 才失败。
- 缺少 `turn/end` 时，不再直接判失败；先从 `assistant/message` events 提取文本。
- 如果 event log 没有文本，再从 `session.deriveMessages()` 的 assistant surface 提取文本。
- 只有 event 与 surface 都没有 assistant text 时，才报可诊断错误，并带上 event 类型计数与 surface 角色列表。

## 验证

- `npm run test:agent-turn-surface-fallback`
- `npm run typecheck`
- `npm run build:all`
- `npm run test:matrix`

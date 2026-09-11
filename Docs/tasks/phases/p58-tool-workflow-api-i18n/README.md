# P58 — 工具输出与工作流 API 双语

目标：继续收敛中英双语业务功能，把 DSH 工具面和工作流管理 API 的中文硬编码结果改为可按 `locale` 输出。

## 改动

- `src/engine/workflow-orchestrator.ts`
  - `stageGate()`、`advanceStage()`、`updateTaskStatus()`、`applyTaskAction()`、`rejectStage()` 支持 `locale`。
  - 英文下返回 `Stage quality gate blocked`、`Task ... updated to ...`、`Workflow task not found` 等英文结果。
- `src/index.ts`
  - `/workflow/task`、`/workflow/task-action`、`/workflow/action` 读取 `body.locale` 并传给 orchestrator。
  - workflow advance 自动创建下一阶段 assignment 时，brief 按语言使用 `Workflow advanced:` 或 `工作流推进：`。
- `src/tools/index.ts`
  - 群聊工具新增可选 `locale` 参数。
  - `send_message`、`switch_theme`、`workflow_advance`、`workflow_reject`、`room_status`、`update_scratchpad`、`set_mode` 等工具结果支持英文。

## 验收

- 英文工具结果不再只返回中文“错误/群聊/调度仲裁/共享黑板”。
- 英文 workflow API 返回英文 task/action/stage 结果。
- 中文默认路径保留，旧调用不传 locale 时不变。

# P6：结构化 Agent 输出协议

日期：2026-09-08

## 目标

把任务状态判定从“正文里是否包含失败/阻断”等脆弱启发式，升级为 Agent 输出末尾的可解析结果块。这样后端可以稳定更新 WorkflowTask 状态、Assignment 元数据和主 Agent 邮箱内容。

## 协议格式

Agent 正文先写给用户/主 Agent 看的自然语言内容，末尾追加：

```agent-result
RESULT_STATUS: passed | failed | request_human
SUMMARY: 一句话说明完成结果
NEXT: 下一步建议或需要谁处理
EVIDENCE: 可选，关键产物/命令/链接/任务 ID
```

## 已完成

1. `src/engine/structured-result.ts`
   - `parseStructuredAgentResult()` 解析结果块。
   - `stripStructuredAgentResult()` 从公开气泡中剥离控制块，保持中间聊天清爽。
   - `inferAgentTaskStatus()` 优先使用结构化状态，缺失时再回退旧启发式。
   - `STRUCTURED_AGENT_RESULT_PROMPT` 注入给正在处理 assignment/workflowTask 的 Agent。

2. `src/types.ts`
   - `GroupMessageEnvelope.metadata.structuredResult` 存储结构化结果。

3. `src/engine/projection.ts`
   - 只有 Agent 存在 active assignment/mailbox 时注入结构化输出协议，避免无任务闲聊增加 token。

4. `src/index.ts`
   - Agent 输出后解析结构化结果。
   - 公开消息使用剥离控制块后的正文。
   - WorkflowTask 状态优先按 `RESULT_STATUS` 更新。
   - `SUMMARY` 写入 verification output，方便 HUD 和导出追踪。
   - Mailbox 回传使用干净正文，不夹带控制块。

## 当前边界

- 目前结构化协议是文本块，不强制 JSON；更适合不同模型稳定遵循。
- 未输出协议时仍回退旧启发式，避免老模型/旧 prompt 直接失效。
- 后续可加严格 JSON 模式或重试修复解析失败的 Agent 回复。

## 下一步

P7 可做：HUD 上显示 `structuredResult.summary/next/evidence`，并给 failed/request_human 提供手动修正按钮。

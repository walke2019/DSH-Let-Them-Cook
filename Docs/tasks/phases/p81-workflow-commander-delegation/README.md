# P81 工作流主 Agent 显式分派继续执行

问题：长任务首轮 `@commander` 成功回复后，如果主 Agent 在内容里明确 `@` 多个 SubAgent，`workflow_driven` 分支仍然返回 terminal，导致中央区看起来“没下文”。

修复：在 `workflow_driven` 中，当主 Agent 发言包含明确成员 @mention 且不是“批准/下一阶段”推进命令时，调度器应返回去重后的 SubAgent 列表继续执行。

验收：
- 主 Agent `@frontend/@backend/@writer/@qa` 后不再 terminal；
- 不把主 Agent 自己加入下一轮；
- 保留原有“批准/下一阶段”推进逻辑；
- 后续 SubAgent 仍通过 assignment / mailbox / central live status 可见。

# P82 官方对话式中央执行体验

目标：中央 `Agent 群聊` 不再把“进度条”当作核心体验，而是对齐官方对话：执行中像一条 Agent 回复消息，正文告诉用户当前在做什么，展开后可以看任务来源、工作流任务、状态、错误和后续工具调用详情。

验收：
- running / queued assignment 在中央区用 Agent 消息气泡展示；
- 主文案描述“正在生成回复/模型调用中”，进度条只是辅助；
- 执行详情可展开查看 brief、source、workflow task、status、error；
- Agent 完成消息 metadata 支持 toolCalls，中央消息继续用 details 展示工具调用参数和结果；
- 所有新增用户可见文案走 `tx(locale, zh, en)`。

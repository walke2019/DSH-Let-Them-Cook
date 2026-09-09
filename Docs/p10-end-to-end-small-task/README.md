# P10 — 小任务端到端无 LLM 回归

## 小任务

> 做一个轻量 ToDo 插件，含 UI、后端状态、测试和文档。

## 覆盖链路

该测试不调用真实 LLM，使用本地引擎模拟完整业务闭环：

1. 默认房间加载：沙雕主题 + 工作流模式。
2. 中间对话意图识别：检测“自动创建角色和工作流”。
3. 生成待确认草案：角色、工作流、主 Agent + SubAgent 策略。
4. 确认写入当前工作区房间。
5. 获取当前阶段 ready task。
6. 创建 assignment 并标记 running。
7. 模拟 SubAgent 结构化回复。
8. 解析 `RESULT_STATUS / SUMMARY / NEXT / EVIDENCE`。
9. 公开消息剥离控制块。
10. WorkflowTask 根据结构化结果更新为 passed。
11. Mailbox 写入、未读展示、标记已读。
12. 模型推荐按角色能力标签输出。
13. 验证事件总线发出 assignment/mailbox 更新事件。

## 命令

```powershell
npm run test:e2e:no-llm
```

## 约束

- 不调用真实 LLM，避免测试消耗模型额度。
- 不依赖外网。
- 不改 DSH 核心源码。
- 只验证插件自己的编排、状态机、结构化协议、HUD 数据来源和模型推荐闭环。

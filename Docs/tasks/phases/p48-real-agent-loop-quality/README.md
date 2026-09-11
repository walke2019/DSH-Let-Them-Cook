# P48 — 真实多 Agent 闭环质量验收

## 目标

把用户关心的“到底是不是主 Agent 分配、不同 Agent 执行、SubAgent 是否上报、质量如何”沉淀成可见、可测、可维护的验收项。

## 本轮实现

- 在右侧 HUD 工作流面板增加 `闭环质量 / Loop quality` 轻量卡片。
- 质量卡片区分：
  - `待验证`：尚未形成完整 SubAgent 上报闭环；
  - `待收口`：SubAgent 已通过 mailbox 上报，主 Agent 尚未读取汇总；
  - `闭环通过`：分派、执行、上报、主 Agent 读取链路已打通；
  - `未完成`：存在模型调用失败或任务失败，需要主 Agent 重试/换模型。
- 继续保留 DSH workflow 的阶段内多 Agent 并发能力，同时保证工具归口：搜索/爬取归 researcher，开发归 backend/frontend，QA 归 qa，文档归 writer，主 Agent 做收口。

## Chrome 真实监控结论

- 当前真实调用已触发 commander 与 researcher 两类 Agent。
- 旧工具白名单错误已修复。
- 当前质量未达“闭环通过”，因为真实模型调用出现 30 秒超时，HUD 会归类为 `未完成`。

## 验收口径

成功闭环必须同时满足：

1. 用户消息被主流程接收；
2. 主 Agent 或当前工作流创建 assignment；
3. 至少一个 SubAgent 执行并完成 assignment；
4. SubAgent 结果写入 mailbox 上报给主 Agent；
5. 主 Agent 读取或后续汇总可在 HUD/账本中看到；
6. 若模型失败，不伪装成功，明确显示 `未完成`。

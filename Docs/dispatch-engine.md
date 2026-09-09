# DSH 多 Agent 群聊调度引擎协议

更新日期：2026-09-09

## 1. 调度目标

调度引擎的目标是让用户用自然语言描述任务后，由主 Agent 组织 SubAgent 完成项目协作，同时减少用户配置成本和理解成本。

默认链路：

```
用户一句话
  ↓
主 Agent 理解意图；不足则追问
  ↓
生成角色 / 工作流 / 模型建议草案
  ↓
用户确认
  ↓
写入当前工作区
  ↓
workflow 阶段推进：并发执行、mailbox 回传、主 Agent 审核收口
```

## 2. 主 Agent + SubAgent

- `commander`：主 Agent，负责目标理解、追问、拆解、派发、阶段审核、冲突收敛、最终总结。
- `researcher`：调研专员，负责搜索、爬取、资料抽取与摘要。
- `backend`：后端与状态/API 专员。
- `frontend`：前端 UI、浏览器调试与交互体验专员。
- `qa`：质量、红队、边界测试与验收专员。
- `writer`：文档、用户说明和交付材料专员。

## 3. 工具归口

工具任务必须唯一归口，禁止全员重复调用：

| 任务类型 | 唯一归口 |
|---|---|
| 搜索、爬取、资料抽取 | `researcher` |
| 后端、状态机、API、持久化 | `backend` |
| 前端、UI、浏览器验证 | `frontend` |
| 测试、红队、安全、质量门禁 | `qa` |
| 文档、摘要、发布说明 | `writer` |
| 分派、审核、是否推进 | `commander` |

## 4. Workflow 并发

必须保留 DSH workflow 阶段内并发能力：

- 同一阶段可有多个 ready task。
- 多个 SubAgent 可并发执行不同职责。
- 并发不等于重复：搜索/爬取只能交给 researcher，UI 只能交给 frontend，测试只能交给 qa。
- SubAgent 执行结果通过 mailbox 回传主 Agent，主 Agent 再公开总结。

## 5. Assignment / Mailbox

- `AssignmentEnvelope` 记录任务分派：`assignmentId`、`workflowTaskId`、`ownerRoleId`、`status`、`brief`。
- `AgentMailboxMessage` 记录 SubAgent 给主 Agent 或其他角色的回传。
- HUD 读取 assignment/mailbox 实时展示，但不重复聊天派发入口。

## 6. 防死循环

- 非严格 @ 模式下，无关角色必须输出 `NO_REPLY`。
- 默认禁止 Bot 自主触发 Bot；除非房间明确开启 `enableBotToBotTrigger`。
- 单次用户任务必须有最大轮次和状态机熔断。
- 严禁互相感谢、附和、复述导致自激循环。

## 7. 结构化结果

SubAgent 对 assignment 的输出应包含结构化控制块：

```text
RESULT_STATUS: passed | failed | request_human
SUMMARY: ...
NEXT: ...
EVIDENCE: ...
```

后端解析后剥离控制块，公开消息只展示人类可读内容；HUD 与任务状态使用结构化字段。
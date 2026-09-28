# TODO — DSH Let Them Cook 领域清单

> 唯一可安装、注册和发布的包名是 `@dsh-external/dsh-let-them-cook`。`dsh-group-chat` 仅作为内部运行时命名空间，用于 API 路径、工作区目录、Runtime Skill 与 CSS/data marker。
>
> 本文只记录长期有效的已实现事实与真实待办，不再维护按时间编号的演进流水。架构细节以 `docs/agents/` 与 `docs/architecture/` 中的领域专著为准。

更新日期：2026-09-28

## UI 与生命周期

- [x] 用户只通过 DSH 原生右侧栏 guide 显式打开工作台；插件永不自动打开。
- [x] 使用 `sidebarRightTabs`、`sidebar.right.pane.tab` 与 `sidebar.right.pane.tab.title` 注册类型、正文和标题。
- [x] DSH 原生对话是唯一 Prompt 输入面；插件不提供第二输入框、中间会话页、浮动 HUD 或自定义宿主布局。
- [x] 客户端注册均由 `ctx.effect()` 托管，切换 Session 或卸载 Fiber 时显式清理。
- [x] 工作台按当前 Session 解析房间并过滤 SSE，避免跨会话串台。
- [x] 任务展示区分活跃任务、需关注任务与终态历史；`assignments.length` 仅表示历史总量，不表示正在运行。
- [x] 活跃任务严格限定为 `queued | running`，`blocked` 单列为需关注，`completed | failed | cancelled` 归入终态历史。

## 工具、账本与权限

- [x] 角色工具权限通过 DSH 原生精确 `toolFilter: { allow }` 执行，空名、重复名或未注册工具在边界显式失败。
- [x] 调研、后端、前端、测试和文档角色使用真实 DSH 工具，不以 Prompt 弱约束替代权限隔离。
- [x] 工具调用、运行指标与 `DshRuntimeTrace` 从原生 Session 事件和官方投影读取，不按文本长度估算 Token。
- [x] 账本按角色、Provider 和模型汇总调用次数、Token、缓存读写、首 Token、LLM 与工具耗时。
- [x] Assignment、Mailbox、审批事务和结构化交付均保留可审计证据。
- [x] 缺失原生 Usage 时明确保持不可用语义，不把缺失数据伪装成可靠的零值。

## 调度、工作流与防停滞

- [x] 终态 Assignment 使用精确 live parent Agent 调用 `ctx.subagents.start('spawn', ...)`。
- [x] `SubagentRun.result` 是唯一终态交付边界，所有路径均在 `finally` 中执行 `run.dispose()`。
- [x] one-shot Assignment 与 Continuable Subagent 生命周期严格分离。
- [x] `tool-workflow/run-start`、`tool-workflow/agent-start`、`tool-workflow/agent-end`、`tool-workflow/run-end` 在成功、失败和取消路径 exactly-once 成对闭合。
- [x] 活跃 Assignment 按 `ownerRoleId + stageId + workflowTaskId` 去重；已有 `queued/running` 实例时复用，终态后允许新尝试。
- [x] 专员通过 Mailbox 向 commander 回传，commander 负责阶段审阅和最终收口。
- [x] DAG 支持依赖、质量契约、验证命令、审批、驳回和显式人工决策。
- [x] 看门狗依据原生运行态将超时或停滞任务显式置为失败，不静默猜测成功。
- [x] system-healer 只在没有等价活跃 Assignment 时唤醒 commander；自愈失败后消费相关未读报告，阻断重复唤醒。
- [x] 确定性可靠性基线覆盖成功、Provider 拒绝、空输出、启动前取消、运行中取消、dispose、事件闭合与 Assignment 去重。

## 国际化、主题与工作区

- [x] 用户可见的核心 UI、系统回执、工具输出、工作流结果和导出纪要支持 `zh-CN` / `en-US`。
- [x] 沙雕、现代、提瓦特、三国与科技传奇五类主题保持独立角色声线和职责边界；`default` 是沙雕主题的公开别名。
- [x] 自定义角色资料与模型配置按工作区保存，不跨工作区泄漏。
- [x] 房间、消息、Assignment、Mailbox、工作流、审批、黑板和账本统一持久化到 `.pm-workflow/dsh-group-chat/`。
- [x] 插件不写入 `let-them-cook/*`、`room-state` 等私有 Session 事件；Session 仅记录 DSH 原生执行生命周期。
- [x] 重启或热重载时，遗留活跃任务显式收敛为中断状态，避免永久显示运行中。

## 测试、发布与质量门禁

- [x] 六个标准验证套件覆盖房间生命周期、DAG、运行时防停滞、工具与账本、角色与国际化、端到端闭环。
- [x] `npm run typecheck` 执行严格 TypeScript 静态检查。
- [x] `npm test` 构建 Host/Client 并运行六大标准套件。
- [x] `npm run preflight` 检查命名、文档与测试上限、必要产物及架构红线。
- [x] 确定性测试验证 Workflow 四事件闭合、Assignment 状态分类和三元组去重。
- [x] 发布包包含 `lib/` 与 `config/cordis.bundle.yml`，DSH profile 只注册 `@dsh-external/dsh-let-them-cook`。
- [x] 文档知识收敛到长期领域专著，不新增临时阶段切片。

## 历史废弃方案

以下方案仅用于说明已排除的方向，不是当前能力，也不得恢复：

- 中间 Agent Chat 会话页、`conversation.view` 注入与 `prepare()` 适配器。
- `shell.overlay`、浮动或停靠 HUD、自定义拖拽缩放、宿主 padding/位移和 Hero 入口。
- 第二聊天输入框、插件自建中央消息面及绕过 DSH 原生对话的交互入口。
- 工具正则别名猜测、Prompt 权限降级、自动换模型与基于历史消息的隐式兜底。
- 插件私有房间状态 Session 事件，以及依赖未知事件恢复 Workspace 状态的双轨持久化。
- 将历史 Assignment 总量、失败记录或已完成记录显示为实时运行任务。

## 后续路线图

- [ ] **Host/API 本地化分层**：把剩余 Host API 与 Tool 返回文案收敛到 locale-aware 字典，并将用户自定义角色数据与产品 UI 文案分层。
- [ ] **长链路真实模型耐久验证与进度体验**：运行多角色长任务，评估 Token、取消、Mailbox 收口和真实耗时；增强长任务阶段进度，同时保持真实模型测试不进入非确定性 CI。
- [ ] **只读 Workflow 诊断与用户确认修复**：展示孤儿 Run、重复终止事件、Assignment/Run 关联和待收口 Mailbox；任何历史修复必须先给出差异并由用户确认。
- [ ] **模板与 Persona 导入导出**：支持工作流模板、主题角色、权限和模型路由的工作区级导入导出；导入前执行强类型校验与差异预览。

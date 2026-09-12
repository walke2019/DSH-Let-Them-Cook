# P95 — 对话防中断自愈与全主题别名解析 (Dialog Continuity & Anti-Stall Engine)

## 📌 背景与核心痛点

在多智能体工作流协同（`workflow_driven` 模式）中，用户反馈在执行导演台界面出现了会话停滞现象：
- **现场表象**：
  - 中央消息流在 SubAgent 发言后中断；
  - 右侧 HUD 显示：`当前：雷布斯 完工待命`、`当前任务: @frontend · 前端 UI 与交互实现`；
  - 执行统计：`执行中: 0, 待处理: 0, 邮箱: 3`；
  - 闭环质量卡片停留在黄色：`待收口（SubAgent 已上报，等待主 Agent 读取汇总。）`；
  - 没有任何智能体在运行，也没有任何定时器处于激活状态，流程彻底假死。

## 🔍 根本原因深度剖析

1. **跨主题与通用角色别名解析断层**：
   - 之前 `DispatchArbiter.extractMentions` 仅校验了当前主题的名号及固化的局部别名。
   - 当会话上下文切换或 Commander 在不同调性间提及成员名号（例如在 `legends` 主题下提及沙雕主题的 `@瓜田侦探`、`@后端锅王`，或职能通称 `@架构师`、`@前端`、`@测试`）时，`extractMentions` 返回空列表。
   - 导致 Commander 明确的分派指令被误判为未提及任何成员。

2. **主管发言非推进状态下的死锁假死**：
   - 当 Commander 发言未包含放行关键词（如“批准/通过/LGTM”），且未被识别出 `@xxx` 时，Arbiter 判定当前阶段收敛，直接返回 `isTerminal: true, nextSpeakerIds: []`。
   - 导致即使阶段内仍有未完成的 ready/pending 任务，系统也直接关闭调度，造成任务悬挂与全盘停滞。

3. **SubAgent 并发交付与无看门狗自愈机制**：
   - 同一阶段内前后端多智能体并发执行完毕上报后，如因插件重载、页面刷新或网络偶发抖动导致单个延时调度丢失，系统没有任何自动巡检自愈机制来重启收口。
   - 导致邮箱积累 3+ 条报告，HUD 长期显示“待收口”而无人问津。

## 🛠️ 工业级技术解决方案

### 1. 全主题与全角色动态别名解析网格 (`arbiter.ts`)
- 引入全量 `THEME_CATALOG` 跨主题别名映射，支持跨主题（`meme_comedy`、`legends`、`three_kingdoms`、`genshin`、`modern`、`default`）中英双名自动对齐标准角色 ID（`commander`, `researcher`, `backend`, `frontend`, `qa`, `writer`）。
- 注入通用角色语义别名表：
  - `commander`: `@总指挥`, `@总指挥官`, `@指挥官`, `@总导演`, `@主持人`, `@主agent`, `@主控` 等；
  - `researcher`: `@调研`, `@调研员`, `@搜索`, `@情报`, `@资料`, `@瓜田侦探` 等；
  - `backend`: `@后端`, `@架构`, `@架构师`, `@api`, `@底座`, `@后端锅王` 等；
  - `frontend`: `@前端`, `@ui`, `@交互`, `@设计师`, `@门面`, `@像素显眼包` 等；
  - `qa`: `@测试`, `@红队`, `@质检`, `@审计`, `@阴间测试员` 等；
  - `writer`: `@文档`, `@文案`, `@写手`, `@记录`, `@废话压缩师` 等。

### 2. 主管发言防死锁兜底机制 (`arbiter.ts`)
- 当 Commander 发言未触发放行且未点名具体人员时：
  - 优先检测当前阶段是否有就绪任务（`readyTasks`），指派就绪责任人继续执行；
  - 若阶段仍有未完成任务（`pendingTasks`），防中断指派责任人继续推进；
  - 若阶段已分配 SubAgent，主动唤醒相关责任人接力；
  - 严禁在工作流未整体完工时擅自退出为 `isTerminal: true`。

### 3. 后台 3.5s 心跳自主巡检与自愈流转 (`src/index.ts`)
- `ctx.effect` 挂载常驻防中断看门狗：
  - 扫描处于 `workflow_driven` 模式且活跃任务数为 0（`activeAssignments === 0`）的房间；
  - **条件 1（待收口停滞自愈）**：若 Commander 邮箱存在未读 SubAgent 交付汇报（`unreadReports > 0`），自动创建阶段收口 Assignment 唤醒 Commander 读取审阅；
  - **条件 2（全通过未流转自愈）**：若当前阶段所有任务均已通过门禁，自动执行 `advanceStage` 推进至下一阶段并分派责任人；
  - **条件 3（就绪待办任务自愈）**：若当前阶段存在 ready 任务，自动创建 Assignment 并唤醒责任人。

### 4. 邮箱已读闭环流转与一键唤醒恢复
- Commander 执行审阅发言时，自动将待审收件箱报告标记为已读（`markMailboxRead`），推动闭环质量从“待收口”转为“闭环通过”。
- HUD 闭环质量卡片在处于“待收口”状态时，提供显式的 **【唤醒主控收口】** 按钮，支持用户手动点选即刻恢复；
- 后端暴露 `POST /dsh-group-chat/api/workflow/resume` 接口，支持无损恢复停滞工作流。

## 🧪 验证与回归基线

- 新增自动化单测：`__tests__/test-p95-dialog-continuity-and-anti-stall.cjs`
- 纳入发布前测试矩阵：`npm run test:dialog-anti-stall`
- 覆盖率项：
  - 跨主题名号（`@瓜田侦探` 在 `legends` 主题）正确识别并唤醒 `researcher`；
  - Commander 无点名无通过关键词发言时，防死锁兜底唤醒未完成任务责任人；
  - 阶段任务全通过自动推进；
  - 邮箱待收口自动巡检与一键恢复接口可用性。

# DSH Let Them Cook 演进路线图 (Roadmap)

本文档制定 `DSH Let Them Cook` 的版本演进与技术路线规划。

---

## 阶段规划

### Phase 1: 底座兼容与群聊雏形 (P1 ~ P20) - [已完成]
- Cordis 插件生命周期接入，`conversation.view` 中间视图安全注入；
- 多智能体基础数据结构（Room、Message、Ledger、Assignment、Mailbox）；
- 基础 HUD（SideDock）侧边栏与基本拖拽。

### Phase 2: 组件化拆分与渐进式展示 (P21 ~ P43) - [已完成]
- HUD 顶栏、工作流、成员名册、黑板、账本彻底组件化解耦；
- 账本分页与历史筛选，工作流折叠收起；
- 官方源版对话隔离与状态清理（零污染红线）。

### Phase 3: 全栈中英双语与主题人格化 (P44 ~ P61) - [已完成]
- `zh-CN` / `en-US` 全栈双语运行时；
- 运行时草案与确认流程双语化；
- 五套主题世界观（沙雕整活、现代经典、科技传奇、三国风云、原神提瓦特）。

### Phase 4: 稳定度看门狗与生产化交付 (P62 ~ P76) - [已完成]
- 任务看门狗超时监控与报警信自愈；
- 确认后执行事务卡片（Transaction Approval）；
- 新会话 Blank Hero 入口与左栏自适应；
- 会话级别房间隔离与数据持久化。

### Phase 5: 原生工具直通、实时状态与防死循环 (P77 ~ P88) - [已完成]
- 中央消息流实时展示底座原生工具调用（250ms SSE 探针）；
- `edit` 行号 Diff (+add -del) 与 `bash` 执行描述；
- 解决 Prompt Cache 缓存命中显示为 0 的问题；
- Universal Master Handoff 完工必回主控与长任务 24 轮预算；
- `README.md` 默认地道英文与 `AGENTS.md` 模块化规范治理。

### Phase 6: 当前与后续规划
- **测试工程目录标准化**：将 90+ 套测试统一沉淀入 `__tests__/` 目录；
- **文档体系标准化**：`docs/` 按业务分类重构为 `agents/`、`tasks/`、`architecture/`、`releases/`。

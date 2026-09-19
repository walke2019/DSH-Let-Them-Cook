# DSH Let Them Cook — 技术文档中心与架构索引 (Documentation Hub)

本项目遵循面向未来的 Agent 原生架构（Agent-Native Architecture），严格执行**“三层文档体系”**与**“防文档泛滥硬约束（Anti-Process Bloat Guardrail，文档总数 <= 15）”**。

所有系统的业务定位、架构规约、长效专著与技术指标，统一收敛于以下核心文档：

---

## 🏛️ 核心架构与长效专著全景

### 1. 业务与开发准则
- **[README.md](../README.md)** — 面向用户的产品业务说明书（默认地道英文编写，顶部提供中文切换链接）。
- **[AGENTS.md](../AGENTS.md)** — 面向 AI Coding Agent 及协作智能体的工程架构宪章（三纯原则、强类型契约、零补丁零兜底）。

### 2. 四大长效领域专著 (`docs/agents/`)
系统的所有长效业务实现与规范，严格按领域内聚，严禁在后续迭代中新建切片过程文档：
- **[01-ui-and-lifecycle.md](./agents/01-ui-and-lifecycle.md)** — **UI 布局、插槽生命周期与交互规范**：0 独立 Tab、0 输入框入侵、右侧 HUD 伴随舱避让与 prepare 契约。
- **[02-tools-and-ledger.md](./agents/02-tools-and-ledger.md)** — **原生工具调用、流式状态机与计费审计**：DSH 底座原生工具直通、实时 Prompt Cache 解析、毫秒级工具 Diff 广播与团队协同工具。
- **[03-orchestration-and-anti-stall.md](./agents/03-orchestration-and-anti-stall.md)** — **调度编排、防死循环与自愈机制**：Universal Master Handoff（完工必回主控）、多阶段 DAG 自动化质量门禁与任务看门狗。
- **[04-i18n-personas-workspaces.md](./agents/04-i18n-personas-workspaces.md)** — **国际化、主题化与工作区隔离**：全栈中英双语运行时、五大世界观独立调性人设、会话作用域持久化。

### 3. 系统技术白皮书 (`docs/architecture/`)
- **[dispatch-engine.md](./architecture/dispatch-engine.md)** — 调度引擎核心设计与分发协议。
- **[standards-and-extensibility.md](./architecture/standards-and-extensibility.md)** — Cordis 微内核扩展机制与 DSH 插槽契约。
- **[workflow-and-role-personas.md](./architecture/workflow-and-role-personas.md)** — 标准研发工作流阶段定义与角色职责。
- **[orchestrator-skill-and-policy.md](./architecture/orchestrator-skill-and-policy.md)** — 协同策略与工具路由规则。
- **[ecosystem-assessment-and-roadmap.md](./architecture/ecosystem-assessment-and-roadmap.md)** — 生态评估与长效演进路线图。

### 4. 任务与里程碑索引
- **[TODO.md](./TODO.md)** — 当前迭代中的重点演进规划与收敛任务。
- **[milestones-index.md](./tasks/milestones-index.md)** — 历史里程碑汇总索引。

---

## 🛑 文档维护铁律
1. **坚决不建过程文档**：严禁在后续开发中新建任何切片临时说明（如 `pXX`、临时 patch 日志）；
2. **长效领域就地维护**：任何新坑或功能升级，直接在四大长效领域专著或白皮书中**就地覆写更新**；
3. **测试留痕自动化**：以自动化测试套件（`npm test`）与 `npm run preflight` 验证为准，严禁靠人肉写测试报告交差。

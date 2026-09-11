# 系统架构与技术设计规范 (System Architecture & Specifications)

本目录归档 `DSH Let Them Cook` 的核心系统架构设计、业务定位、微内核集成标准与技术白皮书。

---

## 核心架构文档索引

| 文档 | 主题 | 核心内容 |
| :--- | :--- | :--- |
| **[technical-architecture.md](./technical-architecture.md)** | **总体技术架构** | Host/Client/Engine/Workflow/Runtime Skill 分层设计，Cordis 扩展挂载。 |
| **[business-specification.md](./business-specification.md)** | **业务定位与规范** | 产品目标、主副屏职责、用户草案确认与写入流程规范。 |
| **[dispatch-engine.md](./dispatch-engine.md)** | **调度中枢与并发模型** | 主 Agent + SubAgent 分工、工具归口专员、阶段并发与防死锁。 |
| **[standards-and-extensibility.md](./standards-and-extensibility.md)** | **扩展集成标准** | DSH Cordis 扩展标准、UI Seam 规范、官方对话绝对零污染红线。 |
| **[orchestrator-skill-and-policy.md](./orchestrator-skill-and-policy.md)** | **协作策略与 Skill** | 扩展与 Runtime Skill `dsh-group-chat-orchestrator` 的分工与协作规范。 |
| **[fault-tolerance-and-token-thrift.md](./fault-tolerance-and-token-thrift.md)** | **容错与 Token 节约** | 任务看门狗、超时报警信自愈、长任务 24 轮预算与 Prompt Cache 计费。 |
| **[workflow-and-role-personas.md](./workflow-and-role-personas.md)** | **工作流与角色人格** | 角色设定、五套主题世界观、自动草案生成与闭环推进。 |
| **[ecosystem-assessment-and-roadmap.md](./ecosystem-assessment-and-roadmap.md)** | **生态对齐与路线图** | 与 Hermes / OpenClaw / dsh-mnemon 等生态方案的边界共存分析。 |

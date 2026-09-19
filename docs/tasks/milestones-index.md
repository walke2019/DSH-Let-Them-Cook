# DSH Let Them Cook — 历史里程碑汇总索引 (Milestone Summary Index)

本文档归档项目演进中的各阶段核心里程碑，所有技术细节已收敛重构于四大长效领域专著（`docs/agents/01~04`）与架构白皮书（`docs/architecture/`）。

---

## 📌 历史里程碑总览

| 阶段分组 | 核心目标与交付内容 | 归口长效专著 | 标准验证套件 |
| :--- | :--- | :--- | :--- |
| **P1 ~ P10** | 核心调度内核、任务信封（Assignment）、Mailbox 邮箱机制、工作流 DAG 与结构化交付 | `docs/agents/02-tools-and-ledger.md`<br>`docs/agents/03-orchestration-and-anti-stall.md` | `suite-01-room-and-lifecycle.cjs`<br>`suite-02-workflow-dag.cjs` |
| **P11 ~ P20** | 零入侵 HUD 伴随舱布局、安全 prepare 契约、自动建群草案与人话文案 | `docs/agents/01-ui-and-lifecycle.md`<br>`docs/agents/04-i18n-personas-workspaces.md` | `suite-01-room-and-lifecycle.cjs`<br>`suite-05-personas-and-i18n.cjs` |
| **P21 ~ P40** | 官方对话 100% 隔离（零污染红线）、右侧 24px 对称避让、公共样式 Token 与渐进式展开 | `docs/agents/01-ui-and-lifecycle.md` | `suite-01-room-and-lifecycle.cjs` |
| **P41 ~ P60** | 全栈中英双语运行时、五大世界观主题人设（沙雕/现代/提瓦特/三国/科技传奇）、任务长短分层 | `docs/agents/04-i18n-personas-workspaces.md` | `suite-05-personas-and-i18n.cjs` |
| **P61 ~ P80** | 看门狗超时熔断、Universal Master Handoff 完工必回主控、输入框常驻底部与长消息折叠遮罩 | `docs/agents/03-orchestration-and-anti-stall.md`<br>`docs/agents/01-ui-and-lifecycle.md` | `suite-03-runtime-anti-stall.cjs` |
| **P81 ~ P98** | DSH 底座原生工具直通、真实 Prompt Cache 计费解析、实时 250ms 行号 Diff、交互式拍板卡片与五阶段收官 | `docs/agents/02-tools-and-ledger.md`<br>`docs/agents/03-orchestration-and-anti-stall.md` | `suite-04-tools-and-ledger.cjs`<br>`suite-06-e2e-closed-loop.cjs` |

---

## 🔒 治理结论
所有历史切片已全面收敛升级为 **“6 大标准领域测试套件 + 4 大长效领域专著”**。后续开发不再新增任何 `Pxx` 切片文档或切片单测。

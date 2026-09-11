# Agents 专属规范与避坑宪章专区 (Agents & Runtime Norms)

本目录是专为参与 `DSH Let Them Cook` (DSH 开整天团) 编码的 **AI Coding Agent** 以及在运行时运行的 **业务 Participant Agent** 设立的规范专区，与根目录 `AGENTS.md` 紧密联动，按业务领域提供详细的架构规范、插槽生命周期、工具契约与避坑指南。

---

## 目录结构与领域划分

| 文档 | 领域分类 | 核心契约与关注点 |
| :--- | :--- | :--- |
| **[01-ui-and-lifecycle.md](./01-ui-and-lifecycle.md)** | **UI 布局、插槽生命周期与交互规范** | `conversation.view` prepare 契约、HUD 避让、源版对话零污染、新会话 Blank Hero 防线、输入框视口贴底。 |
| **[02-tools-and-ledger.md](./02-tools-and-ledger.md)** | **原生工具调用、流式状态机与计费审计** | DSH 原生工具白名单直通、250ms 流式工具探针、行号 Diff (+add -del)、Prompt Cache 真实命中率解析。 |
| **[03-orchestration-and-anti-stall.md](./03-orchestration-and-anti-stall.md)** | **调度编排、防死循环与自愈机制** | Universal Master Handoff 完工必回主控、阶段流转双语模糊识别、看门狗超时报警信自愈、长任务 24 轮预算。 |
| **[04-i18n-personas-workspaces.md](./04-i18n-personas-workspaces.md)** | **国际化、主题化与工作区隔离** | 全栈中英双语运行时、科技传奇专属世界观、中央空态主题文案差异化、工作区与房间持久化隔离。 |

---

## 核心原则

1. **零污染底座**：严禁修改 `@deepseek-ai/dsh` 核心源码，严禁修改全局 AppFrame 宽度，严禁在官方对话注入全局污染样式；
2. **直通原生能力**：杜绝虚拟假工具，必须直接挂载底座原生 `read`/`edit`/`bash`/`grep`/`glob` 等真实工具；
3. **闭环汇报收口**：SubAgent 专员完工必须回传 `commander` 主 Agent 收口，杜绝无休止自激或任务悬挂；
4. **双语对齐**：根目录 `README.md` 默认英文支持中文，代码注释英文，运行时文案根据环境语言动态切换。

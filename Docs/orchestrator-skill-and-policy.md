# DSH Group Chat Orchestrator Policy

## 1. 产品定位

`dsh-group-chat` 的核心定位是高自由度多 Agent 项目协同引擎。用户应能在中间对话区用自然语言描述项目任务，由扩展自动组织角色、工作流、模型建议和执行策略，而不是要求用户先理解大量配置项。

默认边界：自由协同优先，主 Agent 控方向，SubAgent 主动执行；不清楚才追问，高风险写入先确认，工作流与账本负责防跑偏和防失控。

## 2. 默认创建机制

1. 用户在中间对话区描述需求。
2. 插件识别是否为“角色/工作流/项目小队/自动配置”意图。
3. 如果描述不清，自动配置助手追问一个关键问题。
4. 如果描述明确，生成待确认草案，包含：角色、工作流、主 Agent + SubAgent 策略、工具路由、模型能力标签。
5. 用户明确确认后，草案写入当前工作区配置。
6. 用户取消或继续补充时，不写入或重新生成。

## 3. 主 Agent + SubAgent 策略

- 主 Agent：`commander`。
- SubAgent：`researcher`、`backend`、`frontend`、`qa`、`writer` 等专业角色。
- 主 Agent 负责理解、追问、拆解、派发、审批、冲突收敛和最终结论。
- SubAgent 负责专业执行和汇报，不越权代替其他角色。

## 4. DSH workflow 并发保留

必须保留 DSH workflow 触发多 Agent 并发执行的能力。规则是：

- 同一阶段内多个 `assignedRoleIds` 可以并发执行。
- 并发的每个 Agent 只处理自己的职责片段。
- 阶段结果回传主 Agent，由主 Agent 决定是否推进、驳回或要求补充。

## 5. 工具路由策略

工具任务按唯一责任人归口，避免全员重复调用：

| 任务类型 | 责任 Agent |
|---|---|
| Web 搜索、资料爬取、出处抽取、竞品调研 | researcher |
| 后端逻辑、状态机、接口、数据结构、服务端代码 | backend |
| 前端组件、React/TS/CSS、视觉美化、浏览器 UI 调试 | frontend |
| 回归测试、边界用例、红队审计、质量门控 | qa |
| 文档、用户说明、结题摘要、发布说明 | writer |
| 分派、归纳、审批、冲突裁决 | commander |

禁止多个 Agent 对同一个搜索/爬取/修改/测试任务重复并发调用。

## 6. 模型能力标签

模型推荐不应硬编码唯一模型 ID，应使用能力标签：

| Agent | requiredCapabilities | 倾向 |
|---|---|---|
| commander | reasoning, long_context | 质量优先，能做审核和收敛 |
| researcher | web_research, tool_use, data_extraction | 工具调用稳定，长文本整理好 |
| backend | coding, reasoning, tool_use | 代码和架构强 |
| frontend | coding, ui_design | React/TS/CSS 与视觉一致性强 |
| qa | qa_audit, reasoning | 边界推演和审计强 |
| writer | writing, fast_reply | 表达清楚、成本低、速度快 |

用户手动模型配置优先；其次最近模型；再次 Provider 模型目录匹配；最后宿主默认模型兜底。

## 7. 扩展 + Runtime Skill 分工

- 扩展负责：UI、工作区状态、角色配置、工作流、账本、确认写入、事件流、模型拦截。
- 运行时 Skill `dsh-group-chat-orchestrator` 负责：默认协同协议、角色职责边界、工具路由、模型能力标签、Token 节俭规则。
- 不修改 DSH 核心，不直接改官方 preset；插件内先定义“默认协同 / Auto Fleet”，后续等 DSH 提供稳定 preset API 再注册官方模式。

## 8. Runtime Skill 放置位置

`src/skills/dsh-group-chat-orchestrator/SKILL.md` 是随插件源码维护的 DSH 运行时协同协议。构建后由 `src/engine/orchestrator-skill.ts` 的摘要注入到群聊 Agent system prompt。它不是给 Codex 开发助手自动调用的 Skill，也不依赖 `C:\Users\Administrator\.codex\skills`。

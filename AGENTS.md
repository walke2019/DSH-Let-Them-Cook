# AGENTS.md — DSH Let Them Cook 现代 Agent 原生工程架构宪章

本文件是面向所有参与 `@dsh-external/dsh-let-them-cook` 核心开发、重构与功能演进的 **AI Coding Agent** 以及群聊协同中的 **Participant Agent** 的最高工程宪法。

本项目全面践行 **“面向未来的 Agent 原生架构（Agent-Native Architecture）”**：
**坚决不搞任何临时补丁（Monkey Patch）、坚决不做任何隐式降级兜底（Implicit Fallback）。完全一新，契约优先，编译即守护！**

---

## 零、三纯原则：面向未来的现代开发范式 (Three Pure Pillars)

1. **类型契约即一切（Types as Single Source of Truth）**
   - 系统的输入、输出、状态机流转与插槽挂载，全部由 TypeScript 强类型（`src/types.ts`）严格定义。
   - 严禁使用模糊猜测、正则别名匹配（Regex Alias Guessing）或 `any` 逃逸。未定义字段立即在编译期拒绝，杜绝运行时容错胶水代码。

2. **零隐式兜底，边界显式阻断（Zero Fallback, Loud Throw at Seams）**
   - 严禁隐式“吞错误”或“猜上下文”。当 Agent Turn 缺失数据、工具调用越权或任务超时时，必须**立即显式抛出结构化异常或生成明确的失败状态**，杜绝“默默降级到历史消息寻找兜底”。
   - 明确的状态断言让后续推理的 Agent 拥有 100% 确定性的认知，杜绝双轨逻辑造成的幻觉。

3. **零过程性杂质与测试硬防护（Anti-Bloat Engineering Firewall）**
   - **文档总数硬封顶 `<= 15`**：严禁新建任何切片、临时过程记录（如 `pXX`、临时 patch 日志），所有演进知识直接收敛重写于 `/docs` 长效专著。
   - **测试文件硬封顶 `<= 8`**：严禁为单一 issue 新增切片测试脚本，全量行为验证必须收敛在 6 大标准领域套件（`__tests__/suite-01~06.cjs`）。超额流水线直接阻断。

---

## 🧭 四大长效领域架构专著索引 (Architecture Domain Matrix)

所有业务模型、系统设计与领域实现，分别且唯一收敛于以下四大长效领域专著：

| 领域模块 | 领域专著全景指南 | 核心架构契约与纯血规范 |
| :--- | :--- | :--- |
| **1. UI & 生命周期** | **[docs/agents/01-ui-and-lifecycle.md](./docs/agents/01-ui-and-lifecycle.md)** | • **0 独立 Tab、0 输入框入侵**：100% 融入原生对话，仅以右侧 HUD 伴随舱作为唯一扩展入口。<br>• **强契约视图注入**：中间视图强制挂载稳定 `prepare` 契约，切换会话时完全无状态残留。 |
| **2. 工具与计费账本** | **[docs/agents/02-tools-and-ledger.md](./docs/agents/02-tools-and-ledger.md)** | • **DSH 原生工具直通**：真实映射底座原生能力（read/edit/bash/grep/glob），拒绝虚拟假工具。<br>• **真实 Prompt Cache 计费**：跨网关精准解析 cached_tokens，拒绝 0 命中误报。<br>• **行号流式 Diff 广播**：毫秒级捕获代码变更行号差异。 |
| **3. 调度与防死锁** | **[docs/agents/03-orchestration-and-anti-stall.md](./docs/agents/03-orchestration-and-anti-stall.md)** | • **Universal Master Handoff**：专员完工必须且只能回传总指挥官（commander）收口，根除死循环。<br>• **DAG 自动化质量门禁**：阶段晋级由 `verifyCommand` 阻断式把关，未通过直接拒绝流转。 |
| **4. 国际化与主题** | **[docs/agents/04-i18n-personas-workspaces.md](./docs/agents/04-i18n-personas-workspaces.md)** | • **全栈中英双语运行时**：System Prompt、UI 文案、API 契约全面本地化。<br>• **五大世界观独立调性**：沙雕、现代、提瓦特、三国、科技传奇人设声线隔离。<br>• **工作区作用域隔离**：按官方 Session 强隔离房间数据，严禁跨会话串台。 |

---

## 一、群聊协作智能体（Participant Agent）行为宪律

1. **专职专责，拒绝越俎代庖**：每个 Agent 仅代表其绑定的角色（Persona）执行并输出，禁止代答其他专业领域的决策。
2. **静默标记（Silence Token）**：非专属任务且无需补充时，必须且只能输出 `NO_REPLY`，中枢拦截不打扰用户。
3. **禁止相互客套（Anti-Loop）**：绝对禁止互相附和、重复致谢或自激触发；专员执行结果直接产出结构化交付块，移交总指挥官收口。
4. **能力安全隔离**：群聊子智能体严禁持有外呼/破坏性未受控工具，所有执行经由中枢账本与审批事务卡片受控流转。

---

## 二、项目开发智能体（AI Coding Agent）工程纪律

1. **根目录绝对纯洁**：根目录仅允许存在 `README.md` 与 `AGENTS.md`。
2. **README 默认地道英文**：顶部必须包含中文完整文档切换链接。
3. **不破坏底座核心源码**：严禁修改 `@deepseek-ai/dsh` 底座代码，所有接入点均经由 Cordis 扩展机制及原生插槽注入。
4. **编译与回归闭环**：任何改动必须确保以下三道门禁 100% 秒级全绿：
   ```bash
   npm run typecheck    # 1. 强类型静态检验（零类型逃逸、零隐式 any）
   npm test             # 2. 6 大领域行为测试（100% 确定性，~2 秒秒级通过）
   npm run preflight    # 3. 全局架构与硬上限防火墙核验
   ```

---

## 三、确定性架构契约守则 (Deterministic System Contracts)

1. **零兼容补丁**：不写针对旧版本格式推导的容错分支；若结构升级，在数据接入边界完成一次性强类型校验解析。
2. **零隐式兜底**：如果任务执行超时，看门狗立即将任务置为 `failed` 并注入警报信，严禁假装正常并猜测上下文继续执行。
3. **确定性测试断言**：测试脚本只针对输入行为与系统状态机输出进行确定性断言（`assert.deepEqual`），严禁使用“读取源码文本看是否包含某字符串”的伪测试。
4. **经验即代码，契约即文档**：一切技术规约直接收敛体现在代码结构、TypeScript 类型和长效领域专著中，不再维护任何临时过程文档。

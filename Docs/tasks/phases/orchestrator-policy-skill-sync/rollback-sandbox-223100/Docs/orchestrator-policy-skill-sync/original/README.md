# DSH Group Chat (多 Agent 角色协同与群聊插件)

[![Cordis Plugin](https://img.shields.io/badge/Cordis-v4-blue.svg)](https://cordis.chat/)
[![DSH Powered](https://img.shields.io/badge/DeepSeek--Harness-Compatible-green.svg)](https://github.com/deepseek-ai)
[![Architecture](https://img.shields.io/badge/Architecture-Dual--Face-orange.svg)](#)

`dsh-group-chat` 是专为 **DeepSeek Harness (DSH)** 打造的工业级多智能体（Multi-Agent）群聊协同扩展插件。  
借鉴并深度吸收了 **NousResearch Hermes Agent (Bot Mode)** 的具名智能体名册管理、**OpenClaw** 的静默契约（Silence Token `NO_REPLY`），以及 **OmniRoute** 的弹性容灾与 Token 节俭协议，将现代即时通讯（IM）与流程化工作流（Workflow Pipeline）机制完整引入 DSH 会话体系中。

通过在一个公共群聊会话中容纳多个具备独立角色定义（System Prompt / Persona）、独立模型 ID（DeepSeek-V3 / Claude 3.7 Sonnet / GPT-4o / 本地 Ollama 等）的专职 Agent，实现真正意义上的全行业通用人机混合协同。

---

## 🌟 核心特性

1. **总指挥官全盘统筹与审核门控 (Commander Gatekeeper)**：
   - 确立 `commander`（总指挥官）为团队最高裁决枢纽，负责目标拆解、任务分工规划与各阶段交付物的严格审核门控（Approval Gate）；
   - 具备审核批准（Approve）与驳回重整（Reject）特权，把控交付质量，严防劣质成果外溢。
2. **六大专职责权划分与外呼能力隔离 (Role Capability Matrix)**：
   - **`commander` (总指挥官)**：全盘任务把控、分工派发、门控审核与最终签字结题；
   - **`researcher` (搜索调研专家)**：独占 Web 外部搜索、网页抓取解析与结构化情报简报能力（已内置外呼检索桥接）；
   - **`backend` (核心后端架构师)**：数据实体建模、业务逻辑实现、接口契约与高并发安全；
   - **`frontend` (交互体验设计师)**：UI 交互动线、视觉卡片美化与用户体验优化；
   - **`qa` (红队质量审计官)**：`audit_only` 纯审计权限，极限用例推演、并发安全审计与死锁风险检验；
   - **`writer` (首席文案记录官)**：提炼各环节阶段性共识覆写共享黑板（Shared Scratchpad），并编写交付物。
3. **流程化工作流流水线 (Workflow Pipeline) 与细粒度权限控制 (ACL)**：
   - 内置五阶段闭环流水线：`调研预研` ➔ `指挥官审核与分工` ➔ `前后端协同原型` ➔ `红队质量审计` ➔ `文档沉淀结题`；
   - 支持跨行业通用业务流定制（投研分析、影视创作、法务咨询、医疗会诊、研发攻坚等）；
   - 严格权限隔离：黑板覆写与流程审批实施特权校验，防止权限越界与状态篡改。
4. **多套系名号主题库一键切换 (Persona Theme Mapping)**：
   - 支持运行时一键热切换智能体名号映射风格，智能体发言自动适配对应人设、口头禅与主题色：
     - 🎨 **现代经典 (Default Modern)**：阿尔法总指挥官 / 深潜情报调研员 / 核心后端架构师 / 交互体验设计师 / 红队质量审计官 / 首席文案记录官；
     - 🪶 **三国风云 (Three Kingdoms)**：诸葛亮 (孔明) / 司马徽 (水镜先生) / 关羽 (云长) / 周瑜 (公瑾) / 魏延 (文长) / 陈琳 (孔璋)；
     - 🍏 **现代传奇 (Innovation Legends)**：史蒂夫·乔布斯 / 居里夫人 / 林纳斯·托瓦兹 / 达芬奇 / 纳西姆·塔勒布 / 海明威。
5. **仿 QQ / Telegram 群聊交互面板**：
   - 多角色头像与色标气泡流，清晰区分人类、不同 Agent 及系统通知；
   - 顶部贯穿工作流流水线进度卡片与总指挥官快捷审批栏；
   - 各 Agent 拥有独立的模型徽标（Badge）与思考链（Thinking Block）折叠区；
   - 智能 `@` 联想补全与快捷指令（如 `@全员争鸣`、`@总指挥审核`）。
6. **防死循环四重保险与 Token 节俭架构**：
   - **严格 @Mention 模式**：无呼唤不触发，日常消息静默进入环形缓冲区；
   - **工作流驱动模式 (Workflow-Driven)**：按阶段精确唤醒责任角色，自动流转至指挥官审批；
   - **静默标记 (Silence Token `NO_REPLY`)**：自评无需发言时输出 `NO_REPLY`，调度中枢零渲染拦截；
   - **单轮硬性熔断 (Circuit Breaker)**：限制单次指令最大自主互动轮数（默认 6 轮），根除 Bot 间相互致谢自激死循环；
   - **共享工具总线 (Shared Tool Bus)**：参数哈希去重与 In-Flight Promise Hook，阻断微秒级并发踩踏；
   - **上下文投影压缩 (Context Projection)**：未提及历史自动转为轻量索引标头，节省 85%+ Token。

---

## 📂 项目结构

本项目严格遵循规范管理，除根目录的 `README.md` 与 `AGENTS.md` 外，其余所有架构设计、业务规格与技术文档统一归档于 `/Docs` 目录下：

```
dsh-group-chat/
├── README.md                 # 项目概述、功能特性与快速指南
├── AGENTS.md                 # 多 Agent 协同操作守则、跨角色交互规范与边界
├── docs/                     # 统一文档中心
│   ├── technical-architecture.md  # 详细技术架构设计与可行性分析报告
│   ├── business-specification.md  # 业务功能规格、UI 交互与实施路线图
│   ├── dispatch-engine.md         # 调度引擎运作原理与防死循环协议
│   ├── fault-tolerance-and-token-thrift.md # 容灾降级、工具总线与 Token 节俭规约
│   ├── standards-and-extensibility.md      # DSH 规范接入标准与高可扩展性规约
│   └── workflow-and-role-personas.md       # 角色体系、流程化工作流引擎与主题昵称映射规约
├── package.json              # 插件元数据与依赖定义
├── tsconfig.json             # TypeScript 编译配置
├── tsdown.config.ts          # Web Client 打包配置 (Rolldown)
├── scripts/
│   └── build.sh              # 依赖软链与 Host + Client 一键打包脚本
├── src/                      # Host 端源码 (Cordis 扩展)
│   ├── index.ts              # 插件入口，注册服务、API 与拦截点
│   ├── types.ts              # 核心 TypeScript 契约与类型定义
│   ├── engine/               # 调度中枢与业务引擎
│   │   ├── arbiter.ts        # 调度仲裁器、防死循环与工作流分流
│   │   ├── workflow-orchestrator.ts # 流程化工作流编排与权限闸门
│   │   ├── themes.ts         # 现代/三国/现代传奇多套主题名号库
│   │   ├── research-bridge.ts# 搜索调研外呼检索与情报清洗桥接
│   │   ├── projection.ts     # 上下文投影与 Token 节俭标头压缩
│   │   ├── tool-bus.ts       # 共享工具总线与并发防踩踏
│   │   ├── resilience.ts     # 模型弹性容灾与级联降级
│   │   └── room-manager.ts   # 房间状态机、成员名册与记账审计
│   ├── tools/                # 暴露给智能体与用户的交互工具集
│   │   └── index.ts          # 消息发送/名号切换/流程审批/状态查询/纪要导出
│   └── client/               # Web Client 前端源码 (React)
│       ├── index.ts          # 前端入口，向 conversation.view 注入 Tab
│       └── GroupChatPanel.tsx# 仿 TG 群聊、工作流看板与名号切换工作区
```

---

## 🚀 快速开始

### 1. 环境依赖
- 本地安装并运行中的 DeepSeek Harness (`http://127.0.0.1:3080`)
- 已装配 `dsh-super-injector`（具备 `dev_*` 系列插件开发与注入工具）
- Node.js >= 20, npm / pnpm, Git

### 2. 构建与热注入
在 DSH 工作台中或通过命令行执行：
```bash
# 1. 编译 Host 与 Client 产物
bash scripts/build.sh

# 2. 运行时无重启热注入
dev_inject_plugin --dir "C:/项目/dsh-group-chat"
```

注入成功后，刷新 Web GUI 即可在对话主视口上方看到新增的 **[群聊协作]** 视图 Tab，体验多角色流程化协同。

---

## 📜 许可协议
MIT License

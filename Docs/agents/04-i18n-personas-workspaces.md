# 04 - 国际化、主题化与工作区隔离 (i18n, Personas & Workspaces)

本文档规范全栈中英双语运行时契约、主题人格设计、空状态文案差异化及工作区持久化隔离。

---

## 1. 核心契约与铁律

### 1.1 全栈中英双语运行时与角色全覆盖
- 全端支持 `zh-CN` 与 `en-US` 无缝切换；
- 用户端文案、系统提示词（System Prompt）、角色口头禅、工作流阶段描述全面覆盖双语；
- 杜绝英文用户发送指令时被中文系统提示带回中文回复；
- 统一走 `src/client/i18n.ts` 的 `tx(locale, zh, en)`；
- 源码内部代码注释保持纯英文；
- 详见：[docs/tasks/phases/p47-bilingual-ui-and-tool-scope/README.md](../tasks/phases/p47-bilingual-ui-and-tool-scope/README.md)、[docs/tasks/phases/p57-agent-runtime-prompt-i18n/README.md](../tasks/phases/p57-agent-runtime-prompt-i18n/README.md)、[docs/tasks/phases/p61-english-source-bilingual-runtime/README.md](../tasks/phases/p61-english-source-bilingual-runtime/README.md)、[docs/tasks/phases/p85-bilingual-role-coverage/README.md](../tasks/phases/p85-bilingual-role-coverage/README.md)。

### 1.2 中央空态文案主题差异化
- 中间 `Agent 群聊` 对话区空态标题、副标题、三步指引必须跟随当前 `room.activeTheme` 动态展现：
  - `default` / `meme_comedy`：沙雕整活风（如“把活儿丢进群，AI 小队开整”）
  - `modern`：现代高管风（如“项目作战室已就绪”）
  - `legends`：科技巨头来打工（如“科技传奇已就位，等你开发布会”）
  - `three_kingdoms`：三国风云军帐风（如“军帐已开，等你下令”）
  - `genshin`：原神提瓦特委托风（如“冒险委托板已打开”）
- 详见：[docs/tasks/phases/p45-theme-aware-central-copy/README.md](../tasks/phases/p45-theme-aware-central-copy/README.md)、[docs/tasks/phases/p75-distinct-theme-empty-copy/README.md](../tasks/phases/p75-distinct-theme-empty-copy/README.md)。

### 1.3 科技传奇专属调性阵容
- 主题 `legends`：
  - `commander`: 史蒂夫·乔布斯（极致产品主义，现实扭曲力场）
  - `researcher`: 埃隆·马斯克（第一性原理，火星工程学）
  - `backend`: 黄仁勋（算力堆叠与加速架构，皮衣战神）
  - `frontend`: 雷军 / 雷布斯（全面对标极致性价比，Are you OK）
  - `qa`: 比尔·盖茨（软件工程质量与生态准则）
  - `writer`: 张小龙（克制与产品心流）
- 详见：[docs/tasks/phases/p60-tech-legends-theme/README.md](../tasks/phases/p60-tech-legends-theme/README.md)。

### 1.4 工作区会话隔离与房间持久化
- 从官方 session 派生稳定 `roomId`，杜绝跨 session 串台；
- 房间、消息（最近 200 条）、任务信封、黑板、账本全部持久化至 `.pm-workflow/dsh-group-chat/` 工作区目录；
- 换工作区或切换会话时自动清空历史并拉取新作用域数据；
- 详见：[docs/tasks/phases/p53-message-ledger-persistence/README.md](../tasks/phases/p53-message-ledger-persistence/README.md)、[docs/tasks/phases/p74-session-scoped-room-binding/README.md](../tasks/phases/p74-session-scoped-room-binding/README.md)。

### 1.5 HUD 语言切换独立入口
- HUD 标题栏顶部设置独立的 `中 / EN` 切换按钮，不侵占 300px 紧凑侧栏空间；
- 详见：[docs/tasks/phases/p76-hud-locale-toggle-header/README.md](../tasks/phases/p76-hud-locale-toggle-header/README.md)。

---

## 2. 自动化回归命令
- `npm run test:bilingual-ui` — 双语 UI 与工具作用域回归
- `npm run test:agent-runtime-prompt-i18n` — 运行时提示词双语回归
- `npm run test:tech-legends-theme` — 科技传奇主题回归
- `npm run test:distinct-theme-copy` — 主题空态文案差异化回归
- `npm run test:session-room-binding` — 会话与房间绑定隔离回归
- `npm run test:hud-locale-toggle-header` — HUD 语言切换按钮回归

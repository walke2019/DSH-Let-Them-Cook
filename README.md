# DSH Group Chat（工作区级多 Agent 群聊编排插件）

`dsh-group-chat` 是运行在 DeepSeek Harness (DSH) 上的 Cordis 扩展插件。它的目标不是替换官方对话，而是在当前会话中新增一个 **Agent 群聊** 工作区：用户用一句话描述项目任务，扩展生成角色与工作流草案，用户确认后写入当前工作区，再由主 Agent 统筹 SubAgent 并发推进、质检和收口。

## 当前核心能力

- **中间 `Agent 群聊` 标签**：通过 `conversation.view` 安全注册，保留官方 `对话` 原样可用。
- **右侧 `群聊控制台 (HUD)`**：通过 `shell.overlay` 覆盖停靠，展示工作流、执行导演台、黑板、账本、角色和模型配置。
- **一句话建群/建工作流**：信息足够则生成草案；不足则追问；确认后才写入。
- **主 Agent + SubAgent**：`commander` 负责理解、拆解、派发、审核、收口；`researcher/backend/frontend/qa/writer` 分别执行专业任务。
- **工具归口与防重复**：搜索/爬取只归口 researcher，前端/UI 归口 frontend，QA 归口 qa，避免全员重复调用。
- **工作区作用域**：角色、主题、工作流、最近模型、回退模型、黑板、assignment、mailbox 默认写入 `.pm-workflow/dsh-group-chat/`。
- **HUD 布局稳定性**：右栏可浮动、可停靠、可拖动、左边线可缩放；不挤压官方 AppFrame；只让 `Agent 群聊` 自身避让。
- **中/英文自动匹配**：客户端跟随浏览器语言或用户选择，服务端 API、工具输出、Agent Prompt、主题/工作流生成内容支持 `zh-CN / en-US`。
- **开源友好源码**：`src/**/*.ts(x)` 注释与内部工程说明优先英文；用户可见文案继续保留双语运行能力。

## 已内置主题

- 默认（沙雕整活）
- 沙雕整活
- 原神提瓦特
- 现代精英
- 三国风云
- 科技传奇（乔布斯 / 马斯克 / 黄仁勋 / 雷布斯 / 比尔·盖茨 / 张小龙）

默认创建使用“沙雕整活”，但角色输出必须说人话、有趣、不水字数，并服务任务推进；切换到“科技传奇”时会营造科技巨头为用户打工的项目小队氛围。

## 项目结构

```text
dsh-group-chat/
├── README.md
├── AGENTS.md
├── Docs/
│   ├── README.md
│   ├── TODO.md
│   ├── business-specification.md
│   ├── technical-architecture.md
│   ├── dispatch-engine.md
│   ├── standards-and-extensibility.md
│   ├── workflow-and-role-personas.md
│   └── ... P 阶段专项文档与验证记录
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── compat/
│   ├── engine/
│   └── client/
├── scripts/
├── lib/
├── package.json
├── tsconfig.json
└── tsdown.config.ts
```

## 开发与验证

```bash
npm run typecheck
npm run build:all
npm run test:matrix
npm run preflight
```

本地 DSH Web 通常运行在：

```text
http://127.0.0.1:3080/
```

UI 改动必须额外浏览器验证：

- 官方 `对话` 仍可用。
- `Agent 群聊` 标签存在且不触发 `prepare` 报错。
- HUD 不遮挡中间输入框。
- HUD 文本不撑破右栏。
- 左侧官方栏展开/收起时中间布局正常。

## 提交前检查

当前目录若尚未初始化 Git，先执行 `git init` 并配置远端；提交前建议跑：

```bash
npm run build:all
npm run preflight
npm run test:matrix
```

最近一次完整矩阵已通过：`TEST_MATRIX_EXIT:0`。

## 文档入口

详见：`Docs/README.md`。

## 许可

MIT License
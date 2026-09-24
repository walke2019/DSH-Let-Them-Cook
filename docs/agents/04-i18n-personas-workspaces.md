# 04-i18n-personas-workspaces.md — 国际化、主题化与工作区隔离

本指南聚焦于 **全栈中英双语国际化、五大主题世界观声线以及会话工作区物理隔离**。

> 命名约定：对外安装身份为 `@dsh-external/dsh-let-them-cook`；`.pm-workflow/dsh-group-chat/` 是内部工作区 namespace，必须保持稳定以避免已有会话状态丢失。

---

## 🏛️ 核心架构契约

### 1. 全栈中英双语运行时（Full-Stack Bilingual Runtime）
- System Prompt、ContextProjection、UI 交互文案、API 报错提示均支持 `zh-CN` 与 `en-US` 严格双语化。
- 动态继承用户前端语言环境，杜绝英文对话被中文系统提示带偏。

### 2. 五大独立世界观主题（Theme Worldviews）
- 支持 `default`（默认沙雕）、`meme_comedy`（整活调性）、`genshin`（提瓦特委托）、`three_kingdoms`（三国策论）、`tech_legends`（科技传奇巨头）与 `modern`（现代敏捷）。
- 每个主题拥有完全独一无二的中央空态文案、角色台词与声线，绝不雷同。

### 3. 会话作用域物理隔离（Workspace Isolation）
- 从 DSH 官方会话强推导房间作用域（Room ID），切换会话彻底重置内存状态与消息池，杜绝跨会话串台。
- 角色配置、任务信封、账本流水统一持久化于本地工作区 `.pm-workflow/dsh-group-chat/`。

---

## 🧪 对应标准验证套件
- `__tests__/suite-05-personas-and-i18n.cjs`（世界观文案与双语化）
- `__tests__/suite-01-room-and-lifecycle.cjs`（会话物理隔离）

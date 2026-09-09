# P47 — Agent 群聊中/英文业务文案与工具白名单兼容

## 背景

用户要求把“中/英文语言业务功能”作为真实开发任务推进，并在 Chrome 浏览器里监控群聊面板运行情况。

## 实现内容

- 新增 `src/client/i18n.ts`：
  - 自动读取 `localStorage['dsh-group-chat.locale']`；
  - 默认按浏览器语言识别 `zh-CN / en-US`；
  - 提供 `setGroupChatLocale()` 与 `onGroupChatLocaleChange()`，用于跨中央面板与 HUD 同步切换；
  - 提供轻量 `tx(locale, zh, en)`，避免一开始引入笨重 i18n 框架。
- 中央 `Agent 群聊` 面板支持主题化中/英文：
  - 首屏引导；
  - 快捷任务模板；
  - Agent 状态浮窗；
  - 输入框、@ 角色选择与发送按钮。
- 右侧 HUD 支持核心业务文案中/英文：
  - 主题 / 调度模式 / 语言选择；
  - 团队 / 工作流 / 黑板 / 账本标签；
  - 团队面板、构建工具箱、账本搜索与基础操作；
  - 工作流面板核心状态文案；
  - 黑板编辑文案。
- 修复 Chrome 实测发现的工具白名单兼容问题：
  - 旧状态中的 `workflow_advance_stage` 自动映射为 `group_chat_workflow_advance`；
  - 旧状态中的 `workflow_reject_stage` 自动映射为 `group_chat_workflow_reject`；
  - `tools.restrict()` 在宿主暂时无法枚举工具时，遇到 unknown global tools 会按错误里返回的 known tools 二次收敛，避免整个角色 turn 因陈旧白名单直接失败。

## Chrome 实测记录

- 页面：`http://127.0.0.1:3080/`
- 浏览器：Chrome
- 入口：官方 `对话 / 轨迹 / Agent 群聊` 三标签中的 `Agent 群聊`
- 中文检查：中央首屏、输入框、HUD 标题、团队/工作流/黑板/账本均显示中文。
- 英文检查：切换 `Lang -> English` 后，中央首屏、快捷模板、输入框、HUD 标题、团队/工作流/黑板/账本均显示英文。
- 控制台：本轮 UI 切换检查 `errorCount = 0`。
- 真实 Agent 调用监控：旧工具名导致的 `tools.restrict() names unknown global tools` 已消失；随后暴露的是当前模型 `cpa/gemini-3.8-flash-high` 30 秒超时，属于模型可用性/耗时问题，不是白名单生命周期问题。

## 后续注意

- 角色名称、角色头衔、用户自定义主题内容是用户/工作区数据，不强制翻译。
- 服务器工具返回仍以中文为主；后续若要完整英文化，可在 host API 增加 `locale` 参数或房间级 locale 字段。
- 中央面板和 HUD 的业务文案已具备 zh-CN/en-US 基础切换能力；新增 UI 文案必须走 `tx()` 或后续统一字典。

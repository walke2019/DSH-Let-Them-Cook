# P15 — 一句话智能建群与工作流确认流

更新日期：2026-09-09

## 目标

把 `Agent 群聊` 从“需要用户先理解角色/主题/调度模式的配置工具”，推进为“用户一句话启动 AI 小队”的可用入口。

用户在中间对话区描述任务后，插件应该：

1. 由主 Agent 语义理解任务；
2. 信息不足时先追问；
3. 信息足够时生成当前工作区专属的角色草案、工作流草案、模型能力建议与工具路由；
4. 在中间消息流中展示待确认草案卡片；
5. 用户确认后才写入 `.pm-workflow/dsh-group-chat/` 工作区配置；
6. 写入后以 `commander` 主 Agent + 多个 SubAgent 的策略执行，保留 DSH workflow 阶段内并发。

## 产品原则

- **少设置**：默认主题为沙雕，默认调度为工作流驱动，默认角色为 commander/researcher/backend/frontend/qa/writer。
- **不乱写**：草案必须确认后写入；取消或继续补充不会污染当前工作区配置。
- **不重复工具调用**：搜索/爬取只归口 researcher；代码、UI、测试、文档按专员分流。
- **不是普通群聊**：群聊只是用户友好外壳，本质是任务导演型多 Agent 工作台。
- **有趣但交付靠谱**：主题人格影响角色名、阶段名、状态文案和提示语，但每条输出都要推进任务。

## 交互流

```text
用户输入：帮我给这个工作区搭一套能修插件 UI 的 agent 小队
  ↓
classifyAutoSetupIntent()
  ↓
信息足够：buildAutoSetupDraft()
  ↓
系统消息展示“待确认草案：角色 + 工作流”
  ↓
用户点击「确认创建」或输入“确认创建”
  ↓
applyPendingAutoSetup()
  ↓
保存到 workspaceStore: .pm-workflow/dsh-group-chat/rooms.json
  ↓
中间对话继续用工作流驱动模式执行
```

信息不足时：

```text
用户输入：帮我创建一套角色
  ↓
系统追问：这个工作区主要要完成什么任务？
  ↓
用户补充任务后再生成草案
```

## API / 运行时契约

### 中间对话自动入口

`POST /dsh-group-chat/api/message`

- `autoSetup: clarify`：信息不足，先追问；
- `autoSetup: draft`：生成待确认草案；
- `autoSetup: applied`：确认后写入；
- `autoSetup: cancelled`：取消草案。

### 显式草案接口

`POST /dsh-group-chat/api/auto-plan`

用于 UI 或测试直接生成草案，不模拟完整聊天消息。

请求：

```json
{
  "roomId": "dev-team-alpha",
  "brief": "帮我做一个本地插件 UI 修复小队"
}
```

响应：

```json
{
  "success": true,
  "draft": { "status": "awaiting_confirmation" },
  "preview": "待确认草案：角色 + 工作流"
}
```

## 当前实现

- `src/engine/auto-setup.ts`：意图识别、草案生成、主 Agent + SubAgent 策略、草案/应用文案。
- `src/engine/theme-factory.ts`：按任务 brief 生成沙雕但靠谱的角色名、人设和工作流。
- `src/engine/room-manager.ts`：`pendingAutoSetup` 暂存、`applyPendingAutoSetup()` 确认写入。
- `src/index.ts`：中间对话 `/message` 自动处理，新增 `/auto-plan` 显式草案接口。
- `src/client/GroupChatPanel.tsx`：在草案系统消息下展示确认/取消快捷按钮。

## 验收标准

- 信息过短时必须追问，不直接写入；
- 生成草案时必须仍保持 room.members 原配置不变；
- 确认后 room.pendingAutoSetup 清空，members/workflow/orchestration 写入当前工作区；
- 取消后 room.pendingAutoSetup 清空，members/workflow 不变；
- 前端草案消息显示「确认创建」「取消创建」快捷动作；
- `npm run test:matrix` 通过。

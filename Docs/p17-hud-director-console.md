# P17 — HUD 执行导演台增强

更新日期：2026-09-09

## 目标

把右侧 HUD 从“状态列表”升级成用户一眼能看懂的“执行导演台”：谁在干活、干什么、用哪个模型、下一棒是谁、工具归口如何分配。

## 产品定位

- `Agent 群聊` 是用户说任务、确认草案、看消息的主舞台；
- HUD 是后台导播台，只看执行状态、分派、账本、黑板和配置；
- HUD 不再重复聊天输入，不抢官方对话，也不让用户理解一堆底层术语。

## 当前实现

在 `src/client/GroupChatSideDock.tsx` 工作流页顶部新增 `data-dsh-gc-director-card`：

- 当前执行人：running assignment 优先，其次 queued assignment，其次主 Agent 待命；
- 当前任务：展示 assignment brief 或当前 workflow task description；
- 当前模型：展示该角色 `llmConfig.model`，tooltip 保留 provider/model；
- 下一棒：展示 ready/pending task 责任人，或主 Agent 待读 mailbox，或等待用户继续下令；
- 工具归口：用 chip 展示搜索/爬取、后端、前端/UI、QA、文档分别归口到哪个 Agent。

## 验收标准

- HUD 工作流页包含“执行导演台”；
- 展示“主 Agent 控场 · SubAgent 干活”；
- 展示“当前模型”“下一棒”；
- 展示工具路由 chip，例如“搜索/爬取 → @researcher”；
- 不恢复 HUD 聊天输入；
- 官方“对话”和中间 `Agent 群聊` 标签仍同时存在；
- `npm run test:matrix` 通过。

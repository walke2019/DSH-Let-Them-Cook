# P96 — 方案选项抉择人机交互与全量记录清空 (User Decision Options & History Reset Engine)

## 📌 背景与核心需求

用户提出了两大核心诉求：
1. **清理掉所有的群聊对话与执行记录**：将历史积压的多房间消息、未结任务与会话数据彻底清空，确保能够在完全洁净的环境下开启新任务。
2. **主 Agent 作为与用户的衔接枢纽，在有疑问时主动发起跟用户的对话交互**：当需求面临架构分叉、技术权衡或需要用户拍板时，主 Agent 不应盲目自作主张或在暗地里自闭环，而应**推荐以结构化选项的方案让用户抉择**，并在用户未作出决定前保持等待，用户拍板后立即接续分派落地。

---

## 🔍 架构与机制设计

### 1. 深度人机交互协议 (Commander Human-in-the-Loop Protocol)
在 `src/engine/projection.ts` 中升级总指挥官注入协议：
- **主动发起抉择**：在需求存在多种可能路径、关键选型权衡或重要门禁放行时，主动采用清晰规范的结构化模板向人类负责人发起交互：
  ```markdown
  【需要您拍板 / 方案抉择】：<简述疑问或决策背景>
  - 选项 A：<方案说明与利弊分析>（推荐）
  - 选项 B：<方案说明与利弊分析>
  - 指挥官推荐：<推荐选项及原因>
  请 @用户 拍板选择选项 A 或 B，我们立即开整！
  ```
- **静候用户拍板**：提出选项时，本轮严禁同时分派 SubAgent 去编写代码，保持调度静止；
- **用户选定后即刻推进**：一旦人类用户回复“选A”或“确认”，主控确认并记入全局黑板（Scratchpad），随后拆解分派 SubAgent。

### 2. 方案抉择智能识别与调度拦截 (`src/engine/arbiter.ts`)
- 新增静态识别引擎 `DispatchArbiter.detectUserDecisionRequest(text)`：
  - 自动识别 Commander 发言中的方案抉择意图（`@用户`、`【需要您拍板】`、`选项 A/B`、`（推荐）` 等）；
  - 结构化提取 `UserDecisionPrompt` 及各 `UserDecisionOption`，标注推荐选项；
- **调度熔断拦截**：当检测到 Commander 正在等待用户抉择时，`decideNextSpeakers` 返回 `isTerminal: true, nextSpeakerIds: []`，中止向 SubAgent 的自动流转；
- **自愈看门狗避让**：在 `selfHealRoom` 巡检中增加 `if (room.awaitingUserDecision) return false`，严禁自愈看门狗在人类用户思考时擅自流转。

### 3. 前端交互卡片与快捷点击 (`src/client/GroupChatPanel.tsx`)
- 当房间存在 `awaitingUserDecision` 时，在输入框上方渲染交互卡片 `gc-decision-prompt-card`：
  - 展示决策标题与推荐标识；
  - 提供可点击的选项芯片按钮（如 `⭐ 选项 A（推荐）`、`选项 B`）；
  - 点击即可自动将拍板决策填入并发送给主控，带来极佳的人机协同体验。

### 4. 全量对话与执行记录清空引擎 (`src/engine/room-manager.ts` & `src/index.ts`)
- `RoomManager.clearRoom(roomId)` / `clearAllRooms()`：
  - 清空消息列表、任务信封（assignments）、协作事件、审批事务、邮箱消息与黑板；
  - 工作流阶段重置至 `stage 0`（`in_progress`），所有子任务状态重置为 `pending`；
  - 账本重置；
  - 广播 `'room:cleared'` 与 `'room:updated'` 事件同步所有连接客户端；
- 暴露 `POST /dsh-group-chat/api/room/clear` 与 `POST /dsh-group-chat/api/rooms/clear` 接口；
- HUD 顶部控制台增加 `🧹 清空 / Clear` 快捷按钮，支持带二次确认的即刻清空。

---

## 🧪 完整任务全过程闭环验证 (`__tests__/test-p96-user-decision-and-clear-history.cjs`)

全套回归测试验证了如下完整链路：
1. **清空验证**：`dev-team-alpha` 房间历史消息、信封、黑板与阶段均被完全清空，重置为阶段 0；
2. **选项提取**：Commander 发出的图文渲染海报方案 A（纯前端 Canvas+SVG）与方案 B（Puppeteer 后端渲染）被精准解析出选项键值与推荐标识；
3. **调度静止**：Commander 提问后，系统未向任何 SubAgent 发起无效派发，稳定等待用户输入；
4. **用户拍板**：用户回复“我拍板选择：选项 A”，主控接收后记入黑板并分派阶段一 `researcher` 调研员；
5. **分工推进**：SubAgent 执行并回传 Mailbox，Commander 审核后批准推进；
6. **最终验收**：全流程 5 阶段顺利流转完毕，达成最终结题交付（`P96_USER_DECISION_AND_CLEAR_HISTORY_EXIT: 0`）。

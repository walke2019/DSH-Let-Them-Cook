# Phase 98: 官方同款提问接管输入框与交互式拍板卡片 (Official QuestionComposer Takeover & Interactive Decision Card)

## 概述 (Overview)

深度对标 DSH 官方提问交互套件 `@deepseek-ai/dsh-client-ui-user-questions` 的 `QuestionComposer` 设计标准，对 `dsh-group-chat` 中人类决策与方案拍板交互进行了彻底重构：

1. **输入区全量接管 (Composer Takeover via React Portal)**：当总指挥官发起决策或提出方案抉择时，`GroupChatComposerTakeover` 组件通过 `useComposerSeat()` 探测官方中央对话区的 `[data-composer-seat]` DOM 节点，并使用 React Portal 将 `GroupChatQuestionComposer` 直接挂载其中，完全接管底部输入区，替换为官方同款的交互式问答卡片。

2. **结构化单选与多选视觉对齐**：
   - 包含 Eyebrow 分类标识、Header 标题、以及右上角 ✕ 取消/关闭按钮；
   - 选项列表采用圆角编号 `1`, `2`, `3`，具备高光选中态与悬浮态；
   - 推荐方案带有绿色的"推荐 / Recommended"胶囊徽章；
   - 支持选项副标题说明（description）；

3. **内置自定义输入行**：
   - 当选项无法满足需求时，底部提供"其他… 输入自定义答案并按回车提交"单行输入区；
   - 支持自由输入文本，按 `Enter` 键或点击"提交"按钮即可将决策回传至群聊；

4. **决策结果一键回传与状态自闭环**：
   - 用户选中选项或输入自定义文本后，系统自动合成拍板决策，提交至 `/dsh-group-chat/api/message` 推进群聊；
   - 提交或点击"跳过/关闭"后，调用 `/dsh-group-chat/api/room/decision` 清除 `awaitingUserDecision` 状态，决策卡片无感消解，原位恢复官方原生 `composerStack`；

5. **HUD 侧边栏轻量提示**：
   - HUD 侧边栏改为紧凑通知气泡：`🔔 方案抉择 / 待拍板: [question] (已在中央官方输入区 1:1 接管展开 ▾)`；
   - 不再将大型卡片挤入 360px 宽的侧边栏，主交互全量聚焦中央输入席位；

6. **顶部标签纯净保障**：
   - 激活 `hideLegacyTab` 彻底隐藏顶部"Agent 群聊"/"特遣对话"等冗余标签；
   - 用户在官方对话视图中感受到的是完全原生的 DSH 体验，群聊能力以环境超能力方式存在；

7. **工作流完工收官**：
   - 在 `workflow-orchestrator.ts` 中，第 5（最后一个）阶段批准通过时自动设置 `room.workflow.isCompleted = true`；
   - 阶段推进时同步清理 `room.awaitingUserDecision`，防止旧决策状态阻断下一轮工作流；

## 涉及文件 (Affected Files)

| 文件 | 变更性质 | 说明 |
| :--- | :--- | :--- |
| `src/client/GroupChatComposerTakeover.tsx` | **新增** | 通过 `useComposerSeat()` + React Portal 接管 `[data-composer-seat]`，激活时设 `body[data-dsh-gc-decision-takeover=true]` |
| `src/client/GroupChatSideDock.tsx` | 修改 | 挂载 `GroupChatComposerTakeover`；HUD 决策区改为轻量通知气泡；重新启用 `hideLegacyTab` |
| `src/client/index.ts` | 修改 | 接入 `GroupChatComposerTakeover` 到客户端入口 |
| `src/types.ts` | 修改 | 为 `WorkflowDefinition` 补充 `isCompleted?: boolean` 字段 |
| `src/engine/workflow-orchestrator.ts` | 修改 | 最后阶段完成后自动设 `room.workflow.isCompleted = true` |
| `src/engine/arbiter.ts` | 修改 | SubAgent 发言禁止私下触发其他 SubAgent（Bot-to-Bot 防死循环守卫） |
| `src/engine/agent-runtime.ts` | 修改 | 透传 `roleName` 并在 Follow-up 注入双语角色身份锚定 |
| `src/engine/room-manager.ts` | 修改 | 默认关闭 `enableBotToBotTrigger`；新增 `getActiveRoomId()` 辅助方法 |
| `src/tools/index.ts` | 修改 | 阶段推进（`group_chat_workflow_advance`）时清除 `awaitingUserDecision`；工具 `roomId` 解析改用 `getActiveRoomId()` |
| `src/index.ts` | 修改 | `/room/decision` 接口；优化任务 Brief 前缀，明确当前角色职责 |
| `__tests__/test-anti-loop-and-persona-guard.cjs` | **新增** | 防死循环与角色防漂移回归测试（5 项断言全通过） |
| `__tests__/test-cook-assign-task.cjs` | **新增** | Cook Assign Task 工具完整性验收测试 |
| `__tests__/.p18-visual-runner.js` | **新增** | 更新后的 P18 浏览器 Visual Regression 脚本 |

## 验证与验收 (Verification)

- **TypeScript 类型检查**：`npm run typecheck` ➔ **0 Errors**
- **全栈构建打包**：`npm run build:all` ➔ **0 Errors**（Host + Client 打包成功）
- **发布预检矩阵**：`npm run preflight` ➔ **107/107 发布契约全部通过**
- **无大模型 E2E 回归**：`npm run test:e2e:no-llm` ➔ **PASS**
- **P98 用户决策端到端**：`npm run test:user-decision` ➔ **5 项断言 100% PASS**
- **防死循环与角色身份守卫**：`node __tests__/test-anti-loop-and-persona-guard.cjs` ➔ **5 项断言 100% PASS**
- **对话防中断反卡顿**：`npm run test:dialog-anti-stall` ➔ **PASS**
- **作战室导航去重**：`npm run test:war-room-nav` ➔ **PASS**
- **真实工作区会话核验**（`dsh-session-792f639c-9fa4-45f7-a52c-9d85e84b3567`）：
  - 全部 5 个工作流阶段均为 `completed`；
  - `isCompleted: true`；
  - `activeAssignments: 0`（无任何游荡后台任务）；
  - `awaitingUserDecision: undefined`（决策状态干净释放）。

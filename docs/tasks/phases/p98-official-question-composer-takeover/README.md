# Phase 98: 官方同款提问接管输入框与交互式拍板卡片 (Official QuestionComposer Takeover & Interactive Decision Card)

## 概述 (Overview)
深度对标 DSH 官方提问交互套件 `@deepseek-ai/dsh-client-ui-user-questions` 的 `QuestionComposer` 设计标准，对 `dsh-group-chat` 中人类决策与方案拍板交互进行了彻底重构：
1. **输入区全量接管 (Composer Takeover)**：当总指挥官发起决策或提出方案抉择时，不再是在普通输入框上方挂载突兀的悬浮小卡片，而是完全接管底部输入区，原位替换为官方同款的交互式问答卡片；
2. **结构化单选与多选视觉对齐**：
   - 包含 Eyebrow 分类标识、Header 标题、以及右上角最小化收起与 ✕ 取消/关闭按钮；
   - 选项列表采用圆角编号 `1`, `2`, `3`，具备高光选中态与悬浮态；
   - 推荐方案带有绿色的“推荐 / Recommended”胶囊徽章；
   - 支持选项副标题说明（description）；
3. **内置自定义输入行 (Inline Custom Row / Block Input)**：
   - 当选项无法满足需求时，底部提供铅笔图标的“其他… 输入自定义答案并按回车提交”单行/多行输入区；
   - 支持自由输入文本，按 `Enter` 键即可一键作为决策结果回传至群聊；
4. **决策结果一键回传与状态自闭环**：
   - 用户选中选项或输入自定义文本后，点击“提交”按钮（或按 Enter），系统自动合成拍板决策并向群聊发送；
   - 提交或点击“跳过/关闭”后，决策卡片自闭环淡出，原位无缝恢复官方原生风格的 `GroupChatComposer` 聊天输入框。

## 涉及文件 (Affected Files)
- `src/client/GroupChatQuestionComposer.tsx`: 1:1 对标官方 `QuestionComposer` 的全新 React 交互组件
- `src/client/GroupChatPanel.tsx`: 底部输入区支持 `awaitingDecision ? <GroupChatQuestionComposer /> : <GroupChatComposer />` 原位接管
- `src/types.ts`: `UserDecisionPrompt` 扩展 `header`, `detail`, `multiSelect` 等标准属性
- `src/engine/arbiter.ts`: 优化自然语言与结构化选项正则提取，清洗冒号与噪声
- `src/tools/index.ts`: 注册 `group_chat_ask_user` 工具，支持 Agent 显式下发官方风格决策卡片
- `src/engine/room-manager.ts`: 为总指挥官赋予 `group_chat_ask_user` 工具权限
- `src/index.ts`: 增加 `/room/decision` 运行时决策管理接口

## 验证与验收 (Verification)
- Playwright Headless 真实浏览器端到端实测通过：
  - 决策卡片接管输入区验证通过
  - 单选选项点击高亮验证通过
  - 自定义输入框打字触发激活态验证通过
  - ✕ 关闭/跳过并无缝恢复常规 Composer 验证通过
- 全量自动化测试矩阵（`npm run test:matrix`）97 项全绿通过。

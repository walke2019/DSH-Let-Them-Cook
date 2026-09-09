# P35 — 团队 / 工作流 / 黑板 / 账本标签重组

## 问题 TODO

用户反馈右侧 HUD 标签需要更符合人话与信息架构：

- [x] 原有三个标签改成四个标签：`团队 / 工作流 / 黑板 / 账本`。
- [x] 角色、主题、成员管理全部放到 `团队` 标签。
- [x] `账本` 标签不再混入角色管理，只显示运行统计和完整记录。
- [x] `账本` 中 Assignment / Mailbox 不再只取最近 8/6 条，改为完整记录展示。
- [x] 保留工作流清爽默认态，高级详情仍默认折叠。

## 实现

- `GroupChatSideDock` 的 `activeTab` 改为 `team | workflow | scratchpad | ledger`，默认进入 `team`。
- `GroupChatHudRosterPanel` 增加 `panel="team" | "ledger"`：
  - `team`：AI 造主题角色 + 工作流、成员列表、角色编辑入口。
  - `ledger`：总体运行统计、Agent/模型展开、完整 Assignment、完整 Mailbox。

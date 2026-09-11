# P34 — 工作流高级详情手风琴折叠

## 问题 TODO

用户反馈：右栏下面的折叠区应该“展开一个，收起其他的”，避免高级详情展开后又变成一大坨信息。

- [x] 高级详情内部阶段折叠改为受控手风琴。
- [x] Assignment 折叠区与 Mailbox 折叠区加入同一组手风琴。
- [x] 点击已展开项可收起。
- [x] 默认优先打开当前阶段；高级详情本身仍默认折叠。
- [x] 保留失败任务快捷处理、结构化结果、任务状态修正。

## 实现

`GroupChatHudWorkflowPanel` 增加：

- `openAdvancedItem`：当前打开的高级详情子项。
- `toggleAdvancedItem(id)`：打开当前项并自动收起其他项；再次点击当前项则收起。
- 阶段使用 `stage:${st.id}` 作为 key。
- Assignment 使用 `assignments` 作为 key。
- Mailbox 使用 `mailbox` 作为 key。

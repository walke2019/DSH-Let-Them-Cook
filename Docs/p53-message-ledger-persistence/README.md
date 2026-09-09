# P53 群聊消息与账本持久化

## 背景
P52 继续测试时复现：热重载/重新注入后，`assignments` 仍存在，但 `/dsh-group-chat/api/room` 的 `messages` 可能为空，浏览器旧 React 状态又残留旧消息，导致用户看到的群聊复盘与后端真实状态不一致。

## 修复
- `WorkspaceRoomStateStore` 从只保存 `rooms` 扩展为保存：
  - `rooms`
  - `messages`（每个 room 保留最近 200 条）
  - `ledgers`
- `RoomManager` 增加 `restoreRuntimeState(roomId, messages, ledger)`，启动时恢复消息流和账本。
- `persistRoomState(roomId)` 统一保存 room/messages/ledger 快照。
- `src/index.ts` 中运行期直接 `workspaceStore.saveRoom(...)` 的保存点改为统一快照保存。

## 验收
- 热重载后 `/room` 可恢复消息流；
- ledger 可恢复，不再刷新后总是 0；
- assignment、message、ledger 三者能共同用于复盘。

# P54 重启后中断任务恢复

## 背景
P53 持久化复测发现：如果发送消息后马上重启 DSH web，消息与 assignment 能恢复，但运行时 timer / agent loop 已被进程重启打断，之前处于 `queued/running` 的 assignment 会永久显示 running。

## 修复
- `RoomManager.settleInterruptedAssignments()`：插件启动恢复房间时，将遗留 `queued/running` assignment 标记为 `failed`。
- 错误原因写明：`插件重启中断：上一轮运行时任务未能恢复，请重新派发。`
- 标记 `finishedAt/updatedAt/resultMessageId=runtime-interrupted`，让 HUD/账本能明确展示这是重启中断，不是模型仍在跑。

## 验收
- 重启后不再出现永远 running 的假状态；
- 用户可以看到中断原因并重新派发；
- 不影响新的 live assignment 正常 running/completed。

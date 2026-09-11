const fs = require('fs')
const path = require('path')
const root = path.resolve(__dirname, '..')
const manager = fs.readFileSync(path.join(root, 'src/engine/room-manager.ts'), 'utf8')
const index = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8')
const required = [
  [manager, 'settleInterruptedAssignments(roomId: string'],
  [manager, "assignment.status === 'queued' || assignment.status === 'running'"],
  [manager, "assignment.resultMessageId = 'runtime-interrupted'"],
  [manager, '插件重启中断：上一轮运行时任务未能恢复，请重新派发。'],
  [index, 'roomManager.settleInterruptedAssignments(savedRoom.roomId)'],
  [index, 'workspaceStore.saveSnapshot(current, roomManager.getMessages(savedRoom.roomId), roomManager.getLedger(savedRoom.roomId))'],
]
const missing = required.filter(([source, token]) => !source.includes(token)).map(([, token]) => token)
if (missing.length) {
  console.error(JSON.stringify({P54_INTERRUPTED_ASSIGNMENT_RECOVERY_EXIT:1, missing}, null, 2))
  process.exit(1)
}
console.log(JSON.stringify({
  P54_INTERRUPTED_ASSIGNMENT_RECOVERY_EXIT:0,
  recovery:'queued/running assignments become failed runtime-interrupted on startup',
  userAction:'re-dispatch visible instead of forever-running'
}, null, 2))

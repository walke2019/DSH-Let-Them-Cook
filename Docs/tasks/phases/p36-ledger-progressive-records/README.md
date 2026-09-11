# P36 — 账本完整流水渐进式展示

目标：`账本` 要能查看完整 Assignment / Mailbox 记录，但默认不能像日志瀑布一样糊用户一脸。

## 已完成

- [x] 账本新增 `完整流水` 卡片，顶部展示分派、邮箱、未读数量。
- [x] 完整流水支持关键词搜索，覆盖角色、任务、分派 ID、邮箱内容等字段。
- [x] 支持 `全部 / 进行中 / 未读` 轻量筛选。
- [x] Assignment 与 Mailbox 均保留完整数据源，不再 `slice(-n)` 截断。
- [x] Assignment / Mailbox 记录默认放在折叠详情中，需要时展开查看。

## 验收

- `npm run build:all`
- `node docs/tasks/phases/p36-ledger-progressive-records/test-p36-ledger-progressive-records.cjs`
- `npm run test:matrix`

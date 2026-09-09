# P19 — 真实项目闭环

目标：让扩展不只是“看起来像群聊”，而是能围绕一个真实小任务走完项目协作闭环。

本阶段固化以下能力：

- `commander` 是主 Agent，负责任务入口、分派、读取 mailbox、收口。
- `researcher/backend/frontend/qa/writer` 是 SubAgent，按工具归口和阶段任务执行，不重复抢工具。
- SubAgent 产物通过 mailbox 回传主 Agent。
- 主 Agent 可读取“收件箱摘要”，快速知道谁交付了什么、哪些未读、有哪些证据。
- HUD 对失败任务提供 `重试 / 让用户补充 / 跳过` 三个快捷动作。
- 导出纪要包含任务分派、mailbox 摘要和资源账本，便于交付。

## 当前小任务样例

“给 dsh-group-chat 增加右侧 HUD 视觉回归与文档同步。”

该任务故意覆盖真实项目中的 UI、文档、QA 与收口场景：

1. researcher 只负责资料/约束整理。
2. backend 只负责状态/API/任务动作。
3. frontend 只负责 HUD/中间视图交互。
4. qa 只负责验证与阻断判断。
5. writer 只负责文档和结题说明。
6. commander 汇总 mailbox 并决定推进。

## 执行方式

```bash
npm run build:all
node Docs/p19-real-project-loop/test-p19-real-project-loop.cjs
```

`npm run test:matrix` 已包含该测试。

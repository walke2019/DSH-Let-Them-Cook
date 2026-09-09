# P41：发布预检与维护守则补齐

## 背景

P39/P40 已经新增了两个真实浏览器回归：

- `新会话 -> Agent 群聊 -> 对话` 切换边界；
- `Agent 群聊 -> 刷新 -> 新会话 -> Agent 群聊` 刷新状态清理。

P41 将这两类高风险回归纳入发布预检与 AGENTS.md 维护守则，避免后续开发只跑静态矩阵而漏掉源版对话兼容问题。

## 变更

1. `scripts/release-preflight.cjs`
   - required artifacts 增加 P39/P40 文档与测试脚本；
   - package scripts 增加 `test:ui:visual`、`test:ui:switch`、`test:ui:refresh`；
   - AGENTS.md 检查增加 `刷新`、`源版对话`、`P39/P40` 类维护红线；
   - 输出 packageScripts 同步为当前完整预检入口。
2. `AGENTS.md`
   - 追加官方源对话 / Agent 群聊切换守则；
   - 追加刷新、重载、任务切换后的扩展 body 标记清理要求；
   - 要求 Web UI 改动优先跑 `test:ui:switch` 与 `test:ui:refresh`。
3. `Docs/TODO.md` / `Docs/README.md`
   - 记录 P41 完成状态与维护入口。

## 验收

- `npm run preflight`
- `npm run build:all`
- `npm run test:matrix`

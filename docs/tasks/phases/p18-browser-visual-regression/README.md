# P18 — 浏览器端视觉回归

目标：把最近反复出现的 UI 问题固化成可重复检查的浏览器回归脚本，重点覆盖：

- 左侧官方栏展开时，中间 `Agent 群聊` 区域不能被错误挤压或留出异常大空隙。
- 右侧 `群聊控制台 (HUD)` 停靠展开时，只让插件自身避让，不接管官方 AppFrame。
- 中间输入框左右 padding 保持对称，靠近 HUD 的安全缝约 7-8px，不出现明显右侧大空白。
- HUD 内长模型 ID、任务标题、details/summary、按钮组不能发生可见外溢。
- HUD 标题保持人话标签 `群聊控制台 (HUD)`，不回退成旧的 `特遣监控室`。
- 右侧 HUD 不再重复聊天输入派发；聊天统一在中间 `Agent 群聊` 标签处理。

## 执行方式

本测试依赖本地 DSH Web 已运行在 `http://127.0.0.1:3080/`：

```bash
npm run test:ui:visual
```

脚本使用 `playwright-cli` 开一个独立浏览器会话，自动进入当前 DSH 页面，尽量切到已有项目对话，打开 `Agent 群聊` 与右侧 HUD，然后采集真实布局指标。

## 输出

- `docs/tasks/phases/p18-browser-visual-regression/last-run.json`：最近一次布局指标与断言结果。
- `docs/tasks/phases/p18-browser-visual-regression/last-run.png`：最近一次浏览器截图。

## 通过标准

- 能找到 `Agent 群聊` 中间标签。
- 能找到 `群聊控制台 (HUD)`。
- HUD 不显示旧标题。
- HUD 可见元素不超出右栏边界。
- `.gc-composer` 左右 padding 一致。
- `.gc-conversation` 与 HUD 之间没有异常大间距。
- 官方对话输入没有被 HUD 重复派发取代。

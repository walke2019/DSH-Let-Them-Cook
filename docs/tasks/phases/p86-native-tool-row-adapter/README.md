# P86 — 原生工具行号 Diff 可视化适配器 (Native Tool Row Adapter)

## 概述

在多智能体协同运行过程中，底座原生工具（如 `read`, `edit`, `write`, `grep`, `glob`, `bash`）的调用是执行细节的核心体现。
本阶段设计并实现了 `GroupChatToolRow` 组件及运行时适配器，替换了原有的简陋 `details` 标签，提供原生美观的工具流式状态展现。

## 核心设计与特性

1. **双语工具语义字典**：
   - 映射中文标题：“读取 (`read`)”、“编辑 (`edit`)”、“写入 (`write`)”、“Grep (`grep`)”、“Bash (`bash`)” 等；
2. **目标路径与参数快速提取**：
   - 通过 `resolveToolTarget` / `extractToolTarget` 提取工具操作目标并在 UI 标签中以 Mono 字体高亮显示；
3. **行号差异与摘要计算**：
   - 对 `edit` 工具智能计算行数增删（`+add -del`）；
   - 对 `bash` 提取前置意图描述与退出状态；
4. **视觉动画与异常标记**：
   - 运行中展示脉冲动画 (`gc-tool-spin`)，失败调用醒目标注错误标签 (`gc-tool-status-error`)；
   - 折叠/展开原生平滑过渡 (`gc-tool-chevron-open`)。

## 自动化验证

- 单测脚本：`node __tests__/test-p86-native-tool-row-adapter.cjs`
- 集成验证：`npm run test:matrix`

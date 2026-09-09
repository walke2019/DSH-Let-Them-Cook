# P4：DSH API 兼容层与测试矩阵落地记录

日期：2026-09-08

## 目标

降低 DSH 预览版 API 变化对插件的影响，把模型目录、宿主默认模型、工具限制、能力探测收束到兼容层，并提供一键测试矩阵。

## 已完成

1. `src/compat/dsh.ts`
   - `detectDshCompat(ctx)`：探测 llmCatalog、currentModel、toolRestrict、webServer、agents。
   - `getCurrentModel(ctx)`：安全读取宿主当前默认模型，失败时返回空模型。
   - `safeListModelCatalog(ctx)`：安全读取 Provider / Model 目录，局部失败时返回 warning 而不是炸掉页面。
   - `listKnownToolNames(tools)`：尽力探测工具注册表。
   - `resolveToolScope()`：将语义工具名映射到当前宿主真实工具名。
   - `restrictToolsCompat()`：通过兼容层调用 `tools.restrict()`，并返回 missing/known/resolved 信息。

2. `src/index.ts`
   - 启动时生成 `compatReport`，对缺失能力打 warning。
   - `/dsh-group-chat/api/compat` 返回兼容探测结果。
   - `/dsh-group-chat/api/models` 使用 `safeListModelCatalog()` 和 `getCurrentModel()`。
   - 模型接口返回 `compat` 与 `catalogWarnings`。

3. `src/engine/agent-runtime.ts`
   - 使用 `getCurrentModel()` 兜底宿主默认模型。
   - 使用 `restrictToolsCompat()` 做角色工具白名单限制。
   - 未匹配到工具别名时记录 warning，不让整个 Agent turn 崩掉。

4. 测试矩阵
   - 新增 `scripts/test-matrix.cjs`。
   - 新增 `scripts/api-smoke.cjs`。
   - `package.json` 新增：
     - `npm run test:matrix`
     - `npm run smoke:api`

## 当前边界

- 工具真实名称探测是 best-effort：如果 DSH tools 服务没有暴露可枚举注册表，则保持原白名单名称传入。
- API smoke 依赖本地 DSH Web 服务；服务不可用时输出 `API_SMOKE_SKIPPED`，不阻塞离线构建。
- Playwright UI 冒烟测试尚未引入依赖；当前先以 API smoke 覆盖运行态核心接口。

## 下一步

发布前建议进入 P5：右侧 HUD 展示 assignment / mailbox / DAG，或补充 Playwright UI 冒烟测试依赖与可视化断言。

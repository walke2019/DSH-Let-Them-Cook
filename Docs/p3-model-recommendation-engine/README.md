# P3：模型能力推荐引擎落地记录

日期：2026-09-08

## 目标

将角色模型建议从前端简单正则匹配升级为服务端能力标签评分：综合角色 `RoleModelHint`、DSH 官方模型目录、最近使用模型、宿主当前默认模型、用户手动设置，为每个 Agent 输出最多 6 个推荐模型。

## 已完成

1. `src/engine/model-recommender.ts`
   - 新增 `recommendModelsForRole()`。
   - 新增 `recommendModelsForRoles()`。
   - 支持能力标签：reasoning、coding、tool_use、web_research、data_extraction、ui_design、writing、qa_audit、long_context、fast_reply、low_cost。
   - 支持成本偏好、延迟偏好、来源加权。
   - 来源优先级：用户当前手动设置、最近模型、宿主默认、DSH 模型目录。

2. `src/index.ts`
   - `/dsh-group-chat/api/models` 现在返回 `recommendations`。
   - recommendations 按当前 room 的 `orchestration.modelHints` 为每个角色生成。
   - 手动配置和最近模型不覆盖用户选择，只作为建议候选。

3. `src/client/GroupChatModelSettings.tsx`
   - 角色建议使用服务端 recommendations。
   - 每个建议显示来源、分数、命中的能力标签。
   - 点击建议仍然只是填入主模型，最终需要用户保存角色配置。

## 当前边界

- 当前能力识别基于模型 ID / 名称 / Provider 文本特征，不依赖外部接口。
- 不写死唯一模型 ID，避免 DSH 模型目录变化后失效。
- 后续可接 DSH 模型元数据中的上下文长度、价格、工具调用标记，如果官方 API 暴露这些字段。

## 下一步

进入 P4：DSH API 兼容层与测试矩阵；或继续增强 P3：给回退模型自动填充“同能力更便宜/更快”的候选链。

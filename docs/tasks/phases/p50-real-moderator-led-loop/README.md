# P50 — 真实 moderator-led 多 Agent 闭环测试

## 真实测试时间

2026-09-09 约 21:58–22:02（Asia/Shanghai）。

## 测试目标

验证用户关心的真实多人链路：主 Agent 是否分配任务、是否使用不同 Agent、SubAgent 是否上报、主 Agent 是否汇总验收。

## 测试配置

- 临时调度模式：`moderator_led`
- 测试后恢复：`workflow_driven`
- commander 模型：`cpa/glm-5.3-flash-free`
- researcher 模型：`cpa/glm-5.3-flash-free`
- 有效超时：120000ms

## 真实结果

1. 用户消息先进入 commander：`nextSpeakerIds:["commander"]`。
2. commander 真实回复并分派给 researcher：
   - `@瓜田侦探 【P50 分派】极短检查任务：不调用任何工具...`
3. researcher 真实执行并回复：
   - `已确认：P49 中 @废话压缩师 已成功回复「群聊模型调用链路正常」，本轮未调用任何工具。`
4. researcher 自动通过 mailbox 上报给 commander：
   - `fromRoleId: researcher`
   - `toRoleId: commander`
5. commander 被再次唤醒并完成汇总验收：
   - `P50 验收通过：瓜田侦探零工具核查确认 P49 废话压缩师回复成功，「分派→执行→回报→验收」多人链路全通，本轮测试闭环。`

## 质量结论

- 多 Agent 使用：通过。
- 主 Agent 分配：通过。
- SubAgent 执行：通过。
- SubAgent 上报主 Agent：通过。
- 主 Agent 汇总验收：通过。
- 当前主要体验问题：真实多人链路耗时较长，本轮约 240 秒，需要后续做“快速链路/长链路”分层和更明确的进度展示。

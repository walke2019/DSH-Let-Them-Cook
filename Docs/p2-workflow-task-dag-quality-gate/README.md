# P2：WorkflowTask DAG 与质量门禁落地记录

日期：2026-09-08

## 目标

将工作流从“阶段级 assignedRoleIds”升级为“阶段内任务 DAG”：每个阶段可包含多个 `WorkflowTask`，任务声明 owner、dependsOn、verifyCommand、qualityContract，并由质量门禁决定阶段是否允许推进。

## 已完成

1. `src/types.ts`
   - 新增 `WorkflowTaskStatus`。
   - 新增 `WorkflowTaskQualityContract`。
   - 新增 `WorkflowTaskVerification`。
   - 新增 `WorkflowTask`。
   - `WorkflowStage.tasks?: WorkflowTask[]`。
   - `AssignmentEnvelope.workflowTaskId?: string`，将 assignment 绑定到 DAG 节点。

2. `src/engine/workflow-orchestrator.ts`
   - 标准五阶段工作流已带默认任务 DAG。
   - 新增 `refreshTaskReadiness()`：依赖任务通过后，pending 自动转 ready。
   - 新增 `stageGate()`：阶段推进前检查任务是否全部 passed。
   - 新增 `getReadyTasks()`：按 ownerRoleId 取当前可执行任务。
   - 新增 `updateTaskStatus()`：记录任务状态、assignmentId、验证命令输出与 exitCode。
   - `advanceStage()` 前置质量门禁，任务未通过时阻断推进。

3. `src/index.ts`
   - 创建 assignment 时优先绑定当前阶段中该角色的 ready task。
   - Agent 执行开始时 task 标记为 running。
   - Agent 完成后根据输出粗判 passed / failed / request_human。
   - 新增 `/dsh-group-chat/api/workflow/task`，允许 QA/前端把 verifyCommand 输出写回任务。

4. `src/engine/projection.ts`
   - assignment 上下文显示 `workflowTaskId`，Agent 知道自己正在处理哪个 DAG 节点。

## 当前边界

- `verifyCommand` 已成为任务契约和记录字段，但插件没有直接在 Host 中执行 shell；实际执行应继续通过 DSH 工具/QA Agent 或后续受控命令适配器完成。
- Agent 完成后自动判定状态目前是保守启发式：出现“失败/阻断/fail”则 failed，出现“需要人工/request_human”则 request_human，其余视为 passed。下一步可改为结构化结果协议。
- DAG 目前是阶段内单层依赖，不是跨阶段全局 DAG。

## 下一步

进入 P3：模型能力推荐引擎，或继续增强 P2：结构化 Agent 结果、QA verify command 执行器、右侧 HUD 展示任务 DAG。

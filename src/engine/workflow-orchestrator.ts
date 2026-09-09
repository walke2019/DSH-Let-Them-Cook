/**
 * Workflow orchestrator and approval gatekeeper.
 */

import type {
  GroupChatRoom,
  WorkflowDefinition,
  WorkflowStage,
  WorkflowTask,
  RolePermissions,
} from '../types.js'
import type {GroupChatLocale} from '../client/i18n.js'

export class WorkflowOrchestrator {
  private static task(taskId: string, title: string, ownerRoleId: string, description: string, options: Partial<WorkflowTask> = {}): WorkflowTask {
    const now = Date.now()
    return {
      taskId,
      title,
      ownerRoleId,
      description,
      dependsOn: options.dependsOn || [],
      status: options.dependsOn?.length ? 'pending' : 'ready',
      verifyCommand: options.verifyCommand,
      qualityContract: options.qualityContract || { acceptanceCriteria: ['产出满足阶段目标', '结论可被主 Agent 审核'], riskChecks: ['避免越权调用非归口工具'] },
      createdAt: now,
      updatedAt: now,
    }
  }

  public static refreshTaskReadiness(stage: WorkflowStage): void {
    const tasks = stage.tasks || []
    const passed = new Set(tasks.filter(t => t.status === 'passed').map(t => t.taskId))
    for (const task of tasks) {
      if (task.status !== 'pending') continue
      const deps = task.dependsOn || []
      if (deps.every(dep => passed.has(dep))) {
        task.status = 'ready'
        task.updatedAt = Date.now()
      }
    }
  }

  public static stageGate(stage: WorkflowStage, locale: GroupChatLocale = 'zh-CN'): { allowed: boolean; reason: string } {
    const tasks = stage.tasks || []
    if (!tasks.length) return { allowed: true, reason: locale === 'en-US' ? 'Current stage has no task DAG; using stage-level approval.' : '当前阶段未配置任务 DAG，沿用阶段级审批。' }
    this.refreshTaskReadiness(stage)
    const failed = tasks.filter(t => t.status === 'failed' || t.status === 'rejected' || t.status === 'request_human')
    if (failed.length) return { allowed: false, reason: locale === 'en-US' ? `Stage has unapproved tasks: ${failed.map(t => `${t.taskId}:${t.status}`).join(', ')}` : `阶段存在未放行任务：${failed.map(t => `${t.taskId}:${t.status}`).join(', ')}` }
    const notPassed = tasks.filter(t => t.status !== 'passed')
    if (notPassed.length) return { allowed: false, reason: locale === 'en-US' ? `Stage quality gate not passed: ${notPassed.map(t => `${t.taskId}:${t.status}`).join(', ')}` : `阶段质量门禁未通过：${notPassed.map(t => `${t.taskId}:${t.status}`).join(', ')}` }
    return { allowed: true, reason: locale === 'en-US' ? 'All stage task DAG checks passed.' : '阶段任务 DAG 均已通过质量门禁。' }
  }

  /**
 * Workflow orchestrator and approval gatekeeper.
 */
  public static createStandardDevWorkflow(): WorkflowDefinition {
    const stages: WorkflowStage[] = [
      {
        id: 'stage_research',
        name: '阶段一：需求深潜与搜索调研',
        description: '由搜索调研员执行外部情报搜索、竞品对比、技术选型与调研简报整理。',
        assignedRoleIds: ['researcher'],
        tasks: [
          this.task('research.collect', '收集资料与出处', 'researcher', '检索权威资料、社区同类插件与实现约束。', { qualityContract: { acceptanceCriteria: ['列出来源与链接', '提炼可执行结论'], riskChecks: ['不重复触发全员搜索'] } }),
          this.task('research.brief', '形成调研简报', 'researcher', '把资料整理成给 commander 审核的结构化简报。', { dependsOn: ['research.collect'], qualityContract: { acceptanceCriteria: ['包含方案对比', '给出推荐路径'], riskChecks: ['事实与观点分离'] } }),
        ],
        status: 'in_progress',
        requiresApproval: true,
      },
      {
        id: 'stage_commander_review_1',
        name: '阶段二：指挥官调研审核与任务派发',
        description: '由总指挥官全盘把控方向，审核调研报告是否达标，并拆解具体落地任务。',
        assignedRoleIds: ['commander'],
        tasks: [
          this.task('review.research', '审核调研并派发任务', 'commander', '审核调研是否支撑实现，形成明确分工。', { qualityContract: { acceptanceCriteria: ['确认目标边界', '给出下一阶段任务拆分'], riskChecks: ['任务不清时要求追问'] } }),
        ],
        status: 'pending',
        requiresApproval: true,
      },
      {
        id: 'stage_implementation',
        name: '阶段三：前后端协同原型实现',
        description: '后端架构设计与数据契约建模，前端UI交互与视觉原型实现。',
        assignedRoleIds: ['backend', 'frontend'],
        tasks: [
          this.task('impl.backend', '后端状态机与 API 实现', 'backend', '实现状态、接口、权限和持久化逻辑。', { qualityContract: { acceptanceCriteria: ['类型契约清晰', '状态变更可追踪'], riskChecks: ['不改 DSH 核心'] } }),
          this.task('impl.frontend', '前端 UI 与交互实现', 'frontend', '实现中间对话与右侧 HUD 的可用交互。', { qualityContract: { acceptanceCriteria: ['界面清爽', '主题风格一致'], riskChecks: ['不遮挡官方聊天体验'] } }),
        ],
        status: 'pending',
        requiresApproval: false,
      },
      {
        id: 'stage_qa_audit',
        name: '阶段四：安全红队与质量对抗审计',
        description: '测试专家进行边界条件覆盖、并发安全审计、死锁风险排查。',
        assignedRoleIds: ['qa'],
        tasks: [
          this.task('qa.typecheck', '类型与构建验证', 'qa', '执行类型检查与构建验证。', { verifyCommand: 'npm run typecheck && npm run build:all', qualityContract: { acceptanceCriteria: ['typecheck exit 0', 'build exit 0'], riskChecks: ['记录失败输出'] } }),
          this.task('qa.regression', '专项回归测试', 'qa', '运行 Docs 下专项测试脚本并判断是否放行。', { dependsOn: ['qa.typecheck'], qualityContract: { acceptanceCriteria: ['专项测试全部 PASS', '失败时给出阻断原因'], riskChecks: ['不可只口头通过'] } }),
        ],
        status: 'pending',
        requiresApproval: true,
      },
      {
        id: 'stage_documentation',
        name: '阶段五：文档沉淀与指挥官结题验收',
        description: '文档写手更新共享黑板与输出交付文档，总指挥官最终签字收官。',
        assignedRoleIds: ['writer', 'commander'],
        tasks: [
          this.task('docs.update', '更新文档与 TODO', 'writer', '沉淀变更、边界与下一步计划。', { qualityContract: { acceptanceCriteria: ['Docs 文档已更新', 'TODO 状态准确'], riskChecks: ['根目录不新增杂散文档'] } }),
          this.task('docs.final-review', '最终验收', 'commander', '检查文档、测试与交付状态后结题。', { dependsOn: ['docs.update'], qualityContract: { acceptanceCriteria: ['交付说明完整', '下一步明确'], riskChecks: ['未验证不得宣称完成'] } }),
        ],
        status: 'pending',
        requiresApproval: true,
      },
    ]

    return {
      id: 'wf_standard_pipeline',
      title: '通用五阶段闭环工作流',
      stages,
      currentStageIndex: 0,
    }
  }

  public static ensureTaskDag(workflow: WorkflowDefinition): void {
    const template = this.createStandardDevWorkflow()
    for (const stage of workflow.stages) {
      if (stage.tasks?.length) {
        this.refreshTaskReadiness(stage)
        continue
      }
      const match = template.stages.find(item => item.id === stage.id)
      if (match?.tasks?.length) {
        stage.tasks = structuredClone(match.tasks)
      } else {
        const owners = stage.assignedRoleIds.length ? stage.assignedRoleIds : ['commander']
        stage.tasks = owners.map(owner => this.task(`${stage.id}.${owner}`, `${stage.name} / ${owner}`, owner, stage.description))
      }
    }
  }

  /**
 * Workflow orchestrator and approval gatekeeper.
 */
  public static checkPermission(
    rolePermissions: RolePermissions,
    action: 'write_scratchpad' | 'approve_workflow' | 'call_tool',
    toolName?: string
  ): { allowed: boolean; reason?: string } {
    if (action === 'call_tool') {
      if (!toolName) {
        return { allowed: false, reason: '工具调用缺少 toolName，已拒绝。' }
      }
      if (!rolePermissions.allowedTools.length) {
        return { allowed: false, reason: '该角色本轮未开放任何工具。' }
      }
      if (!rolePermissions.allowedTools.includes(toolName)) {
        return {
          allowed: false,
          reason: `工具权限越界：角色未获授权调用工具 [${toolName}]（仅限: ${rolePermissions.allowedTools.join(', ')}）。`,
        }
      }
      return { allowed: true }
    }

    if (rolePermissions.level === 'admin') {
      return { allowed: true }
    }

    if (action === 'write_scratchpad') {
      if (!rolePermissions.canWriteScratchpad) {
        return { allowed: false, reason: '该角色不具备共享黑板写权限，仅指挥官与文案写手允许覆写。' }
      }
      return { allowed: true }
    }

    if (action === 'approve_workflow') {
      if (!rolePermissions.canApproveWorkflow) {
        return { allowed: false, reason: '该角色不具备工作流审批特权，必须由总指挥官或人类管理员审批。' }
      }
      return { allowed: true }
    }

    return { allowed: true }
  }

  /**
 * Workflow orchestrator and approval gatekeeper.
 */
  public static advanceStage(
    room: GroupChatRoom,
    approverRoleId: string,
    summary?: string,
    locale: GroupChatLocale = 'zh-CN'
  ): { success: boolean; message: string; stage?: WorkflowStage } {
    if (!room.workflow) {
      return { success: false, message: locale === 'en-US' ? 'This room has no workflow configured.' : '当前房间未配置工作流。' }
    }

    const { stages, currentStageIndex } = room.workflow
    const currentStage = stages[currentStageIndex]

    if (!currentStage) {
      return { success: false, message: locale === 'en-US' ? 'Workflow is already completed.' : '工作流已处于完结状态。' }
    }

    const gate = this.stageGate(currentStage, locale)
    if (!gate.allowed) {
      return { success: false, message: locale === 'en-US' ? `Stage quality gate blocked: ${gate.reason}` : `阶段质量门禁阻断：${gate.reason}` }
    }

    // Workflow orchestrator and approval gatekeeper.
    const approver = room.members.find(m => m.id === approverRoleId)
    if (currentStage.requiresApproval && approver && !approver.permissions.canApproveWorkflow) {
      return {
        success: false,
        message: locale === 'en-US' ? `Approval rejected: role [${approver.name}] does not have workflow approval privilege.` : `审批拒绝：角色 [${approver.name}] 没有工作流审核批准特权。`,
      }
    }

    // Workflow orchestrator and approval gatekeeper.
    currentStage.status = 'completed'
    currentStage.approvedBy = approver?.name || (locale === 'en-US' ? 'Human commander' : '人类指挥官')
    currentStage.approvedAt = Date.now()
    if (summary) currentStage.deliverableSummary = summary

    // Workflow orchestrator and approval gatekeeper.
    const nextIndex = currentStageIndex + 1
    if (nextIndex < stages.length) {
      room.workflow.currentStageIndex = nextIndex
      const nextStage = stages[nextIndex]
      nextStage.status = 'in_progress'
      return {
        success: true,
        message: locale === 'en-US' ? `Stage [${currentStage.name}] approved. Workflow advanced to [${nextStage.name}], assigned members: [${nextStage.assignedRoleIds.join(', ')}]` : `阶段 [${currentStage.name}] 已通过审批！工作流流转至 [${nextStage.name}]，指派成员: [${nextStage.assignedRoleIds.join(', ')}]`,
        stage: nextStage,
      }
    } else {
      return {
        success: true,
        message: locale === 'en-US' ? `Done. Workflow [${room.workflow.title}] has completed all stages and final acceptance.` : `恭喜！全盘工作流 [${room.workflow.title}] 所有阶段已全部圆满结题验收！`,
      }
    }
  }

  public static getReadyTasks(stage: WorkflowStage, ownerRoleId?: string): WorkflowTask[] {
    this.refreshTaskReadiness(stage)
    return (stage.tasks || []).filter(task => task.status === 'ready' && (!ownerRoleId || task.ownerRoleId === ownerRoleId))
  }

  public static updateTaskStatus(
    room: GroupChatRoom,
    stageId: string,
    taskId: string,
    status: WorkflowTask['status'],
    options: { assignmentId?: string; verifyCommand?: string; verificationOutput?: string; verificationExitCode?: number; verifiedByRoleId?: string; locale?: GroupChatLocale } = {}
  ): { success: boolean; message: string; task?: WorkflowTask } {
    const stage = room.workflow?.stages.find(item => item.id === stageId)
    const task = stage?.tasks?.find(item => item.taskId === taskId)
    if (!stage || !task) return { success: false, message: options.locale === 'en-US' ? `Workflow task not found: ${stageId}/${taskId}` : `未找到工作流任务 ${stageId}/${taskId}` }
    task.status = status
    task.assignmentId = options.assignmentId || task.assignmentId
    if (options.verifyCommand !== undefined || options.verificationOutput !== undefined || options.verificationExitCode !== undefined) {
      task.verification = {
        command: options.verifyCommand ?? task.verifyCommand,
        output: options.verificationOutput,
        exitCode: options.verificationExitCode,
        verifiedByRoleId: options.verifiedByRoleId,
        verifiedAt: Date.now(),
      }
    }
    task.updatedAt = Date.now()
    this.refreshTaskReadiness(stage)
    return { success: true, message: options.locale === 'en-US' ? `Task ${task.taskId} updated to ${task.status}` : `任务 ${task.taskId} 已更新为 ${task.status}`, task }
  }



  public static applyTaskAction(
    room: GroupChatRoom,
    stageId: string,
    taskId: string,
    action: 'retry' | 'request_human' | 'skip',
    actorRoleId = 'commander',
    reason = '',
    locale: GroupChatLocale = 'zh-CN'
  ): { success: boolean; message: string; task?: WorkflowTask } {
    const stage = room.workflow?.stages.find(item => item.id === stageId)
    const task = stage?.tasks?.find(item => item.taskId === taskId)
    if (!stage || !task) return { success: false, message: locale === 'en-US' ? `Workflow task not found: ${stageId}/${taskId}` : `未找到工作流任务 ${stageId}/${taskId}` }

    if (action === 'retry') {
      task.status = 'ready'
      task.verification = {
        command: task.verifyCommand,
        output: reason || (locale === 'en-US' ? 'Master Agent requested retry; task returned to the ready queue.' : '主 Agent 要求重试，任务已重新放回 ready 队列。'),
        exitCode: 0,
        verifiedByRoleId: actorRoleId,
        verifiedAt: Date.now(),
      }
      stage.status = 'in_progress'
    } else if (action === 'request_human') {
      task.status = 'request_human'
      task.verification = {
        command: task.verifyCommand,
        output: reason || (locale === 'en-US' ? 'Needs more user input before continuing.' : '需要用户补充信息后继续。'),
        exitCode: 1,
        verifiedByRoleId: actorRoleId,
        verifiedAt: Date.now(),
      }
    } else if (action === 'skip') {
      task.status = 'passed'
      task.verification = {
        command: task.verifyCommand,
        output: reason || (locale === 'en-US' ? 'Master Agent manually skipped this task and accepts follow-up review responsibility.' : '主 Agent 已人工跳过该任务，并承担后续验收责任。'),
        exitCode: 0,
        verifiedByRoleId: actorRoleId,
        verifiedAt: Date.now(),
      }
    }

    task.updatedAt = Date.now()
    this.refreshTaskReadiness(stage)
    return { success: true, message: locale === 'en-US' ? `Task ${task.taskId} action ${action} applied; current status ${task.status}` : `任务 ${task.taskId} 已执行动作 ${action}，当前状态 ${task.status}`, task }
  }

  /**
 * Workflow orchestrator and approval gatekeeper.
 */
  public static rejectStage(
    room: GroupChatRoom,
    rejecterRoleId: string,
    rejectReason: string,
    locale: GroupChatLocale = 'zh-CN'
  ): { success: boolean; message: string } {
    if (!room.workflow) return { success: false, message: locale === 'en-US' ? 'No workflow configured.' : '无工作流配置。' }
    const current = room.workflow.stages[room.workflow.currentStageIndex]
    if (!current) return { success: false, message: locale === 'en-US' ? 'Invalid stage.' : '无效阶段。' }

    current.status = 'rejected'
    current.deliverableSummary = locale === 'en-US' ? `[Commander requested revision]: ${rejectReason}` : `【指挥官打回修改】: ${rejectReason}`

    return {
      success: true,
      message: locale === 'en-US' ? `Stage [${current.name}] was rejected. Reason: ${rejectReason}. Assigned members should revise accordingly.` : `阶段 [${current.name}] 已被驳回！原因: ${rejectReason}。请被指派成员根据意见重新整改。`,
    }
  }
}

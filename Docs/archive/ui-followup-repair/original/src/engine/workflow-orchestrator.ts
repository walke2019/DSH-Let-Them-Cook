/**
 * DSH Group Chat - 流程化工作流编排器与权限闸门控制 (Workflow Orchestrator & Gatekeeper)
 */

import type {
  GroupChatRoom,
  WorkflowDefinition,
  WorkflowStage,
  RolePermissions,
} from '../types.js'

export class WorkflowOrchestrator {
  /**
   * 创建标准全流程工作流（需求调研 -> 指挥审核 -> 前后端协同 -> 质检审计 -> 交付归档）
   */
  public static createStandardDevWorkflow(): WorkflowDefinition {
    const stages: WorkflowStage[] = [
      {
        id: 'stage_research',
        name: '阶段一：需求深潜与搜索调研',
        description: '由搜索调研员执行外部情报搜索、竞品对比、技术选型与调研简报整理。',
        assignedRoleIds: ['researcher'],
        status: 'in_progress',
        requiresApproval: true,
      },
      {
        id: 'stage_commander_review_1',
        name: '阶段二：指挥官调研审核与任务派发',
        description: '由总指挥官全盘把控方向，审核调研报告是否达标，并拆解具体落地任务。',
        assignedRoleIds: ['commander'],
        status: 'pending',
        requiresApproval: true,
      },
      {
        id: 'stage_implementation',
        name: '阶段三：前后端协同原型实现',
        description: '后端架构设计与数据契约建模，前端UI交互与视觉原型实现。',
        assignedRoleIds: ['backend', 'frontend'],
        status: 'pending',
        requiresApproval: false,
      },
      {
        id: 'stage_qa_audit',
        name: '阶段四：安全红队与质量对抗审计',
        description: '测试专家进行边界条件覆盖、并发安全审计、死锁风险排查。',
        assignedRoleIds: ['qa'],
        status: 'pending',
        requiresApproval: true,
      },
      {
        id: 'stage_documentation',
        name: '阶段五：文档沉淀与指挥官结题验收',
        description: '文档写手更新共享黑板与输出交付文档，总指挥官最终签字收官。',
        assignedRoleIds: ['writer', 'commander'],
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

  /**
   * 检查角色是否有权执行特定操作（权限闸门）
   */
  public static checkPermission(
    rolePermissions: RolePermissions,
    action: 'write_scratchpad' | 'approve_workflow' | 'call_tool',
    toolName?: string
  ): { allowed: boolean; reason?: string } {
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

    if (action === 'call_tool' && toolName) {
      if (rolePermissions.allowedTools.length > 0 && !rolePermissions.allowedTools.includes(toolName)) {
        return {
          allowed: false,
          reason: `工具权限越界：角色未获授权调用工具 [${toolName}]（仅限: ${rolePermissions.allowedTools.join(', ')}）。`,
        }
      }
      return { allowed: true }
    }

    return { allowed: true }
  }

  /**
   * 推进工作流到下一个阶段
   */
  public static advanceStage(
    room: GroupChatRoom,
    approverRoleId: string,
    summary?: string
  ): { success: boolean; message: string; stage?: WorkflowStage } {
    if (!room.workflow) {
      return { success: false, message: '当前房间未配置工作流。' }
    }

    const { stages, currentStageIndex } = room.workflow
    const currentStage = stages[currentStageIndex]

    if (!currentStage) {
      return { success: false, message: '工作流已处于完结状态。' }
    }

    // 校验审批权限：仅允许 commander 或拥有审批特权的角色/人类
    const approver = room.members.find(m => m.id === approverRoleId)
    if (currentStage.requiresApproval && approver && !approver.permissions.canApproveWorkflow) {
      return {
        success: false,
        message: `审批拒绝：角色 [${approver.name}] 没有工作流审核批准特权。`,
      }
    }

    // 结算当前阶段
    currentStage.status = 'completed'
    currentStage.approvedBy = approver?.name || '人类指挥官'
    currentStage.approvedAt = Date.now()
    if (summary) currentStage.deliverableSummary = summary

    // 激活下一阶段
    const nextIndex = currentStageIndex + 1
    if (nextIndex < stages.length) {
      room.workflow.currentStageIndex = nextIndex
      const nextStage = stages[nextIndex]
      nextStage.status = 'in_progress'
      return {
        success: true,
        message: `阶段 [${currentStage.name}] 已通过审批！工作流流转至 [${nextStage.name}]，指派成员: [${nextStage.assignedRoleIds.join(', ')}]`,
        stage: nextStage,
      }
    } else {
      return {
        success: true,
        message: `恭喜！全盘工作流 [${room.workflow.title}] 所有阶段已全部圆满结题验收！`,
      }
    }
  }

  /**
   * 驳回当前阶段工作流
   */
  public static rejectStage(
    room: GroupChatRoom,
    rejecterRoleId: string,
    rejectReason: string
  ): { success: boolean; message: string } {
    if (!room.workflow) return { success: false, message: '无工作流配置。' }
    const current = room.workflow.stages[room.workflow.currentStageIndex]
    if (!current) return { success: false, message: '无效阶段。' }

    current.status = 'rejected'
    current.deliverableSummary = `【指挥官打回修改】: ${rejectReason}`

    return {
      success: true,
      message: `阶段 [${current.name}] 已被驳回！原因: ${rejectReason}。请被指派成员根据意见重新整改。`,
    }
  }
}

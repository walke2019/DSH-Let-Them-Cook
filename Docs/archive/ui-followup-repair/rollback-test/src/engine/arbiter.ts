/**
 * DSH Group Chat - 调度仲裁器、防死循环与静默标记机制
 */

import type {
  GroupChatRoom,
  GroupMessageEnvelope,
  DispatchDecision,
  AgentProfile,
} from '../types.js'

export class DispatchArbiter {
  /**
   * 判断文本是否匹配静默标记 (Silence Token)
   * 遵循 OpenClaw 规范：默认 "NO_REPLY"（大小写不敏感，去空白）
   */
  public static isSilenceToken(
    content: string,
    silenceToken = 'NO_REPLY'
  ): boolean {
    if (!content) return false
    const trimmed = content.trim()
    if (!trimmed) return true

    const escaped = silenceToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`^\\s*${escaped}\\s*$`, 'i')
    return regex.test(trimmed)
  }

  /**
   * 从消息文本中解析所有被 @ 唤醒的成员或快捷指令
   */
  public static extractMentions(
    content: string,
    members: AgentProfile[]
  ): { targetAgentIds: string[]; isAll: boolean; isCommander: boolean } {
    const text = content.toLowerCase()
    const targetAgentIds = new Set<string>()
    let isAll = false
    let isCommander = false

    // 检查快捷指令
    if (text.includes('@全员') || text.includes('@all') || text.includes('@全员争鸣')) {
      isAll = true
      for (const m of members) {
        targetAgentIds.add(m.id)
      }
      return { targetAgentIds: Array.from(targetAgentIds), isAll, isCommander }
    }

    if (
      text.includes('@指挥官') ||
      text.includes('@总指挥') ||
      text.includes('@commander') ||
      text.includes('@主持人') ||
      text.includes('@诸葛亮') ||
      text.includes('@孔明') ||
      text.includes('@乔布斯')
    ) {
      isCommander = true
      const cmdAgent = members.find(m => m.id === 'commander')
      if (cmdAgent) targetAgentIds.add(cmdAgent.id)
    }

    // 逐个匹配成员
    for (const member of members) {
      const matchCandidates = [
        `@${member.id.toLowerCase()}`,
        `@${member.name.toLowerCase()}`,
        ...(member.groupChatRules?.mentionKeywords || []).map(k => k.toLowerCase())
      ]

      for (const candidate of matchCandidates) {
        if (text.includes(candidate)) {
          targetAgentIds.add(member.id)
          break
        }
      }
    }

    return {
      targetAgentIds: Array.from(targetAgentIds),
      isAll,
      isCommander,
    }
  }

  /**
   * 核心调度仲裁决策
   */
  public static decideNextSpeakers(
    room: GroupChatRoom,
    latestMessage: GroupMessageEnvelope
  ): DispatchDecision {
    const { dispatchMode, safetyPolicy, members, interactionRound, moderatorAgentId, workflow } = room

    // 1. 硬性熔断检查：单次指令的最大交互轮次
    if (interactionRound >= safetyPolicy.maxTurnsPerPrompt) {
      return {
        nextSpeakerIds: [],
        reason: `已达到单次会话最大协作轮次上限 (${safetyPolicy.maxTurnsPerPrompt} 轮)，硬性熔断触发，等待人类进一步输入。`,
        mode: dispatchMode,
        isTerminal: true,
      }
    }

    // 2. 跨 Agent 交互守则：Bot-to-Bot 触发约束
    if (latestMessage.sender.kind === 'agent') {
      if (!safetyPolicy.enableBotToBotTrigger && dispatchMode !== 'workflow_driven' && dispatchMode !== 'moderator_led') {
        return {
          nextSpeakerIds: [],
          reason: '当前房间未开启 Bot-to-Bot 自激触发，Agent 发言不自动拉起下一名成员。',
          mode: dispatchMode,
          isTerminal: true,
        }
      }
    }

    // 3. 静默标记过滤：若发言本身是 NO_REPLY，则中止进一步流转
    if (this.isSilenceToken(latestMessage.content, safetyPolicy.silenceToken)) {
      return {
        nextSpeakerIds: [],
        reason: '检测到静默标记 (NO_REPLY)，智能体主动保持沉默，流转结束。',
        mode: dispatchMode,
        isTerminal: true,
      }
    }

    // 4. 工作流驱动模式 (Workflow-Driven)
    if (dispatchMode === 'workflow_driven' && workflow) {
      const currentStage = workflow.stages[workflow.currentStageIndex]
      if (!currentStage) {
        return {
          nextSpeakerIds: [],
          reason: '工作流全部阶段已完成，等待总指挥官收官。',
          mode: 'workflow_driven',
          isTerminal: true,
        }
      }

      if (latestMessage.sender.kind === 'user') {
        // 用户发起消息，直接唤醒当前阶段被指派的角色
        return {
          nextSpeakerIds: currentStage.assignedRoleIds,
          reason: `工作流 [${workflow.title}] 进行中: 激活当前 [${currentStage.name}] 的指派人员 [${currentStage.assignedRoleIds.join(', ')}]`,
          mode: 'workflow_driven',
          isTerminal: false,
        }
      }

      // 如果当前发言人是当前阶段的角色，且不是指挥官自己，提交给指挥官审批
      if (currentStage.assignedRoleIds.includes(latestMessage.sender.id) && latestMessage.sender.id !== 'commander') {
        if (currentStage.requiresApproval) {
          return {
            nextSpeakerIds: ['commander'],
            reason: `阶段 [${currentStage.name}] 产物已输出，按流程进入指挥官审核把控环节。`,
            mode: 'workflow_driven',
            isTerminal: false,
          }
        }
      }

      // 指挥官审批通过后，若消息内提及通过，流转下一阶段
      if (latestMessage.sender.id === 'commander' && (latestMessage.content.includes('通过') || latestMessage.content.includes('批准') || latestMessage.content.includes('下一阶段'))) {
        // 更新阶段状态
        currentStage.status = 'completed'
        const nextIndex = workflow.currentStageIndex + 1
        if (nextIndex < workflow.stages.length) {
          workflow.currentStageIndex = nextIndex
          const nextStage = workflow.stages[nextIndex]
          nextStage.status = 'in_progress'
          return {
            nextSpeakerIds: nextStage.assignedRoleIds,
            reason: `总指挥官审核批准！流程推进至 [${nextStage.name}]，唤醒责任人 [${nextStage.assignedRoleIds.join(', ')}]`,
            mode: 'workflow_driven',
            isTerminal: false,
          }
        }
      }

      return {
        nextSpeakerIds: [],
        reason: '当前阶段流转收敛，等待总指挥官或下一阶段指令。',
        mode: 'workflow_driven',
        isTerminal: true,
      }
    }

    // 5. 根据常规模式进行分流仲裁
    switch (dispatchMode) {
      case 'mention_only': {
        const { targetAgentIds } = this.extractMentions(latestMessage.content, members)
        const validTargets = targetAgentIds.filter(id => id !== latestMessage.sender.id)

        if (validTargets.length > 0) {
          return {
            nextSpeakerIds: validTargets,
            reason: `严格 @Mention 模式：检测到明确唤醒目标 [${validTargets.join(', ')}]`,
            mode: 'mention_only',
            isTerminal: false,
          }
        }

        return {
          nextSpeakerIds: [],
          reason: '严格 @Mention 模式：未显式 @ 任何群成员，消息静默入库，不触发模型推理。',
          mode: 'mention_only',
          isTerminal: true,
        }
      }

      case 'moderator_led': {
        // 总指挥官 / 主持人编排模式
        const commanderId = moderatorAgentId || 'commander'
        if (latestMessage.sender.kind === 'user') {
          return {
            nextSpeakerIds: [commanderId],
            reason: `总指挥官编排模式：人类消息优先交由总指挥官 (${commanderId}) 拆解与全盘统筹。`,
            mode: 'moderator_led',
            isTerminal: false,
          }
        } else if (latestMessage.sender.id === commanderId) {
          const { targetAgentIds } = this.extractMentions(latestMessage.content, members)
          const validTargets = targetAgentIds.filter(id => id !== commanderId)
          if (validTargets.length > 0) {
            return {
              nextSpeakerIds: [validTargets[0]],
              reason: `总指挥官指派下一名执行专家: ${validTargets[0]}`,
              mode: 'moderator_led',
              isTerminal: false,
            }
          }
          return {
            nextSpeakerIds: [],
            reason: '总指挥官未指派下一步专家，当前讨论已收敛完成。',
            mode: 'moderator_led',
            isTerminal: true,
          }
        } else {
          return {
            nextSpeakerIds: [commanderId],
            reason: `成员 (${latestMessage.sender.id}) 汇报完毕，回传总指挥官 (${commanderId}) 进行审核与把关。`,
            mode: 'moderator_led',
            isTerminal: false,
          }
        }
      }

      case 'free_discussion': {
        const otherMembers = members
          .filter(m => m.id !== latestMessage.sender.id)
          .map(m => m.id)

        if (otherMembers.length === 0) {
          return {
            nextSpeakerIds: [],
            reason: '自由争鸣模式：群内无其他成员可参与讨论。',
            mode: 'free_discussion',
            isTerminal: true,
          }
        }

        return {
          nextSpeakerIds: otherMembers,
          reason: `自由争鸣模式：全员 (${otherMembers.join(', ')}) 自行评估相关度（无关则出 NO_REPLY）。`,
          mode: 'free_discussion',
          isTerminal: false,
        }
      }

      default:
        return {
          nextSpeakerIds: [],
          reason: '未知调度模式。',
          mode: dispatchMode,
          isTerminal: true,
        }
    }
  }
}

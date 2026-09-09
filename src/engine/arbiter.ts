/**
 * Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
 */

import type {
  GroupChatRoom,
  GroupMessageEnvelope,
  DispatchDecision,
  AgentProfile,
} from '../types.js'

export class DispatchArbiter {
  /**
 * Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
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
 * Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
 */
  public static extractMentions(
    content: string,
    members: AgentProfile[]
  ): { targetAgentIds: string[]; isAll: boolean; isCommander: boolean } {
    const text = content.toLowerCase()
    const targetAgentIds = new Set<string>()
    let isAll = false
    let isCommander = false

    // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
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
      text.includes('@乔布斯') ||
      text.includes('@jobs') ||
      text.includes('@史蒂夫')
    ) {
      isCommander = true
      const cmdAgent = members.find(m => m.id === 'commander')
      if (cmdAgent) targetAgentIds.add(cmdAgent.id)
    }

    const legendAliasMap: Record<string, string> = {
      '@马斯克': 'researcher',
      '@musk': 'researcher',
      '@elon': 'researcher',
      '@埃隆': 'researcher',
      '@黄仁勋': 'backend',
      '@老黄': 'backend',
      '@nvidia': 'backend',
      '@雷布斯': 'frontend',
      '@雷军': 'frontend',
      '@leijun': 'frontend',
      '@比尔盖茨': 'qa',
      '@盖茨': 'qa',
      '@gates': 'qa',
      '@张小龙': 'writer',
      '@allen': 'writer',
    }
    for (const [alias, roleId] of Object.entries(legendAliasMap)) {
      if (text.includes(alias)) {
        const agent = members.find(m => m.id === roleId)
        if (agent) targetAgentIds.add(agent.id)
      }
    }

    // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
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
 * Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
 */
  public static decideNextSpeakers(
    room: GroupChatRoom,
    latestMessage: GroupMessageEnvelope
  ): DispatchDecision {
    const { dispatchMode, safetyPolicy, members, interactionRound, moderatorAgentId, workflow } = room

    // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
    if (interactionRound >= safetyPolicy.maxTurnsPerPrompt) {
      return {
        nextSpeakerIds: [],
        reason: `已达到单次会话最大协作轮次上限 (${safetyPolicy.maxTurnsPerPrompt} 轮)，硬性熔断触发，等待人类进一步输入。`,
        mode: dispatchMode,
        isTerminal: true,
      }
    }

    // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
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

    // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
    if (this.isSilenceToken(latestMessage.content, safetyPolicy.silenceToken)) {
      return {
        nextSpeakerIds: [],
        reason: '检测到静默标记 (NO_REPLY)，智能体主动保持沉默，流转结束。',
        mode: dispatchMode,
        isTerminal: true,
      }
    }

    // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
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
        // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
        return {
          nextSpeakerIds: currentStage.assignedRoleIds,
          reason: `工作流 [${workflow.title}] 进行中: 激活当前 [${currentStage.name}] 的指派人员 [${currentStage.assignedRoleIds.join(', ')}]`,
          mode: 'workflow_driven',
          isTerminal: false,
        }
      }

      // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
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

      // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
      if (latestMessage.sender.id === 'commander' && (latestMessage.content.includes('通过') || latestMessage.content.includes('批准') || latestMessage.content.includes('下一阶段'))) {
        // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
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

    // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
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
        // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
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

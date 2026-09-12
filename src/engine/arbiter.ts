/**
 * Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
 */

import type {
  GroupChatRoom,
  GroupMessageEnvelope,
  DispatchDecision,
  AgentProfile,
  WorkflowTask,
  UserDecisionOption,
  UserDecisionPrompt,
} from '../types.js'
import { WorkflowOrchestrator } from './workflow-orchestrator.js'
import { THEME_CATALOG } from './themes.js'

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

    if (text.includes('@全员') || text.includes('@all') || text.includes('@全员争鸣') || text.includes('@everyone')) {
      isAll = true
      for (const m of members) {
        targetAgentIds.add(m.id)
      }
      return { targetAgentIds: Array.from(targetAgentIds), isAll, isCommander }
    }

    const universalRoleAliases: Record<string, string[]> = {
      commander: [
        '@commander', '@总指挥', '@总指挥官', '@指挥官', '@总导演', '@主持人', '@主agent', '@主控',
        '@master', '@lead', '@leader', '@导演', '@离谱总导演', '@诸葛亮', '@孔明', '@乔布斯', '@jobs',
        '@steve jobs', '@steve', '@史蒂夫', '@琴', '@代理团长', '@阿尔法总指挥官', '@首席技术官', '@cto',
      ],
      researcher: [
        '@researcher', '@调研', '@调研员', '@搜索', '@搜索员', '@情报', '@资料', '@侦探', '@专家', '@分析师',
        '@瓜田侦探', '@马斯克', '@elon', '@musk', '@elon musk', '@埃隆', '@司马徽', '@水镜先生', '@丽莎',
        '@深潜情报调研员', '@搜索分析师',
      ],
      backend: [
        '@backend', '@后端', '@架构', '@架构师', '@api', '@底座', '@锅王', '@服务端', '@后端锅王',
        '@黄仁勋', '@老黄', '@nvidia', '@jensen', '@jensen huang', '@关羽', '@云长', '@阿贝多',
        '@核心后端架构师', '@后端架构师',
      ],
      frontend: [
        '@frontend', '@前端', '@ui', '@交互', '@设计师', '@门面', '@显眼包', '@界面', '@像素显眼包',
        '@雷布斯', '@雷军', '@leijun', '@lei jun', '@周瑜', '@公瑾', '@可莉', '@宵宫',
        '@交互体验设计师', '@前端工程师',
      ],
      qa: [
        '@qa', '@测试', '@红队', '@质检', '@审计', '@审计官', '@质量', '@挑刺', '@阴间测试', '@阴间测试员',
        '@架构杠精', '@比尔盖茨', '@比尔·盖茨', '@盖茨', '@gates', '@bill', '@bill gates', '@魏延', '@文长',
        '@刻晴', '@砂糖', '@红队质量审计官', '@质量保证专家',
      ],
      writer: [
        '@writer', '@文档', '@文案', '@写手', '@记录', '@记录官', '@总结', '@压缩师', '@秘书', '@废话压缩师',
        '@张小龙', '@allen', '@allen zhang', '@陈琳', '@孔璋', '@闲云', '@诺艾尔',
        '@首席文案记录官', '@技术文案专家',
      ],
    }

    for (const [roleId, aliases] of Object.entries(universalRoleAliases)) {
      for (const alias of aliases) {
        if (text.includes(alias.toLowerCase())) {
          if (roleId === 'commander') isCommander = true
          const target = members.find(m => m.id === roleId)
          if (target) targetAgentIds.add(target.id)
        }
      }
    }

    for (const theme of Object.values(THEME_CATALOG)) {
      for (const [roleId, item] of Object.entries(theme)) {
        if (item.name && text.includes(`@${item.name.toLowerCase()}`)) {
          if (roleId === 'commander') isCommander = true
          const target = members.find(m => m.id === roleId)
          if (target) targetAgentIds.add(target.id)
        }
        if (item.nameEn && text.includes(`@${item.nameEn.toLowerCase()}`)) {
          if (roleId === 'commander') isCommander = true
          const target = members.find(m => m.id === roleId)
          if (target) targetAgentIds.add(target.id)
        }
      }
    }

    // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
    for (const member of members) {
      const matchCandidates = [
        `@${member.id.toLowerCase()}`,
        `@${member.name.toLowerCase()}`,
        ...(member.nameEn ? [`@${member.nameEn.toLowerCase()}`] : []),
        ...(member.groupChatRules?.mentionKeywords || []).map(k => k.toLowerCase())
      ]

      for (const candidate of matchCandidates) {
        if (text.includes(candidate)) {
          if (member.id === 'commander') isCommander = true
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

    const effectiveMaxTurns = (dispatchMode === 'workflow_driven' || room.assignments?.some(a => a.taskTier === 'long'))
      ? Math.max(safetyPolicy.maxTurnsPerPrompt || 6, 24)
      : (safetyPolicy.maxTurnsPerPrompt || 6)

    // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
    if (interactionRound >= effectiveMaxTurns) {
      return {
        nextSpeakerIds: [],
        reason: `已达到单次会话最大协作轮次上限 (${effectiveMaxTurns} 轮)，硬性熔断触发，等待人类进一步输入。`,
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
        const { targetAgentIds } = this.extractMentions(latestMessage.content, members)
        const commanderId = moderatorAgentId || 'commander'
        if (targetAgentIds.length > 0) {
          return {
            nextSpeakerIds: targetAgentIds,
            reason: `工作流进行中：响应人类指令唤醒责任人 [${targetAgentIds.join(', ')}]`,
            mode: 'workflow_driven',
            isTerminal: false,
          }
        }
        // If room was awaiting user decision, or user message is an answer/confirmation, or at task onset:
        if (room.awaitingUserDecision || (!room.assignments || room.assignments.length === 0) || /我拍板|我选|选项|方案|选择|确认|好的|行|可以|同意|ok|approve/i.test(latestMessage.content)) {
          return {
            nextSpeakerIds: [commanderId],
            reason: `人类指令由总指挥官 [${commanderId}] 统筹把控与人机衔接。`,
            mode: 'workflow_driven',
            isTerminal: false,
          }
        }
        // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
        return {
          nextSpeakerIds: currentStage.assignedRoleIds.length ? currentStage.assignedRoleIds : [commanderId],
          reason: `工作流 [${workflow.title}] 进行中: 激活当前 [${currentStage.name}] 的指派人员 [${(currentStage.assignedRoleIds.length ? currentStage.assignedRoleIds : [commanderId]).join(', ')}]`,
          mode: 'workflow_driven',
          isTerminal: false,
        }
      }

      // If sender is SubAgent (not commander):
      if (latestMessage.sender.id !== (moderatorAgentId || 'commander')) {
        const commanderId = moderatorAgentId || 'commander'

        const { targetAgentIds } = this.extractMentions(latestMessage.content, members)
        const validOtherTargets = targetAgentIds.filter(id => id !== latestMessage.sender.id && id !== commanderId)
        if (validOtherTargets.length > 0) {
          return {
            nextSpeakerIds: validOtherTargets,
            reason: `专家 [${latestMessage.sender.id}] 建议协同：唤醒 [${validOtherTargets.join(', ')}] 继续推进。`,
            mode: 'workflow_driven',
            isTerminal: false,
          }
        }

        // SubAgent always reports back to commander for review & coordination
        return {
          nextSpeakerIds: ['commander'],
          reason: `阶段 [${currentStage.name}] 产物已输出，按流程进入指挥官审核把控环节。`,
          mode: 'workflow_driven',
          isTerminal: false,
        }
      }

      // If sender is commander:
      if (latestMessage.sender.id === (moderatorAgentId || 'commander')) {
        const commanderId = moderatorAgentId || 'commander'

        // Check if commander is querying the user for decision or options
        const decisionReq = DispatchArbiter.detectUserDecisionRequest(latestMessage.content)
        if (decisionReq.isAwaiting) {
          return {
            nextSpeakerIds: [],
            reason: '总指挥官向用户发起方案抉择与确认，等待用户拍板回复。',
            mode: 'workflow_driven',
            isTerminal: true,
          }
        }

        const isReject = latestMessage.content.includes('驳回') ||
          latestMessage.content.includes('重做') ||
          latestMessage.content.includes('整改') ||
          latestMessage.content.includes('未通过') ||
          latestMessage.content.includes('不合格') ||
          /reject|rejected|redo/i.test(latestMessage.content)

        const allTasksPassed = currentStage.tasks && currentStage.tasks.length > 0 && currentStage.tasks.every(t => t.status === 'passed')

        const isAdvance = (!isReject && allTasksPassed) ||
          latestMessage.content.includes('通过') ||
          latestMessage.content.includes('批准') ||
          latestMessage.content.includes('下一阶段') ||
          latestMessage.content.includes('准予') ||
          latestMessage.content.includes('合格') ||
          latestMessage.content.includes('推进') ||
          latestMessage.content.includes('验收') ||
          latestMessage.content.includes('总装') ||
          latestMessage.content.includes('交付') ||
          latestMessage.content.includes('放行') ||
          latestMessage.content.includes('封箱') ||
          latestMessage.content.includes('完成') ||
          latestMessage.content.includes('交卷') ||
          /approve|approved|proceed|next stage|pass|lgtm|accepted|accept|finish|finished|done|ready/i.test(latestMessage.content)

        // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
        if (isAdvance) {
          // Dispatch arbiter, anti-loop rules, mention extraction, workflow routing, and silence-token handling.
          currentStage.status = 'completed'
          const nextIndex = workflow.currentStageIndex + 1
          if (nextIndex < workflow.stages.length) {
            workflow.currentStageIndex = nextIndex
            const nextStage = workflow.stages[nextIndex]
            nextStage.status = 'in_progress'

            const { targetAgentIds } = this.extractMentions(latestMessage.content, members)
            const validTargets = [...new Set(targetAgentIds.filter(id => id !== commanderId))]
            if (validTargets.length > 0) {
              return {
                nextSpeakerIds: validTargets,
                reason: `总指挥官审核批准！流程推进至 [${nextStage.name}]，分派指定责任人 [${validTargets.join(', ')}]`,
                mode: 'workflow_driven',
                isTerminal: false,
              }
            }

            const readyTasks = WorkflowOrchestrator.getReadyTasks(nextStage)
            const readyRoles = readyTasks.length > 0
              ? [...new Set(readyTasks.map((t: WorkflowTask) => t.ownerRoleId))] as string[]
              : nextStage.assignedRoleIds.filter(id => id !== commanderId)
            const stageTargets = readyRoles.length > 0 ? readyRoles : (nextStage.assignedRoleIds.filter(id => id !== commanderId).length ? nextStage.assignedRoleIds.filter(id => id !== commanderId) : nextStage.assignedRoleIds)
            return {
              nextSpeakerIds: stageTargets,
              reason: `总指挥官审核批准！流程推进至 [${nextStage.name}]，唤醒责任人 [${stageTargets.join(', ')}]`,
              mode: 'workflow_driven',
              isTerminal: false,
            }
          } else {
            return {
              nextSpeakerIds: [],
              reason: '工作流全部阶段已顺利通过总指挥官最终验收与结题收口。',
              mode: 'workflow_driven',
              isTerminal: true,
            }
          }
        }

        const { targetAgentIds } = this.extractMentions(latestMessage.content, members)
        const validTargets = [...new Set(targetAgentIds.filter(id => id !== commanderId))]
        if (validTargets.length > 0) {
          return {
            nextSpeakerIds: validTargets,
            reason: `工作流主 Agent 明确 @ 分派 SubAgent：[${validTargets.join(', ')}]`,
            mode: 'workflow_driven',
            isTerminal: false,
          }
        }

        const isQuickTask = room.assignments?.some(a => a.taskTier === 'quick') && !room.assignments?.some(a => a.taskTier === 'long')
        if (isQuickTask) {
          return {
            nextSpeakerIds: [],
            reason: '快速任务由主 Agent 直接独立回答完毕，正常完结。',
            mode: 'workflow_driven',
            isTerminal: true,
          }
        }

        const currentReadyTasks = WorkflowOrchestrator.getReadyTasks(currentStage)
        if (currentReadyTasks.length > 0) {
          const readyRoleIds = [...new Set(currentReadyTasks.map((t: WorkflowTask) => t.ownerRoleId))] as string[]
          return {
            nextSpeakerIds: readyRoleIds,
            reason: `阶段 [${currentStage.name}] 仍有就绪任务未完成，指派责任人 [${readyRoleIds.join(', ')}] 继续执行。`,
            mode: 'workflow_driven',
            isTerminal: false,
          }
        }

        // Anti-stall fallback: if stage still has incomplete tasks, dispatch pending task owners
        const pendingTasks = (currentStage.tasks || []).filter(t => t.status !== 'passed')
        if (pendingTasks.length > 0) {
          const pendingRoleIds = [...new Set(pendingTasks.map(t => t.ownerRoleId).filter(id => id !== commanderId))]
          if (pendingRoleIds.length > 0) {
            return {
              nextSpeakerIds: pendingRoleIds.slice(0, 2),
              reason: `阶段 [${currentStage.name}] 仍有未放行任务，防中断指派责任人 [${pendingRoleIds.slice(0, 2).join(', ')}] 继续推进。`,
              mode: 'workflow_driven',
              isTerminal: false,
            }
          }
        }

        // Anti-stall fallback: if stage assigned subagents have not completed, awaken them
        const subagentRoles = currentStage.assignedRoleIds.filter(id => id !== commanderId)
        if (subagentRoles.length > 0) {
          return {
            nextSpeakerIds: subagentRoles,
            reason: `阶段 [${currentStage.name}] 协作推进中，唤醒本阶段责任人 [${subagentRoles.join(', ')}] 继续执行。`,
            mode: 'workflow_driven',
            isTerminal: false,
          }
        }

        return {
          nextSpeakerIds: [],
          reason: '当前阶段流转收敛，等待总指挥官或下一阶段指令。',
          mode: 'workflow_driven',
          isTerminal: true,
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
          const { targetAgentIds } = this.extractMentions(latestMessage.content, members)
          const validTargets = targetAgentIds.filter(id => id !== commanderId)
          if (validTargets.length > 0) {
            return {
              nextSpeakerIds: validTargets,
              reason: `总指挥官编排模式：优先唤醒点名专家 [${validTargets.join(', ')}] 承接执行。`,
              mode: 'moderator_led',
              isTerminal: false,
            }
          }
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
              nextSpeakerIds: validTargets,
              reason: `总指挥官指派下一名执行专家: ${validTargets.join(', ')}`,
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

  /**
   * Detect if Commander is asking the user for confirmation or presenting options for decision.
   */
  public static detectUserDecisionRequest(text: string): { isAwaiting: boolean; prompt?: UserDecisionPrompt } {
    if (!text || typeof text !== 'string') return { isAwaiting: false }
    const lower = text.toLowerCase()

    const hasUserAddress = lower.includes('@用户') || lower.includes('@人类') || lower.includes('@人类负责人') || lower.includes('@user') || lower.includes('@director')
    const hasDecisionKeywords = lower.includes('请您抉择') || lower.includes('需要您拍板') || lower.includes('请用户选择') || lower.includes('方案抉择') || lower.includes('等待您确认') || lower.includes('请拍板') || lower.includes('如何抉择') || lower.includes('请您拍板') || lower.includes('请用户拍板')
    const hasOptionsMention = /选项\s*[a-d1-4]|方案\s*[a-d1-4]|option\s*[a-d1-4]/i.test(text) || text.includes('【方案') || text.includes('【选项')

    const isQuestioning = text.includes('？') || text.includes('?') || text.includes('请选择') || text.includes('请确认') || text.includes('请您抉择') || text.includes('需要您拍板')

    // Only treat as real decision if it actually presents structured options or asks an explicit question with options
    const isAwaiting = hasOptionsMention && (hasDecisionKeywords || isQuestioning || hasUserAddress)

    if (!isAwaiting) return { isAwaiting: false }

    const options: UserDecisionOption[] = []
    let recommendedKey: string | undefined
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

    for (const line of lines) {
      const match = line.match(/^[-*•]?\s*(?:【?(?:选项|方案|option)\s*([A-Za-z0-9一二三四1-4])】?[:：]?\s*(.*?))$/i)
      if (match) {
        const key = match[1].toUpperCase()
        const label = match[2] || `选项 ${key}`
        const isRec = label.includes('推荐') || label.includes('Recommended') || line.includes('推荐')
        if (isRec) recommendedKey = key
        options.push({
          key,
          label: `选项 ${key}：${label.replace(/[（(]?(?:推荐|Recommended)[）)]?/g, '').trim()}`,
          isRecommended: isRec,
        })
      }
    }

    const questionMatch = text.match(/【(?:需要您拍板|方案抉择|请您抉择|决策事项|Decision Needed)[^】]*】[：:]?\s*([^\n]+)/i)
    const question = questionMatch ? questionMatch[1].trim() : (options.length > 0 ? '主 Agent 提出了如下方案，请您拍板选择：' : text.slice(0, 140))

    return {
      isAwaiting: true,
      prompt: {
        question,
        options: options.length > 0 ? options : undefined,
        recommendedOptionKey: recommendedKey,
        askedByRoleId: 'commander',
        askedAt: Date.now(),
      }
    }
  }
}


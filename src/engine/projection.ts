/**
 * Context projection optimized for prompt caching, scoped roster, assignments, mailbox, scratchpad, and compact history.
 */

import type {
  AgentProfile,
  GroupChatRoom,
  GroupMessageEnvelope,
} from '../types.js'
import type {GroupChatLocale} from '../client/i18n.js'
import { ORCHESTRATOR_RUNTIME_SKILL_SUMMARY } from './orchestrator-skill.js'
import { STRUCTURED_AGENT_RESULT_PROMPT } from './structured-result.js'

export class ContextProjection {
  /**
 * Context projection optimized for prompt caching, scoped roster, assignments, mailbox, scratchpad, and compact history.
 */
  public static readonly SHARED_CONSTITUTION = `【群聊多 Agent 协同公共准则】
1. 专职专责：你仅代表你的专职角色发言，严禁代替其他成员作答，直奔技术或业务主题，杜绝客套寒暄。
2. 静默契约：若当前问题与你的专长无关，或前序其他成员的发言已充分解决，你必须且只能输出单一行：
NO_REPLY
3. 防死循环：严禁互相致谢、无意义附和或无休止套话。
4. 共享黑板：关注 [Shared Scratchpad] 中的阶段性共识与技术指标，无需重复提问已达成共识的信息。`

  public static readonly SHARED_CONSTITUTION_EN = `[Group Chat Multi-Agent Constitution]
1. Role boundary: speak only as your assigned specialist role. Do not answer for other members. Be concise and skip pleasantries.
2. Silence contract: if the topic is unrelated to your expertise, or prior members already solved it, output exactly one line:
NO_REPLY
3. Anti-loop: no mutual thanks, empty agreement, or endless small talk.
4. Shared scratchpad: use [Shared Scratchpad] for settled context and technical decisions; do not ask again for known facts.`

  /**
 * Context projection optimized for prompt caching, scoped roster, assignments, mailbox, scratchpad, and compact history.
 */
  public static formatRoster(members: AgentProfile[], locale: GroupChatLocale = 'zh-CN'): string {
    const list = members.map(
      m => {
        const name = locale === 'en-US' && m.nameEn ? m.nameEn : m.name
        const desc = locale === 'en-US' && m.roleDescriptionEn ? m.roleDescriptionEn : m.roleDescription
        return `- @${name} (id: ${m.id}): ${desc}`
      }
    )
    return locale === 'en-US' ? `[Group Chat Roster]\n${list.join('\n')}` : `【群聊成员名册】\n${list.join('\n')}`
  }

  /**
 * Context projection optimized for prompt caching, scoped roster, assignments, mailbox, scratchpad, and compact history.
 */
  public static formatHistoryForAgent(
    targetAgent: AgentProfile,
    allMessages: GroupMessageEnvelope[],
    maxFullHistory = 6,
    locale: GroupChatLocale = 'zh-CN'
  ): string {
    if (!allMessages || allMessages.length === 0) {
      return locale === 'en-US' ? '(No prior conversation)' : '(暂无历史对话)'
    }

    const recentMessages = allMessages.slice(-maxFullHistory)
    const olderMessages = allMessages.slice(0, -maxFullHistory)

    const lines: string[] = []

    // Context projection optimized for prompt caching, scoped roster, assignments, mailbox, scratchpad, and compact history.
    if (olderMessages.length > 0) {
      lines.push(locale === 'en-US' ? '[Background Activity Digest]' : '[Background Activity Digest - 前序背景摘要]')
      for (const msg of olderMessages) {
        if (msg.metadata?.isSilent) continue
        const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const shortContent = msg.content.length > 60 ? `${msg.content.slice(0, 60)}...` : msg.content
        lines.push(`- ${timeStr} [${msg.sender.name}]: ${shortContent.replace(/\n+/g, ' ')}`)
      }
      lines.push('')
    }

    // Context projection optimized for prompt caching, scoped roster, assignments, mailbox, scratchpad, and compact history.
    lines.push(locale === 'en-US' ? '[Active Group Conversation]' : '[Active Group Conversation - 近期群聊实况]')
    for (const msg of recentMessages) {
      if (msg.metadata?.isSilent) continue
      const senderTag = msg.sender.kind === 'user'
        ? `[User: ${msg.sender.name}]`
        : `[Member: ${msg.sender.name} (${msg.sender.id})]`
      lines.push(`${senderTag}: ${msg.content}`)
    }

    return lines.join('\n')
  }


  public static formatOrchestrationPolicy(room: GroupChatRoom, locale: GroupChatLocale = 'zh-CN'): string {
    const strategy = room.orchestration
    if (!strategy) return ''
    const route = strategy.toolRoutingPolicy
    const modelHints = strategy.modelHints || {}
    const hintLines = Object.entries(modelHints).map(([roleId, hint]) => locale === 'en-US' ? `- ${roleId}: ${hint.requiredCapabilities.join(', ')}; cost=${hint.costPreference}; latency=${hint.latencyPreference}` : `- ${roleId}: ${hint.requiredCapabilities.join(', ')}；成本=${hint.costPreference}；延迟=${hint.latencyPreference}`)
    if (locale === 'en-US') return `[GroupChat Orchestrator Policy]
- Master Agent: ${strategy.masterAgentId}. It understands intent, asks follow-ups when needed, delegates tasks, gates stages, and synthesizes the final answer.
- SubAgents: ${strategy.subAgentIds.join(', ')}. They execute only their own specialties and report back.
- DSH workflow stage parallelism: ${route.allowStageParallelism ? 'kept; multiple assignedRoleIds in the same stage may run in parallel for separate duties.' : 'disabled.'}
- Tool routing: search/crawl/data extraction belong to ${route.webSearchOwner}/${route.crawlOwner}/${route.dataExtractionOwner}; backend code to ${route.backendCodeOwner}; frontend/UI debugging to ${route.frontendCodeOwner}/${route.uiDebugOwner}; QA/audit to ${route.qaOwner}; docs to ${route.docsOwner}; synthesis to ${route.reducerOwner}.
- Duplicate tool race: ${route.forbidDuplicateToolRace ? 'forbidden; the Master Agent assigns one owner for a tool task before it runs.' : 'allowed.'}
- Model suggestions match capability tags only; manual user settings take priority.
${hintLines.length ? `- Role model capability tags:
${hintLines.join('\n')}` : ''}`
    return `【GroupChat Orchestrator Policy / 扩展默认协同协议】
- 主 Agent：${strategy.masterAgentId}，负责理解意图、必要追问、任务分派、阶段审批与最终收口。
- SubAgent：${strategy.subAgentIds.join(', ')}，按角色职责执行，不越俎代庖。
- DSH workflow 阶段并发：${route.allowStageParallelism ? '保留，同一阶段的多个 assignedRoleIds 可以并发执行各自职责。' : '关闭。'}
- 工具路由：搜索/爬取/资料抽取由 ${route.webSearchOwner}/${route.crawlOwner}/${route.dataExtractionOwner} 归口；后端代码由 ${route.backendCodeOwner}；前端与 UI 调试由 ${route.frontendCodeOwner}/${route.uiDebugOwner}；测试审计由 ${route.qaOwner}；文档沉淀由 ${route.docsOwner}；结论归纳由 ${route.reducerOwner}。
- 重复工具竞争：${route.forbidDuplicateToolRace ? '禁止多个 Agent 对同一个工具任务重复并发调用；先由主 Agent 分派给唯一责任人。' : '允许。'}
- 模型建议只按能力标签匹配，不硬编码模型 ID；用户手动设置优先。
${hintLines.length ? `- 角色模型能力标签：
${hintLines.join('\n')}` : ''}`
  }

  public static formatAssignmentsForAgent(room: GroupChatRoom, targetAgent: AgentProfile, locale: GroupChatLocale = 'zh-CN'): string {
    const own = (room.assignments || []).filter(item => item.ownerRoleId === targetAgent.id && item.status !== 'completed').slice(-6)
    const inbox = (room.mailboxes?.[targetAgent.id] || []).slice(-6)
    const lines: string[] = []
    if (own.length) {
      lines.push(locale === 'en-US' ? '[Your Active Assignments]' : '[Your Active Assignments / 你的当前任务]')
      for (const item of own) {
        lines.push(`- ${item.assignmentId} · ${item.status} · ${item.taskType}${item.workflowTaskId ? ` · workflowTask=${item.workflowTaskId}` : ''} · ${item.brief}`)
      }
    }
    if (inbox.length) {
      lines.push(locale === 'en-US' ? '[Mailbox to You]' : '[Mailbox to You / 发给你的回执]')
      for (const msg of inbox) {
        const text = msg.content.length > 120 ? `${msg.content.slice(0, 120)}...` : msg.content
        lines.push(`- from ${msg.fromRoleId}${msg.assignmentId ? ` · assignment ${msg.assignmentId}` : ''}: ${text.replace(/\n+/g, ' ')}`)
      }
    }
    return lines.join('\n')
  }

  /**
 * Context projection optimized for prompt caching, scoped roster, assignments, mailbox, scratchpad, and compact history.
 */
  public static assembleSystemPrompt(
    targetAgent: AgentProfile,
    room: GroupChatRoom,
    allMessages: GroupMessageEnvelope[],
    locale: GroupChatLocale = 'zh-CN'
  ): string {
    const parts: string[] = [
      // Context projection optimized for prompt caching, scoped roster, assignments, mailbox, scratchpad, and compact history.
      locale === 'en-US' ? this.SHARED_CONSTITUTION_EN : this.SHARED_CONSTITUTION,
      '',
      // Context projection optimized for prompt caching, scoped roster, assignments, mailbox, scratchpad, and compact history.
      this.formatRoster(room.members, locale),
      '',
      // Context projection optimized for prompt caching, scoped roster, assignments, mailbox, scratchpad, and compact history.
      locale === 'en-US' ? `[Your specialist role: ${targetAgent.name} (${targetAgent.id})]\n${targetAgent.systemPrompt}` : `【你的专职角色定义: ${targetAgent.name} (${targetAgent.id})】\n${targetAgent.systemPrompt}`,
    ]

    parts.push('', ORCHESTRATOR_RUNTIME_SKILL_SUMMARY)
    const policyText = this.formatOrchestrationPolicy(room, locale)
    if (policyText) parts.push('', policyText)

    const assignmentText = this.formatAssignmentsForAgent(room, targetAgent, locale)
    if (assignmentText) parts.push('', `${locale === 'en-US' ? '[Assignments & Mailbox]' : '【Assignments & Mailbox / 当前任务与邮箱】'}\n${assignmentText}`, '', STRUCTURED_AGENT_RESULT_PROMPT)

    // Context projection optimized for prompt caching, scoped roster, assignments, mailbox, scratchpad, and compact history.
    if (room.scratchpad && room.scratchpad.trim()) {
      parts.push(
        '',
        `${locale === 'en-US' ? '[Shared Scratchpad]' : '【Shared Scratchpad (共享黑板 / 阶段性共识)】'}\n${room.scratchpad.trim()}`
      )
    }

    // Context projection optimized for prompt caching, scoped roster, assignments, mailbox, scratchpad, and compact history.
    if (room.pinnedGoal && room.pinnedGoal.trim()) {
      parts.push(
        '',
        `${locale === 'en-US' ? '[Current Pinned Goal]' : '【Current Pinned Goal (当前阶段目标)】'}\n${room.pinnedGoal.trim()}`
      )
    }

    // Context projection optimized for prompt caching, scoped roster, assignments, mailbox, scratchpad, and compact history.
    const historyText = this.formatHistoryForAgent(targetAgent, allMessages, 6, locale)
    parts.push(
      '',
      `${locale === 'en-US' ? '[Conversation Context]' : '【对话上下文】'}\n${historyText}`,
      '',
      locale === 'en-US' ? `Speak as ${targetAgent.name}. Give a professional, concise response to the latest topic. If you have nothing useful to add, output NO_REPLY.` : `请以【${targetAgent.name}】的身份，针对最新议题发表专业、精炼的意见。若无补充，输出 NO_REPLY。`
    )

    return parts.join('\n')
  }
}

/**
 * DSH Group Chat - 上下文投影、Token 节俭压缩与 Prompt Caching 优化
 */

import type {
  AgentProfile,
  GroupChatRoom,
  GroupMessageEnvelope,
} from '../types.js'

export class ContextProjection {
  /**
   * 固定公共群规 (Shared Constitution) - 静态稳定区，高命中率 KV Cache
   */
  public static readonly SHARED_CONSTITUTION = `【群聊多 Agent 协同公共准则】
1. 专职专责：你仅代表你的专职角色发言，严禁代替其他成员作答，直奔技术或业务主题，杜绝客套寒暄。
2. 静默契约：若当前问题与你的专长无关，或前序其他成员的发言已充分解决，你必须且只能输出单一行：
NO_REPLY
3. 防死循环：严禁互相致谢、无意义附和或无休止套话。
4. 共享黑板：关注 [Shared Scratchpad] 中的阶段性共识与技术指标，无需重复提问已达成共识的信息。`

  /**
   * 生成群成员名册描述 (Group Roster)
   */
  public static formatRoster(members: AgentProfile[]): string {
    const list = members.map(
      m => `- @${m.name} (id: ${m.id}): ${m.roleDescription}`
    )
    return `【群聊成员名册】\n${list.join('\n')}`
  }

  /**
   * 格式化投递给 Agent 的标准发言历史
   * 采用短语化标头压缩（Pending Backfill），最大化节省上下文
   */
  public static formatHistoryForAgent(
    targetAgent: AgentProfile,
    allMessages: GroupMessageEnvelope[],
    maxFullHistory = 6
  ): string {
    if (!allMessages || allMessages.length === 0) {
      return '(暂无历史对话)'
    }

    const recentMessages = allMessages.slice(-maxFullHistory)
    const olderMessages = allMessages.slice(0, -maxFullHistory)

    const lines: string[] = []

    // 1. 早期未提及闲聊：短语化标头压缩 (耗费 5~10 token/条)
    if (olderMessages.length > 0) {
      lines.push('[Background Activity Digest - 前序背景摘要]')
      for (const msg of olderMessages) {
        if (msg.metadata?.isSilent) continue
        const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const shortContent = msg.content.length > 60 ? `${msg.content.slice(0, 60)}...` : msg.content
        lines.push(`- ${timeStr} [${msg.sender.name}]: ${shortContent.replace(/\n+/g, ' ')}`)
      }
      lines.push('')
    }

    // 2. 近期活跃消息：完整标头投影
    lines.push('[Active Group Conversation - 近期群聊实况]')
    for (const msg of recentMessages) {
      if (msg.metadata?.isSilent) continue
      const senderTag = msg.sender.kind === 'user'
        ? `[User: ${msg.sender.name}]`
        : `[Member: ${msg.sender.name} (${msg.sender.id})]`
      lines.push(`${senderTag}: ${msg.content}`)
    }

    return lines.join('\n')
  }

  /**
   * 为目标 Agent 装配完整的 Prompt Caching 友好型 System Prompt
   */
  public static assembleSystemPrompt(
    targetAgent: AgentProfile,
    room: GroupChatRoom,
    allMessages: GroupMessageEnvelope[]
  ): string {
    const parts: string[] = [
      // 1. 静态公共群规
      this.SHARED_CONSTITUTION,
      '',
      // 2. 静态成员名册
      this.formatRoster(room.members),
      '',
      // 3. 当前 Agent 专属私有人设
      `【你的专职角色定义: ${targetAgent.name} (${targetAgent.id})】\n${targetAgent.systemPrompt}`,
    ]

    // 4. 共享黑板（若存在）
    if (room.scratchpad && room.scratchpad.trim()) {
      parts.push(
        '',
        `【Shared Scratchpad (共享黑板 / 阶段性共识)】\n${room.scratchpad.trim()}`
      )
    }

    // 5. 置顶目标（若存在）
    if (room.pinnedGoal && room.pinnedGoal.trim()) {
      parts.push(
        '',
        `【Current Pinned Goal (当前阶段目标)】\n${room.pinnedGoal.trim()}`
      )
    }

    // 6. 规整后的历史背景
    const historyText = this.formatHistoryForAgent(targetAgent, allMessages)
    parts.push(
      '',
      `【对话上下文】\n${historyText}`,
      '',
      `请以【${targetAgent.name}】的身份，针对最新议题发表专业、精炼的意见。若无补充，输出 NO_REPLY。`
    )

    return parts.join('\n')
  }
}

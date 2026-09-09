/**
 * DSH Group Chat - 房间状态机、成员花名册、事件分发与消息持久化 (Room Coordinator)
 */

import { randomUUID } from 'node:crypto'
import type {
  GroupChatRoom,
  GroupMessageEnvelope,
  AgentProfile,
  RoomLedger,
  GroupChatEvent,
  DispatchMode,
  PersonaThemeKey,
} from '../types.js'
import { DispatchArbiter } from './arbiter.js'
import { ContextProjection } from './projection.js'
import { WorkflowOrchestrator } from './workflow-orchestrator.js'
import { THEME_CATALOG } from './themes.js'

export class RoomManager {
  private rooms = new Map<string, GroupChatRoom>()
  private roomMessages = new Map<string, GroupMessageEnvelope>()
  private roomMessageLists = new Map<string, GroupMessageEnvelope[]>()
  private roomLedgers = new Map<string, RoomLedger>()
  private eventListeners = new Set<(event: GroupChatEvent) => void>()

  constructor() {
    this.initDefaultRooms()
  }

  /**
   * 构建基础 6 大核心角色清单
   */
  public createDefaultFleet(theme: PersonaThemeKey = 'modern'): AgentProfile[] {
    const mappings = THEME_CATALOG[theme]

    return [
      {
        id: 'commander',
        name: mappings.commander.name,
        avatar: mappings.commander.avatar,
        color: mappings.commander.color,
        title: mappings.commander.title,
        roleDescription: '负责全盘目标把控、任务分工规划、各阶段交付物审核门控与收官验收。',
        systemPrompt: `你是群聊团队的【总指挥官】(${mappings.commander.name})。
口头禅: "${mappings.commander.catchphrase}"
你的核心职责：
1. 全盘任务分工：面对用户需求，理清优先级与交付步骤；
2. 阶段审核门控：对搜索调研、前后端实现、测试结果进行逐一严格审查，只有确认合格才予以批准进入下一阶段；
3. 决断与收敛：防止成员无意义争论，直击问题本质，下达确切指令。`,
        llmConfig: {
          provider: '',
          model: '',
          temperature: 0.3,
        },
        permissions: {
          level: 'admin',
          canWriteScratchpad: true,
          canApproveWorkflow: true,
          allowedTools: ['workflow_advance_stage', 'workflow_reject_stage', 'group_chat_update_scratchpad', 'group_chat_export_summary'],
        },
        groupChatRules: {
          mentionKeywords: ['@commander', '@指挥官', '@总指挥', `@${mappings.commander.name}`],
          canDelegateToOthers: true,
        },
      },
      {
        id: 'researcher',
        name: mappings.researcher.name,
        avatar: mappings.researcher.avatar,
        color: mappings.researcher.color,
        title: mappings.researcher.title,
        roleDescription: '负责外部资料搜索、网页解析爬取、竞品方案调研与提取结构化情报总结。',
        systemPrompt: `你是群聊团队的【搜索调研专家】(${mappings.researcher.name})。
口头禅: "${mappings.researcher.catchphrase}"
你的核心职责：
1. 外部探索：针对议题进行全网权威信源检索与前沿方案剖析；
2. 结构化总结：输出包含背景、优劣势对比、事实佐证与推荐选项的情报简报；
3. 【关键节点规则】：任务完成后必须在回复末尾显式向总指挥官汇报（如："请@总指挥官 审查并裁决下一步"），以进入指挥官审核把关环节。`,
        llmConfig: {
          provider: '',
          model: '',
          temperature: 0.2,
        },
        permissions: {
          level: 'read_write',
          canWriteScratchpad: false,
          canApproveWorkflow: false,
          allowedTools: ['web_search', 'stealth_read_page', 'stealth_navigate'],
        },
        groupChatRules: {
          mentionKeywords: ['@researcher', '@调研', '@搜索', `@${mappings.researcher.name}`],
          canDelegateToOthers: true,
        },
      },
      {
        id: 'backend',
        name: mappings.backend.name,
        avatar: mappings.backend.avatar,
        color: mappings.backend.color,
        title: mappings.backend.title,
        roleDescription: '负责系统业务逻辑实现、数据结构建模、接口契约设计与高可用并发保障。',
        systemPrompt: `你是群聊团队的【核心后端架构师】(${mappings.backend.name})。
口头禅: "${mappings.backend.catchphrase}"
你的核心职责：
1. 契约设计：基于调研结果定义清晰的数据类型与 API 规范；
2. 稳健实现：给出健壮的后端逻辑、状态机、错误处理与并发防死锁控制；
3. 【关键节点规则】：完成实现后必须在回复末尾显式向总指挥官汇报并呈交红队质检。`,
        llmConfig: {
          provider: '',
          model: '',
          temperature: 0.2,
        },
        permissions: {
          level: 'read_write',
          canWriteScratchpad: false,
          canApproveWorkflow: false,
          allowedTools: ['tool_fs', 'tool_jobs'],
        },
        groupChatRules: {
          mentionKeywords: ['@backend', '@后端', '@架构', `@${mappings.backend.name}`],
          canDelegateToOthers: true,
        },
      },
      {
        id: 'frontend',
        name: mappings.frontend.name,
        avatar: mappings.frontend.avatar,
        color: mappings.frontend.color,
        title: mappings.frontend.title,
        roleDescription: '负责交互原型设计、视觉组件美化、响应式排版与用户体验优化。',
        systemPrompt: `你是群聊团队的【交互体验设计师/前端开发】(${mappings.frontend.name})。
口头禅: "${mappings.frontend.catchphrase}"
你的核心职责：
1. 界面原型设计：打造美观、直观、高可用的人机界面；
2. 交互打磨：注重细节反馈、微动效、状态加载与无障碍适配；
3. 【关键节点规则】：原型与组件设计完成后，在回复末尾显式向总指挥官汇报并呈交红队质检。`,
        llmConfig: {
          provider: '',
          model: '',
          temperature: 0.3,
        },
        permissions: {
          level: 'read_write',
          canWriteScratchpad: false,
          canApproveWorkflow: false,
          allowedTools: ['tool_fs', 'modlens_read_image'],
        },
        groupChatRules: {
          mentionKeywords: ['@frontend', '@前端', '@UI', `@${mappings.frontend.name}`],
          canDelegateToOthers: true,
        },
      },
      {
        id: 'qa',
        name: mappings.qa.name,
        avatar: mappings.qa.avatar,
        color: mappings.qa.color,
        title: mappings.qa.title,
        roleDescription: '负责严苛红队对抗审查、极限用例推演、安全漏洞排查与质量阻断把关。',
        systemPrompt: `你是群聊团队的【红队质量审计官】(${mappings.qa.name})。
口头禅: "${mappings.qa.catchphrase}"
你的核心职责：
1. 挑刺与极限推演：拒绝老好人，专门挖掘边界盲区、逻辑死锁与安全隐患；
2. 红队测试用例：给出对抗性破坏场景，验证系统韧性；
3. 【关键节点规则】：审计完毕后必须向总指挥官汇报风险评估报告，由总指挥官最终决断是否放行。`,
        llmConfig: {
          provider: '',
          model: '',
          temperature: 0.1,
        },
        permissions: {
          level: 'audit_only',
          canWriteScratchpad: false,
          canApproveWorkflow: false,
          allowedTools: [],
        },
        groupChatRules: {
          mentionKeywords: ['@qa', '@测试', '@安全', '@审计', `@${mappings.qa.name}`],
          canDelegateToOthers: false,
        },
      },
      {
        id: 'writer',
        name: mappings.writer.name,
        avatar: mappings.writer.avatar,
        color: mappings.writer.color,
        title: mappings.writer.title,
        roleDescription: '负责提炼各阶段共识、更新共享黑板、编写标准化交付物与用户手册。',
        systemPrompt: `你是群聊团队的【首席文案记录官】(${mappings.writer.name})。
口头禅: "${mappings.writer.catchphrase}"
你的核心职责：
1. 共识凝练：实时追踪群聊动态，萃取阶段结论更新至【Shared Scratchpad】；
2. 成果交付物沉淀：撰写规范易读的技术规范书、PRD 或操作指南；
3. 【关键节点规则】：文档整理归档后，向总指挥官汇报终审，由总指挥官进行最终签字结题验收。`,
        llmConfig: {
          provider: '',
          model: '',
          temperature: 0.2,
        },
        permissions: {
          level: 'read_write',
          canWriteScratchpad: true,
          canApproveWorkflow: false,
          allowedTools: ['group_chat_update_scratchpad'],
        },
        groupChatRules: {
          mentionKeywords: ['@writer', '@文档', '@写手', '@纪要', `@${mappings.writer.name}`],
          canDelegateToOthers: true,
        },
      },
    ]
  }

  /**
   * 初始化内置业务模板房间
   */
  private initDefaultRooms(): void {
    const fleet = this.createDefaultFleet('modern')
    const workflow = WorkflowOrchestrator.createStandardDevWorkflow()

    const defaultRoom: GroupChatRoom = {
      roomId: 'dev-team-alpha',
      title: '多 Agent 全能特遣队 (Universal Fleet)',
      masterSessionId: 'default',
      dispatchMode: 'workflow_driven',
      moderatorAgentId: 'commander',
      activeTheme: 'modern',
      members: fleet,
      workflow,
      scratchpad: '## 阶段共识与项目全局黑板\n- 机制：总指挥审核把关 + 调研先行 + 权限隔离 + 工作流流水线\n- 当前阶段：阶段一·需求深潜与搜索调研',
      pinnedGoal: '通过流程化工作流完成任何行业级业务任务',
      safetyPolicy: {
        maxTurnsPerPrompt: 6,
        silenceToken: 'NO_REPLY',
        enableBotToBotTrigger: true,
        cooldownPeriodMs: 30000,
      },
      interactionRound: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    this.rooms.set(defaultRoom.roomId, defaultRoom)
    this.roomMessageLists.set(defaultRoom.roomId, [])
    this.initLedger(defaultRoom.roomId)
  }

  private initLedger(roomId: string): void {
    this.roomLedgers.set(roomId, {
      roomId,
      totalCalls: 0,
      totalTokens: 0,
      agentStats: {},
    })
  }

  public getRoom(roomId: string): GroupChatRoom | undefined {
    return this.rooms.get(roomId)
  }

  public getAllRooms(): GroupChatRoom[] {
    return Array.from(this.rooms.values())
  }

  public getMessages(roomId: string): GroupMessageEnvelope[] {
    return this.roomMessageLists.get(roomId) || []
  }

  public getLedger(roomId: string): RoomLedger | undefined {
    return this.roomLedgers.get(roomId)
  }

  /**
   * 切换房间名号映射主题 (modern / three_kingdoms / legends)
   */
  public switchTheme(roomId: string, theme: PersonaThemeKey): GroupChatRoom | undefined {
    const room = this.rooms.get(roomId)
    if (!room) return undefined

    const themeMap = THEME_CATALOG[theme]
    if (!themeMap) return room

    room.activeTheme = theme

    // 批量映射成员信息
    for (const member of room.members) {
      const mapped = themeMap[member.id]
      if (mapped) {
        member.name = mapped.name
        member.avatar = mapped.avatar
        member.color = mapped.color
        member.title = mapped.title
        member.groupChatRules.mentionKeywords = [
          `@${member.id}`,
          `@${mapped.name}`,
          ...(THEME_CATALOG.modern[member.id] ? [`@${THEME_CATALOG.modern[member.id].name}`] : [])
        ]
      }
    }

    this.saveRoom(room)
    return room
  }

  /**
   * 自定义更新指定角色档案 (修改姓名、头像/本地上传图片、职责、提示词、模型、权限)
   */
  public updateAgentProfile(
    roomId: string,
    agentId: string,
    updates: Partial<Pick<AgentProfile, 'name' | 'avatar' | 'title' | 'roleDescription' | 'systemPrompt' | 'llmConfig' | 'permissions'>>
  ): AgentProfile | undefined {
    const room = this.rooms.get(roomId)
    if (!room) return undefined

    const member = room.members.find(m => m.id === agentId)
    if (!member) return undefined

    if (updates.name !== undefined) {
      member.name = updates.name
      // 联动更新 @ 识别关键字
      if (!member.groupChatRules.mentionKeywords.includes(`@${updates.name}`)) {
        member.groupChatRules.mentionKeywords.push(`@${updates.name}`)
      }
    }
    if (updates.avatar !== undefined) member.avatar = updates.avatar
    if (updates.title !== undefined) member.title = updates.title
    if (updates.roleDescription !== undefined) member.roleDescription = updates.roleDescription
    if (updates.systemPrompt !== undefined) member.systemPrompt = updates.systemPrompt
    if (updates.llmConfig !== undefined) member.llmConfig = { ...member.llmConfig, ...updates.llmConfig }
    if (updates.permissions !== undefined) member.permissions = { ...member.permissions, ...updates.permissions }

    this.saveRoom(room)
    this.broadcast({
      type: 'room:updated',
      roomId,
      timestamp: Date.now(),
      payload: room,
    })

    return member
  }

  /**
   * 注册事件订阅
   */
  public subscribe(listener: (event: GroupChatEvent) => void): () => void {
    this.eventListeners.add(listener)
    return () => this.eventListeners.delete(listener)
  }

  /**
   * 广播事件
   */
  public broadcast(event: GroupChatEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event)
      } catch (err) {
        console.error('[RoomManager] Broadcast listener error:', err)
      }
    }
  }

  /**
   * 创建或保存房间
   */
  public saveRoom(room: GroupChatRoom): void {
    room.updatedAt = Date.now()
    this.rooms.set(room.roomId, room)
    if (!this.roomMessageLists.has(room.roomId)) {
      this.roomMessageLists.set(room.roomId, [])
    }
    if (!this.roomLedgers.has(room.roomId)) {
      this.initLedger(room.roomId)
    }
    this.broadcast({
      type: 'room:updated',
      roomId: room.roomId,
      payload: room,
      timestamp: Date.now(),
    })
  }

  /**
   * 切换调度模式
   */
  public setDispatchMode(roomId: string, mode: DispatchMode): GroupChatRoom | undefined {
    const room = this.rooms.get(roomId)
    if (room) {
      room.dispatchMode = mode
      this.saveRoom(room)
    }
    return room
  }

  /**
   * 更新共享黑板 (需校验写入权限)
   */
  public updateScratchpad(
    roomId: string,
    scratchpad: string,
    operatorRoleId = 'commander'
  ): { success: boolean; message: string; room?: GroupChatRoom } {
    const room = this.rooms.get(roomId)
    if (!room) return { success: false, message: '房间不存在。' }

    const operator = room.members.find(m => m.id === operatorRoleId)
    if (operator && !operator.permissions.canWriteScratchpad && operator.permissions.level !== 'admin') {
      return {
        success: false,
        message: `权限拦截：角色 [${operator.name}] 无权修改共享黑板，仅总指挥官与文案写手允许编辑。`,
      }
    }

    room.scratchpad = scratchpad
    this.saveRoom(room)
    this.broadcast({
      type: 'scratchpad:updated',
      roomId,
      payload: { scratchpad },
      timestamp: Date.now(),
    })
    return { success: true, message: '共享黑板更新成功！', room }
  }

  /**
   * 添加消息并记账
   */
  public addMessage(
    roomId: string,
    message: Omit<GroupMessageEnvelope, 'messageId' | 'timestamp'> & { messageId?: string }
  ): GroupMessageEnvelope {
    const envelope: GroupMessageEnvelope = {
      messageId: message.messageId || randomUUID(),
      roomId,
      sender: message.sender,
      content: message.content,
      reasoningContent: message.reasoningContent,
      mentions: message.mentions || [],
      metadata: message.metadata || {},
      timestamp: Date.now(),
    }

    // 检查静默标记
    const room = this.getRoom(roomId)
    const silenceToken = room?.safetyPolicy?.silenceToken || 'NO_REPLY'
    if (DispatchArbiter.isSilenceToken(envelope.content, silenceToken)) {
      envelope.metadata.isSilent = true
    }

    const list = this.roomMessageLists.get(roomId) || []
    list.push(envelope)
    this.roomMessageLists.set(roomId, list)

    // 更新账本
    if (envelope.sender.kind === 'agent' && envelope.metadata?.tokensConsumed) {
      const ledger = this.roomLedgers.get(roomId)
      if (ledger) {
        ledger.totalCalls += 1
        const consumed = envelope.metadata.tokensConsumed
        ledger.totalTokens += consumed.totalTokens

        if (!ledger.agentStats[envelope.sender.id]) {
          ledger.agentStats[envelope.sender.id] = {
            agentId: envelope.sender.id,
            agentName: envelope.sender.name,
            callCount: 0,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          }
        }
        const stat = ledger.agentStats[envelope.sender.id]
        stat.callCount += 1
        stat.promptTokens += consumed.promptTokens
        stat.completionTokens += consumed.completionTokens
        stat.totalTokens += consumed.totalTokens
      }
    }

    // 仅在非静默时对外广播
    if (!envelope.metadata.isSilent) {
      this.broadcast({
        type: 'message:new',
        roomId,
        payload: envelope,
        timestamp: Date.now(),
      })
    }

    return envelope
  }

  /**
   * 重置单次人类指令的互动轮数计数
   */
  public resetInteractionRound(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (room) {
      room.interactionRound = 0
      this.saveRoom(room)
    }
  }

  /**
   * 递增单次交互轮数
   */
  public incrementInteractionRound(roomId: string): number {
    const room = this.rooms.get(roomId)
    if (room) {
      room.interactionRound += 1
      this.saveRoom(room)
      return room.interactionRound
    }
    return 0
  }

  /**
   * 导出群聊讨论纪要
   */
  public exportMeetingSummary(roomId: string): string {
    const room = this.getRoom(roomId)
    const messages = this.getMessages(roomId)
    if (!room) return '未找到对应群聊房间。'

    const lines: string[] = [
      `# 📋 群聊协同讨论与成果纪要: ${room.title}`,
      `> 导出时间: ${new Date().toLocaleString()} | 当前主题: ${room.activeTheme} | 成员数: ${room.members.length}`,
      '',
      '## 一、核心共识 (Shared Scratchpad)',
      room.scratchpad || '（暂无阶段性共识）',
      '',
      '## 二、工作流流转状态 (Workflow Pipeline)',
    ]

    if (room.workflow) {
      for (let i = 0; i < room.workflow.stages.length; i++) {
        const s = room.workflow.stages[i]
        const stateMark = s.status === 'completed' ? '✅' : s.status === 'in_progress' ? '🔄' : s.status === 'rejected' ? '❌' : '⏳'
        lines.push(`- ${stateMark} **${s.name}** [状态: ${s.status}] (责任人: ${s.assignedRoleIds.join(', ')})`)
        if (s.deliverableSummary) lines.push(`  - 产物/意见: ${s.deliverableSummary}`)
      }
    }

    lines.push('', '## 三、参与智能体花名册 (Agent Roster)')
    for (const m of room.members) {
      const permTag = `[权限: ${m.permissions.level}]`
      lines.push(`- **${m.name}** (\`@${m.id}\`, ${m.title || ''}): ${m.roleDescription} ${permTag}`)
    }

    lines.push('', '## 四、讨论核心脉络 (Message Stream)')
    for (const msg of messages) {
      if (msg.metadata?.isSilent) continue
      const senderTag = msg.sender.kind === 'user' ? '👤 ' + msg.sender.name : '🤖 ' + msg.sender.name
      const timeStr = new Date(msg.timestamp).toLocaleTimeString()
      lines.push(`### [${timeStr}] ${senderTag}`)
      lines.push(msg.content, '')
    }

    const ledger = this.getLedger(roomId)
    if (ledger && ledger.totalCalls > 0) {
      lines.push('## 五、资源消耗审计 (Token Ledger)')
      lines.push(`- 累计调用: ${ledger.totalCalls} 次`)
      lines.push(`- 累计消耗: ${ledger.totalTokens} Tokens`)
      for (const [id, stat] of Object.entries(ledger.agentStats)) {
        lines.push(`  - **${stat.agentName}**: ${stat.callCount} 次调用，${stat.totalTokens} Tokens`)
      }
    }

    return lines.join('\n')
  }
}

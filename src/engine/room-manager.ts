/**
 * Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
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
  AgentOrchestrationStrategy,
  PendingAutoSetupDraft,
  WorkflowDefinition,
  AssignmentEnvelope,
  AssignmentTaskType,
  GroupTaskTier,
  AgentMailboxMessage,
  CaptainTaskProtocol,
  CaptainTaskNode,
  CoordinationEvent,
  ApprovalTransaction,
} from '../types.js'
import { DispatchArbiter } from './arbiter.js'
import { ContextProjection } from './projection.js'
import { WorkflowOrchestrator } from './workflow-orchestrator.js'
import { THEME_CATALOG } from './themes.js'
import { DEFAULT_ROLE_MODEL_HINTS, DEFAULT_TOOL_ROUTING_POLICY, attachRoleModelHints, createMasterSubagentStrategy } from './auto-setup.js'
import {normalizeToolNames} from '../compat/dsh.js'

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
 * Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
 */
  public createDefaultFleet(theme: PersonaThemeKey = 'modern'): AgentProfile[] {
    const mappings = THEME_CATALOG[theme]

    return attachRoleModelHints([
      {
        id: 'commander',
        name: mappings.commander.name,
        nameEn: mappings.commander.nameEn,
        avatar: mappings.commander.avatar,
        color: mappings.commander.color,
        title: mappings.commander.title,
        titleEn: mappings.commander.titleEn,
        roleDescription: '负责全盘目标把控、任务分工规划、各阶段交付物审核门控与收官验收。',
        roleDescriptionEn: 'Orchestrates the project goal, reviews phase gates, and drives final closure.',
        systemPrompt: `你是群聊团队的【总指挥官】(${mappings.commander.name})。
口头禅: "${mappings.commander.catchphrase}"
你的核心职责：
1. 全盘任务分工：面对用户需求，理清优先级与交付步骤；
2. 阶段审核门控：对搜索调研、前后端实现、测试结果进行逐一严格审查，只有确认合格才予以批准进入下一阶段；
3. 决断与收敛：防止成员无意义争论，直击问题本质，下达确切指令；
4. 人机协同汇报：你是人类负责人的总参谋长。每当关键阶段产物就绪或面临架构路线选择时，必须在回复末尾向 @人类负责人 简明汇报，并主动征询负责人的确认意见，让负责人始终掌控项目主权！`,
        llmConfig: {
          provider: '',
          model: '',
          temperature: 0.3,
        },
        permissions: {
          level: 'admin',
          canWriteScratchpad: true,
          canApproveWorkflow: true,
          allowedTools: ['read', 'glob', 'grep', 'group_chat_workflow_advance', 'group_chat_workflow_reject', 'group_chat_update_scratchpad', 'group_chat_export_summary', 'group_chat_room_status', 'group_chat_set_mode', 'group_chat_task_claim', 'group_chat_task_report', 'group_chat_task_close', 'group_chat_task_handoff', 'group_chat_transaction_create', 'group_chat_transaction_action', 'group_chat_ask_user', 'ask_user_question'],
        },
        groupChatRules: {
          mentionKeywords: ['@commander', '@指挥官', '@总指挥', `@${mappings.commander.name}`],
          canDelegateToOthers: true,
        },
      },
      {
        id: 'researcher',
        name: mappings.researcher.name,
        nameEn: mappings.researcher.nameEn,
        avatar: mappings.researcher.avatar,
        color: mappings.researcher.color,
        title: mappings.researcher.title,
        titleEn: mappings.researcher.titleEn,
        roleDescription: '负责外部资料搜索、网页解析爬取、竞品方案调研与提取结构化情报总结。',
        roleDescriptionEn: 'Exhausts external web intel, crawls specs, and distills structured briefings.',
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
          allowedTools: ['web_search', 'web_fetch', 'stealth_read_page', 'read', 'glob', 'grep', 'group_chat_room_status', 'group_chat_export_summary', 'group_chat_task_claim', 'group_chat_task_report', 'group_chat_task_block', 'group_chat_task_handoff'],
        },
        groupChatRules: {
          mentionKeywords: ['@researcher', '@调研', '@搜索', `@${mappings.researcher.name}`],
          canDelegateToOthers: true,
        },
      },
      {
        id: 'backend',
        name: mappings.backend.name,
        nameEn: mappings.backend.nameEn,
        avatar: mappings.backend.avatar,
        color: mappings.backend.color,
        title: mappings.backend.title,
        titleEn: mappings.backend.titleEn,
        roleDescription: '负责系统业务逻辑实现、数据结构建模、接口契约设计与高可用并发保障。',
        roleDescriptionEn: 'Implements business logic, API schemas, high concurrency, and resilient systems.',
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
          allowedTools: ['read', 'write', 'edit', 'glob', 'grep', 'bash', 'group_chat_room_status', 'group_chat_task_claim', 'group_chat_task_report', 'group_chat_task_block', 'group_chat_task_handoff'],
        },
        groupChatRules: {
          mentionKeywords: ['@backend', '@后端', '@架构', `@${mappings.backend.name}`],
          canDelegateToOthers: true,
        },
      },
      {
        id: 'frontend',
        name: mappings.frontend.name,
        nameEn: mappings.frontend.nameEn,
        avatar: mappings.frontend.avatar,
        color: mappings.frontend.color,
        title: mappings.frontend.title,
        titleEn: mappings.frontend.titleEn,
        roleDescription: '负责交互原型设计、视觉组件美化、响应式排版与用户体验优化。',
        roleDescriptionEn: 'Crafts responsive UI, elastic layouts, interactive feedback, and user empathy.',
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
          allowedTools: ['read', 'write', 'edit', 'glob', 'grep', 'bash', 'read_image', 'group_chat_room_status', 'group_chat_task_claim', 'group_chat_task_report', 'group_chat_task_block', 'group_chat_task_handoff'],
        },
        groupChatRules: {
          mentionKeywords: ['@frontend', '@前端', '@UI', `@${mappings.frontend.name}`],
          canDelegateToOthers: true,
        },
      },
      {
        id: 'qa',
        name: mappings.qa.name,
        nameEn: mappings.qa.nameEn,
        avatar: mappings.qa.avatar,
        color: mappings.qa.color,
        title: mappings.qa.title,
        titleEn: mappings.qa.titleEn,
        roleDescription: '负责严苛红队对抗审查、极限用例推演、安全漏洞排查与质量阻断把关。',
        roleDescriptionEn: 'Executes adversarial testing, edge case discovery, and release gate audits.',
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
          allowedTools: ['read', 'glob', 'grep', 'bash', 'group_chat_room_status', 'group_chat_export_summary', 'group_chat_task_claim', 'group_chat_task_report', 'group_chat_task_block'],
        },
        groupChatRules: {
          mentionKeywords: ['@qa', '@测试', '@安全', '@审计', `@${mappings.qa.name}`],
          canDelegateToOthers: false,
        },
      },
      {
        id: 'writer',
        name: mappings.writer.name,
        nameEn: mappings.writer.nameEn,
        avatar: mappings.writer.avatar,
        color: mappings.writer.color,
        title: mappings.writer.title,
        titleEn: mappings.writer.titleEn,
        roleDescription: '负责提炼各阶段共识、更新共享黑板、编写标准化交付物与用户手册。',
        roleDescriptionEn: 'Captures consensus into specs, updates scratchpad, and writes plain-talk docs.',
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
          allowedTools: ['read', 'write', 'edit', 'glob', 'grep', 'group_chat_update_scratchpad', 'group_chat_export_summary', 'group_chat_room_status', 'group_chat_task_claim', 'group_chat_task_report', 'group_chat_task_close'],
        },
        groupChatRules: {
          mentionKeywords: ['@writer', '@文档', '@写手', '@纪要', `@${mappings.writer.name}`],
          canDelegateToOthers: true,
        },
      },
    ])
  }

  /**
 * Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
 */
  private initDefaultRooms(): void {
    const fleet = this.createDefaultFleet('meme_comedy')
    const workflow = WorkflowOrchestrator.createStandardDevWorkflow()

    const defaultRoom: GroupChatRoom = {
      roomId: 'dev-team-alpha',
      title: 'DSH 开整天团工作台',
      masterSessionId: 'default',
      dispatchMode: 'workflow_driven',
      moderatorAgentId: 'commander',
      activeTheme: 'meme_comedy',
      members: fleet,
      workflow,
      assignments: [],
      captainTaskProtocol: undefined,
      coordinationEvents: [],
      approvalTransactions: [],
      mailboxes: {},
      orchestration: createMasterSubagentStrategy(fleet),
      scratchpad: '## 阶段共识与项目全局黑板\n- 机制：总指挥审核把关 + 调研先行 + 权限隔离 + 工作流流水线\n- 当前阶段：阶段一·需求深潜与搜索调研',
      pinnedGoal: '用有趣但靠谱的多 Agent 小队把任务推进到可交付',
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


  private ensureOrchestrationPolicy(room: GroupChatRoom): void {
    if (!room.orchestration) room.orchestration = createMasterSubagentStrategy(room.members)
    room.orchestration.toolRoutingPolicy = {...DEFAULT_TOOL_ROUTING_POLICY, ...(room.orchestration.toolRoutingPolicy || {})}
    room.orchestration.modelHints = {...DEFAULT_ROLE_MODEL_HINTS, ...(room.orchestration.modelHints || {})}
    room.orchestration.masterAgentId ||= room.moderatorAgentId || 'commander'
    room.orchestration.subAgentIds = room.orchestration.subAgentIds?.length ? room.orchestration.subAgentIds : room.members.filter(m => m.id !== room.orchestration!.masterAgentId).map(m => m.id)
    room.members = attachRoleModelHints(room.members)
    for (const member of room.members) {
      member.permissions ||= {level: 'read_only', canWriteScratchpad: false, canApproveWorkflow: false, allowedTools: []}
      member.permissions.allowedTools = normalizeToolNames(member.permissions.allowedTools || [])
    }
    if (room.workflow) WorkflowOrchestrator.ensureTaskDag(room.workflow)
    room.assignments ||= []
    room.coordinationEvents ||= []
    room.approvalTransactions ||= []
    room.mailboxes ||= {}
  }

  private initLedger(roomId: string): void {
    this.roomLedgers.set(roomId, {
      roomId,
      totalCalls: 0,
      totalTokens: 0,
      metrics: {turnCount:0,stepCount:0,llmMs:0,toolMs:0,firstTokenMsTotal:0,firstTokenCount:0,inputTokens:0,outputTokens:0,cacheReadTokens:0,cacheWriteTokens:0},
      agentStats: {},
    })
  }

  private addRuntimeMetrics(target: import('../types.js').AgentRuntimeMetrics, delta?: import('../types.js').AgentRuntimeMetrics): void {
    if (!delta) return
    target.turnCount += delta.turnCount || 0
    target.stepCount += delta.stepCount || 0
    target.llmMs += delta.llmMs || 0
    target.toolMs += delta.toolMs || 0
    target.firstTokenMsTotal += delta.firstTokenMsTotal || 0
    target.firstTokenCount += delta.firstTokenCount || 0
    target.inputTokens += delta.inputTokens || 0
    target.outputTokens += delta.outputTokens || 0
    target.cacheReadTokens += delta.cacheReadTokens || 0
    target.cacheWriteTokens += delta.cacheWriteTokens || 0
  }


  public ensureRoomForSession(roomId: string, masterSessionId = roomId): GroupChatRoom {
    const existing = this.getRoom(roomId)
    if (existing) return existing
    const fleet = this.createDefaultFleet('meme_comedy')
    const workflow = WorkflowOrchestrator.createStandardDevWorkflow()
    const room: GroupChatRoom = {
      roomId,
      title: 'DSH 开整天团工作台',
      masterSessionId,
      dispatchMode: 'workflow_driven',
      moderatorAgentId: 'commander',
      activeTheme: 'meme_comedy',
      members: fleet,
      workflow,
      assignments: [],
      captainTaskProtocol: undefined,
      coordinationEvents: [],
      approvalTransactions: [],
      mailboxes: {},
      orchestration: createMasterSubagentStrategy(fleet),
      scratchpad: '## 阶段共识与项目全局黑板\n- 机制：总指挥审核把关 + 调研先行 + 权限隔离 + 工作流流水线\n- 当前阶段：等待本会话的新任务',
      pinnedGoal: '用有趣但靠谱的多 Agent 小队把任务推进到可交付',
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
    this.saveRoom(room)
    return room
  }

  public getRoom(roomId: string): GroupChatRoom | undefined {
    const room = this.rooms.get(roomId)
    if (room) this.ensureOrchestrationPolicy(room)
    return room
  }

  public getAllRooms(): GroupChatRoom[] {
    return Array.from(this.rooms.values()).map(room => { this.ensureOrchestrationPolicy(room); return room })
  }

  public getMessages(roomId: string): GroupMessageEnvelope[] {
    return this.roomMessageLists.get(roomId) || []
  }

  public getLedger(roomId: string): RoomLedger | undefined {
    return this.roomLedgers.get(roomId)
  }

  public clearRoom(roomId: string): GroupChatRoom | undefined {
    this.roomMessageLists.set(roomId, [])
    this.initLedger(roomId)
    const room = this.rooms.get(roomId)
    if (room) {
      room.assignments = []
      room.approvalTransactions = []
      room.coordinationEvents = []
      room.mailboxes = {}
      room.scratchpad = ''
      room.interactionRound = 0
      room.awaitingUserDecision = undefined
      if (room.workflow) {
        room.workflow.currentStageIndex = 0
        for (let i = 0; i < room.workflow.stages.length; i++) {
          const s = room.workflow.stages[i]
          s.status = i === 0 ? 'in_progress' : 'pending'
          s.deliverableSummary = undefined
          s.approvedBy = undefined
          s.approvedAt = undefined
          for (const t of s.tasks || []) {
            t.status = 'pending'
            t.verification = undefined
            t.assignmentId = undefined
          }
        }
      }
      this.broadcast({ type: 'room:cleared', roomId, payload: { roomId }, timestamp: Date.now() })
      this.broadcast({ type: 'room:updated', roomId, payload: room, timestamp: Date.now() })
      return room
    }
    return undefined
  }

  public clearAllRooms(): void {
    const roomIds = Array.from(this.rooms.keys())
    for (const id of roomIds) {
      this.clearRoom(id)
    }
  }

  /**
 * Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
 */
  public switchTheme(roomId: string, theme: PersonaThemeKey): GroupChatRoom | undefined {
    const room = this.rooms.get(roomId)
    if (!room) return undefined

    const themeMap = THEME_CATALOG[theme as keyof typeof THEME_CATALOG]
    if (!themeMap) return room

    room.activeTheme = theme
    const themedFleet = new Map(this.createDefaultFleet(theme).map(agent => [agent.id, agent]))

    // Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
    for (const member of room.members) {
      const mapped = themeMap[member.id]
      if (mapped) {
        member.name = mapped.name
        member.nameEn = mapped.nameEn
        member.avatar = mapped.avatar
        member.color = mapped.color
        member.title = mapped.title
        member.titleEn = mapped.titleEn
        const themedAgent = themedFleet.get(member.id)
        if (themedAgent?.systemPrompt) member.systemPrompt = themedAgent.systemPrompt
        if (themedAgent?.roleDescription) member.roleDescription = themedAgent.roleDescription
        if (themedAgent?.roleDescriptionEn) member.roleDescriptionEn = themedAgent.roleDescriptionEn
        member.groupChatRules.mentionKeywords = [
          `@${member.id}`,
          `@${mapped.name}`,
          ...(mapped.nameEn ? [`@${mapped.nameEn}`] : []),
          ...(THEME_CATALOG.modern[member.id] ? [`@${THEME_CATALOG.modern[member.id].name}`] : [])
        ]
      }
    }

    this.saveRoom(room)
    return room
  }

  public applyGeneratedTheme(roomId: string, members: AgentProfile[], themeKey: PersonaThemeKey = `custom_${Date.now()}` as PersonaThemeKey, workflow?: WorkflowDefinition, orchestration?: AgentOrchestrationStrategy): GroupChatRoom | undefined {
    const room = this.rooms.get(roomId)
    if (!room) return undefined
    const byId = new Map(members.map(member => [member.id, member]))
    room.members = room.members.map(member => {
      const next = byId.get(member.id)
      return next ? structuredClone({...member, ...next, llmConfig: member.llmConfig, resiliencePolicy: member.resiliencePolicy, permissions: member.permissions}) : member
    })
    room.activeTheme = themeKey
    if (workflow) room.workflow = structuredClone(workflow)
    room.orchestration = orchestration ? structuredClone(orchestration) : createMasterSubagentStrategy(room.members)
    room.dispatchMode = 'workflow_driven'
    room.moderatorAgentId = room.orchestration.masterAgentId
    room.pendingAutoSetup = undefined
    room.scratchpad = `${room.scratchpad}
- 主题角色/工作流已写入工作区：${new Date().toLocaleString()}，策略：主 Agent ${room.orchestration.masterAgentId} + SubAgent ${room.orchestration.subAgentIds.join(' / ')}。`
    this.saveRoom(room)
    return room
  }

  public setPendingAutoSetup(roomId: string, draft?: PendingAutoSetupDraft): GroupChatRoom | undefined {
    const room = this.rooms.get(roomId)
    if (!room) return undefined
    room.pendingAutoSetup = draft ? structuredClone(draft) : undefined
    this.saveRoom(room)
    return room
  }

  public applyPendingAutoSetup(roomId: string): GroupChatRoom | undefined {
    const room = this.rooms.get(roomId)
    const draft = room?.pendingAutoSetup
    if (!room || !draft) return undefined
    return this.applyGeneratedTheme(roomId, draft.members, `custom_${Date.now()}` as PersonaThemeKey, draft.workflow, draft.orchestration)
  }



  public createCaptainTaskProtocol(roomId: string, sourceMessageId: string | undefined, brief: string, taskTier: GroupTaskTier = 'quick'): CaptainTaskProtocol | undefined {
    const room = this.getRoom(roomId)
    if (!room) return undefined
    const now = Date.now()
    const masterId = room.orchestration?.masterAgentId || room.moderatorAgentId || 'commander'
    const pick = (roleId: string, title: string, taskType: CaptainTaskNode['taskType'], taskBrief: string, dependsOn: string[] = []): CaptainTaskNode => ({
      taskId: `${taskType}.${now}.${roleId}`,
      title,
      ownerRoleId: roleId,
      taskType,
      status: dependsOn.length ? 'pending' : 'ready',
      dependsOn,
      brief: taskBrief,
      createdAt: now,
      updatedAt: now,
    })
    const needsResearch = /搜索|调研|资料|竞品|research|crawl|web/i.test(brief)
    const needsUi = /UI|界面|前端|样式|布局|视觉|frontend|design/i.test(brief)
    const needsCode = /代码|后端|接口|状态|实现|bug|修复|backend|api|fix/i.test(brief)
    const needsDocs = /文档|README|说明|双语|英文|中文|docs|copy|i18n/i.test(brief)
    const tasks: CaptainTaskNode[] = [pick(masterId, '主 Agent 判断任务路线', 'review', brief)]
    if (needsResearch) tasks.push(pick('researcher', '调研专员收集情报', 'research', brief, [tasks[0].taskId]))
    if (needsCode) tasks.push(pick('backend', '工程实现与状态收口', 'backend', brief, [tasks[0].taskId]))
    if (needsUi) tasks.push(pick('frontend', '前端体验与视觉推进', 'frontend', brief, [tasks[0].taskId]))
    if (needsDocs) tasks.push(pick('writer', '双语文档与业务文案收口', 'docs', brief, [tasks[0].taskId]))
    tasks.push(pick('qa', '质量验收与回归阻断', 'qa', brief, tasks.slice(1).map(task => task.taskId)))
    const protocol: CaptainTaskProtocol = {
      protocolId: randomUUID(),
      roomId,
      sourceMessageId,
      title: taskTier === 'quick' ? '快速任务路线图' : '长任务协同路线图',
      commanderRoleId: masterId,
      taskTier,
      status: 'running',
      tasks,
      dependencies: tasks.flatMap(task => task.dependsOn.map(dep => ({ fromTaskId: dep, toTaskId: task.taskId, reason: '主 Agent 编排依赖' }))),
      createdAt: now,
      updatedAt: now,
    }
    room.captainTaskProtocol = protocol
    room.pinnedGoal = brief.slice(0, 120)
    const taskBriefPreview = brief.length > 80 ? `${brief.slice(0, 80)}...` : brief
    const dateStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const stageTitle = room.workflow?.stages[room.workflow.currentStageIndex]?.name || '需求推进'
    const newScratchpadEntry = `\n\n### 📌 [${dateStr}] 当前任务目标：${taskBriefPreview}\n- 任务类型：${taskTier === 'quick' ? '快速任务' : '工作流长任务'}（阶段：${stageTitle}）\n- 编排路线：${tasks.map(t => `${t.ownerRoleId} (${t.title})`).join(' ➔ ')}\n- 状态：${taskTier === 'quick' ? '快速执行推进中' : '分工协同推进中'}`
    room.scratchpad = `${room.scratchpad || ''}${newScratchpadEntry}`
    this.saveRoom(room)
    this.broadcast({ type: 'scratchpad:updated', roomId, payload: { scratchpad: room.scratchpad }, timestamp: Date.now() })
    this.broadcast({ type: 'coordination:updated', roomId, payload: protocol, timestamp: Date.now() })
    return protocol
  }

  public recordCoordinationEvent(roomId: string, event: Omit<CoordinationEvent, 'eventId' | 'roomId' | 'createdAt'>): CoordinationEvent | undefined {
    const room = this.getRoom(roomId)
    if (!room) return undefined
    const envelope: CoordinationEvent = { eventId: randomUUID(), roomId, createdAt: Date.now(), ...event }
    room.coordinationEvents ||= []
    room.coordinationEvents.push(envelope)
    room.coordinationEvents = room.coordinationEvents.slice(-120)
    this.applyCoordinationToProtocol(room, envelope)
    this.saveRoom(room)
    this.broadcast({ type: 'coordination:updated', roomId, payload: envelope, timestamp: Date.now() })
    return envelope
  }

  private applyCoordinationToProtocol(room: GroupChatRoom, event: CoordinationEvent): void {
    const protocol = room.captainTaskProtocol
    if (!protocol) return
    const task = protocol.tasks.find(item => item.taskId === event.taskId || item.assignmentId === event.assignmentId || item.ownerRoleId === event.actorRoleId)
    if (!task) return
    if (event.type === 'claim' || event.type === 'resume') task.status = 'running'
    if (event.type === 'block') task.status = 'blocked'
    if (event.type === 'report') { task.latestReport = event.content; task.status = 'passed' }
    if (event.type === 'close') task.status = 'passed'
    if (event.type === 'handoff' && event.targetRoleId) { task.status = 'passed'; task.latestReport = `Handoff to @${event.targetRoleId}: ${event.content}` }
    task.updatedAt = Date.now()
    const passed = new Set(protocol.tasks.filter(item => item.status === 'passed').map(item => item.taskId))
    for (const item of protocol.tasks) {
      if (item.status === 'pending' && item.dependsOn.every(dep => passed.has(dep))) { item.status = 'ready'; item.updatedAt = Date.now() }
    }
    protocol.status = protocol.tasks.some(item => item.status === 'blocked') ? 'blocked' : protocol.tasks.every(item => item.status === 'passed') ? 'awaiting_approval' : 'running'
    protocol.updatedAt = Date.now()
  }

  public createApprovalTransaction(roomId: string, title: string, summary: string, willChange: string[], rollbackPlan: string[], createdByRoleId = 'commander'): ApprovalTransaction | undefined {
    const room = this.getRoom(roomId)
    if (!room) return undefined
    const now = Date.now()
    const tx: ApprovalTransaction = { transactionId: randomUUID(), roomId, title, summary, status: 'pending', willChange, rollbackPlan, createdByRoleId, createdAt: now, updatedAt: now }
    room.approvalTransactions ||= []
    room.approvalTransactions.push(tx)
    this.saveRoom(room)
    this.broadcast({ type: 'transaction:updated', roomId, payload: tx, timestamp: Date.now() })
    return tx
  }

  public resolveApprovalTransaction(roomId: string, transactionId: string, action: 'approve' | 'reject' | 'rollback', resolvedByRoleId = 'commander'): ApprovalTransaction | undefined {
    const room = this.getRoom(roomId)
    const tx = room?.approvalTransactions?.find(item => item.transactionId === transactionId)
    if (!room || !tx) return undefined
    tx.status = action === 'approve' ? 'approved' : action === 'rollback' ? 'rolled_back' : 'rejected'
    tx.resolvedByRoleId = resolvedByRoleId
    tx.resolvedAt = Date.now()
    tx.updatedAt = Date.now()
    this.saveRoom(room)
    this.broadcast({ type: 'transaction:updated', roomId, payload: tx, timestamp: Date.now() })
    return tx
  }


  public createAssignment(roomId: string, ownerRoleId: string, brief: string, options: { stageId?: string; workflowTaskId?: string; sourceMessageId?: string; createdByRoleId?: string; taskType?: AssignmentTaskType; taskTier?: GroupTaskTier; expectedMs?: number } = {}): AssignmentEnvelope | undefined {
    const room = this.getRoom(roomId)
    if (!room) return undefined
    const now = Date.now()
    const assignment: AssignmentEnvelope = {
      assignmentId: randomUUID(),
      roomId,
      ownerRoleId,
      createdByRoleId: options.createdByRoleId || room.orchestration?.masterAgentId || room.moderatorAgentId || 'commander',
      sourceMessageId: options.sourceMessageId,
      stageId: options.stageId,
      workflowTaskId: options.workflowTaskId,
      taskType: options.taskType || this.inferTaskType(ownerRoleId),
      taskTier: options.taskTier,
      expectedMs: options.expectedMs,
      brief,
      status: 'queued',
      createdAt: now,
      updatedAt: now,
    }
    room.assignments!.push(assignment)
    this.saveRoom(room)
    this.broadcast({ type: 'assignment:updated', roomId, payload: assignment, timestamp: Date.now() })
    return assignment
  }

  public markAssignmentRunning(roomId: string, assignmentId?: string): AssignmentEnvelope | undefined {
    if (!assignmentId) return undefined
    return this.updateAssignment(roomId, assignmentId, { status: 'running', startedAt: Date.now() })
  }

  public completeAssignment(roomId: string, assignmentId: string | undefined, resultMessageId: string, error?: string, runtimeTrace?: import('../types.js').DshRuntimeTrace): AssignmentEnvelope | undefined {
    if (!assignmentId) return undefined
    return this.updateAssignment(roomId, assignmentId, error ? { status: 'failed', error, finishedAt: Date.now(), resultMessageId, runtimeTrace } : { status: 'completed', finishedAt: Date.now(), resultMessageId, runtimeTrace })
  }

  public addMailboxMessage(roomId: string, message: Omit<AgentMailboxMessage, 'mailboxMessageId' | 'roomId' | 'createdAt'>): AgentMailboxMessage | undefined {
    const room = this.getRoom(roomId)
    if (!room) return undefined
    const envelope: AgentMailboxMessage = { mailboxMessageId: randomUUID(), roomId, createdAt: Date.now(), ...message }
    room.mailboxes![envelope.toRoleId] ||= []
    room.mailboxes![envelope.toRoleId].push(envelope)
    this.saveRoom(room)
    this.broadcast({ type: 'mailbox:new', roomId, payload: envelope, timestamp: Date.now() })
    return envelope
  }

  public getMailbox(roomId: string, roleId: string): AgentMailboxMessage[] {
    return this.getRoom(roomId)?.mailboxes?.[roleId] || []
  }

  public markMailboxRead(roomId: string, mailboxMessageId: string, readerRoleId?: string): AgentMailboxMessage | undefined {
    const room = this.getRoom(roomId)
    if (!room?.mailboxes) return undefined
    for (const [toRoleId, list] of Object.entries(room.mailboxes)) {
      const message = list.find(item => item.mailboxMessageId === mailboxMessageId)
      if (!message) continue
      if (readerRoleId && readerRoleId !== toRoleId && readerRoleId !== room.orchestration?.masterAgentId && readerRoleId !== room.moderatorAgentId) return undefined
      message.readAt = Date.now()
      this.saveRoom(room)
      this.broadcast({ type: 'mailbox:updated', roomId, payload: message, timestamp: Date.now() })
      return message
    }
    return undefined
  }

  private updateAssignment(roomId: string, assignmentId: string, updates: Partial<AssignmentEnvelope>): AssignmentEnvelope | undefined {
    const room = this.getRoom(roomId)
    const assignment = room?.assignments?.find(item => item.assignmentId === assignmentId)
    if (!room || !assignment) return undefined
    Object.assign(assignment, updates, { updatedAt: Date.now() })
    this.saveRoom(room)
    this.broadcast({ type: 'assignment:updated', roomId, payload: assignment, timestamp: Date.now() })
    return assignment
  }

  private inferTaskType(ownerRoleId: string): AssignmentTaskType {
    if (ownerRoleId === 'researcher') return 'research'
    if (ownerRoleId === 'backend') return 'backend'
    if (ownerRoleId === 'frontend') return 'frontend'
    if (ownerRoleId === 'qa') return 'qa'
    if (ownerRoleId === 'writer') return 'docs'
    if (ownerRoleId === 'commander') return 'review'
    return 'general'
  }

  /**
 * Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
 */
  public updateAgentProfile(
    roomId: string,
    agentId: string,
    updates: Partial<Pick<AgentProfile, 'name' | 'avatar' | 'title' | 'roleDescription' | 'systemPrompt' | 'llmConfig' | 'permissions' | 'resiliencePolicy'>>
  ): AgentProfile | undefined {
    const room = this.rooms.get(roomId)
    if (!room) return undefined

    const member = room.members.find(m => m.id === agentId)
    if (!member) return undefined

    if (updates.name !== undefined) {
      member.name = updates.name
      // Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
      if (!member.groupChatRules.mentionKeywords.includes(`@${updates.name}`)) {
        member.groupChatRules.mentionKeywords.push(`@${updates.name}`)
      }
    }
    if (updates.avatar !== undefined) member.avatar = updates.avatar
    if (updates.title !== undefined) member.title = updates.title
    if (updates.roleDescription !== undefined) member.roleDescription = updates.roleDescription
    if (updates.systemPrompt !== undefined) member.systemPrompt = updates.systemPrompt
    if (updates.llmConfig !== undefined) member.llmConfig = { ...member.llmConfig, ...updates.llmConfig }
    if (updates.resiliencePolicy !== undefined) member.resiliencePolicy = structuredClone(updates.resiliencePolicy)
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
 * Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
 */
  public subscribe(listener: (event: GroupChatEvent) => void): () => void {
    this.eventListeners.add(listener)
    return () => this.eventListeners.delete(listener)
  }

  /**
 * Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
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
 * Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
 */
  public saveRoom(room: GroupChatRoom): void {
    this.ensureOrchestrationPolicy(room)
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

  public restoreRuntimeState(roomId: string, messages: GroupMessageEnvelope[] = [], ledger?: RoomLedger): void {
    this.roomMessageLists.set(roomId, structuredClone(messages).slice(-200))
    if (ledger) this.roomLedgers.set(roomId, structuredClone(ledger))
    else if (!this.roomLedgers.has(roomId)) this.initLedger(roomId)
  }

  public settleInterruptedAssignments(roomId: string, reason = '插件重启中断：上一轮运行时任务未能恢复，请重新派发。'): number {
    const room = this.rooms.get(roomId)
    if (!room?.assignments?.length) return 0
    const now = Date.now()
    let count = 0
    for (const assignment of room.assignments) {
      if (assignment.status === 'queued' || assignment.status === 'running') {
        assignment.status = 'failed'
        assignment.error = reason
        assignment.finishedAt = now
        assignment.updatedAt = now
        assignment.resultMessageId = 'runtime-interrupted'
        count += 1
      }
    }
    if (count) this.saveRoom(room)
    return count
  }

  /**
 * Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
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
 * Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
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
 * Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
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

    // Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
    const room = this.getRoom(roomId)
    const silenceToken = room?.safetyPolicy?.silenceToken || 'NO_REPLY'
    if (DispatchArbiter.isSilenceToken(envelope.content, silenceToken)) {
      envelope.metadata.isSilent = true
    }

    const list = this.roomMessageLists.get(roomId) || []
    list.push(envelope)
    this.roomMessageLists.set(roomId, list)

    // Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
    if (envelope.sender.kind === 'agent') {
      const ledger = this.roomLedgers.get(roomId)
      if (ledger) {
        let consumed = envelope.metadata?.tokensConsumed
        if (!consumed || consumed.totalTokens === 0) {
          const runtimeMetrics = envelope.metadata?.runtimeMetrics
          if (runtimeMetrics && (runtimeMetrics.inputTokens > 0 || runtimeMetrics.outputTokens > 0 || runtimeMetrics.cacheReadTokens > 0 || runtimeMetrics.cacheWriteTokens > 0)) {
            const promptLen = runtimeMetrics.inputTokens + runtimeMetrics.cacheReadTokens + runtimeMetrics.cacheWriteTokens
            const outLen = runtimeMetrics.outputTokens
            consumed = {
              promptTokens: promptLen,
              completionTokens: outLen,
              totalTokens: promptLen + outLen,
            }
            if (envelope.metadata) {
              envelope.metadata.tokensConsumed = consumed
            }
          } else {
            consumed = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
          }
        }
        ledger.totalCalls += 1
        ledger.totalTokens += consumed.totalTokens

        if (!ledger.agentStats[envelope.sender.id]) {
          ledger.agentStats[envelope.sender.id] = {
            agentId: envelope.sender.id,
            agentName: envelope.sender.name,
            callCount: 0,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            metrics: {turnCount:0,stepCount:0,llmMs:0,toolMs:0,firstTokenMsTotal:0,firstTokenCount:0,inputTokens:0,outputTokens:0,cacheReadTokens:0,cacheWriteTokens:0},
            modelStats: {},
          }
        }
        const stat = ledger.agentStats[envelope.sender.id]
        stat.callCount += 1
        stat.promptTokens += consumed.promptTokens
        stat.completionTokens += consumed.completionTokens
        stat.totalTokens += consumed.totalTokens
        const runtimeMetrics = envelope.metadata?.runtimeMetrics || {
          turnCount: consumed.totalTokens > 0 ? 1 : 0, stepCount: 0, llmMs: 0, toolMs: 0, firstTokenMsTotal: 0, firstTokenCount: 0,
          inputTokens: consumed.promptTokens, outputTokens: consumed.completionTokens, cacheReadTokens: 0, cacheWriteTokens: 0
        }
        this.addRuntimeMetrics(ledger.metrics, runtimeMetrics)
        this.addRuntimeMetrics(stat.metrics, runtimeMetrics)
        const provider = envelope.metadata?.providerUsed || 'unknown'
        const model = envelope.metadata?.modelUsed || 'unknown'
        const modelKey = `${provider}/${model}`
        if (!stat.modelStats[modelKey]) stat.modelStats[modelKey] = {provider, model, callCount:0, promptTokens:0, completionTokens:0, totalTokens:0, metrics:{turnCount:0,stepCount:0,llmMs:0,toolMs:0,firstTokenMsTotal:0,firstTokenCount:0,inputTokens:0,outputTokens:0,cacheReadTokens:0,cacheWriteTokens:0}}
        const modelStat = stat.modelStats[modelKey]
        modelStat.callCount += 1
        modelStat.promptTokens += consumed.promptTokens
        modelStat.completionTokens += consumed.completionTokens
        modelStat.totalTokens += consumed.totalTokens
        this.addRuntimeMetrics(modelStat.metrics, runtimeMetrics)
      }
    }

    // Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
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
 * Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
 */
  public resetInteractionRound(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (room) {
      room.interactionRound = 0
      this.saveRoom(room)
    }
  }

  /**
 * Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
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
 * Room coordinator: roster, messages, workflow state, assignments, mailbox, ledger, persistence, and events.
 */

  public formatCommanderMailboxDigest(roomId: string, masterRoleId = 'commander'): string {
    const room = this.getRoom(roomId)
    if (!room) return '未找到对应群聊房间。'
    const inbox = room.mailboxes?.[masterRoleId] || []
    if (!inbox.length) return '主 Agent 收件箱摘要：暂无 SubAgent 回传。'
    const recent = inbox.slice(-12).reverse()
    const unread = recent.filter(item => !item.readAt).length
    const lines = [
      `### 主 Agent 收件箱摘要 / Commander Inbox Digest`,
      `- 收件角色: @${masterRoleId}`,
      `- 最近回传: ${recent.length} 条；未读: ${unread} 条`,
    ]
    for (const msg of recent) {
      const state = msg.readAt ? '已读' : '待读'
      const refs = msg.artifactRefs?.length ? `；证据: ${msg.artifactRefs.join(', ')}` : ''
      const text = msg.content.replace(/\s+/g, ' ').slice(0, 180)
      lines.push(`- [${state}] @${msg.fromRoleId}${msg.assignmentId ? ` · assignment=${msg.assignmentId}` : ''}: ${text}${refs}`)
    }
    return lines.join('\\n')
  }

  public exportMeetingSummary(roomId: string, locale: 'zh-CN' | 'en-US' = 'zh-CN'): string {
    const room = this.getRoom(roomId)
    const messages = this.getMessages(roomId)
    const en = locale === 'en-US'
    if (!room) return en ? 'Group chat room not found.' : '未找到对应群聊房间。'

    const lines: string[] = [
      en ? `# 📋 Group Chat Collaboration Summary: ${room.title}` : `# 📋 群聊协同讨论与成果纪要: ${room.title}`,
      en
        ? `> Exported at: ${new Date().toLocaleString()} | Theme: ${room.activeTheme} | Members: ${room.members.length}`
        : `> 导出时间: ${new Date().toLocaleString()} | 当前主题: ${room.activeTheme} | 成员数: ${room.members.length}`,
      '',
      en ? '## 1. Shared Scratchpad' : '## 一、核心共识 (Shared Scratchpad)',
      room.scratchpad || (en ? '(No shared scratchpad yet)' : '（暂无阶段性共识）'),
      '',
      en ? '## 2. Workflow Pipeline' : '## 二、工作流流转状态 (Workflow Pipeline)',
    ]

    if (room.workflow) {
      for (let i = 0; i < room.workflow.stages.length; i++) {
        const s = room.workflow.stages[i]
        const stateMark = s.status === 'completed' ? '✅' : s.status === 'in_progress' ? '🔄' : s.status === 'rejected' ? '❌' : '⏳'
        lines.push(en
          ? `- ${stateMark} **${s.name}** [status: ${s.status}] (owners: ${s.assignedRoleIds.join(', ')})`
          : `- ${stateMark} **${s.name}** [状态: ${s.status}] (责任人: ${s.assignedRoleIds.join(', ')})`)
        if (s.deliverableSummary) lines.push(en ? `  - Deliverable / notes: ${s.deliverableSummary}` : `  - 产物/意见: ${s.deliverableSummary}`)
      }
    }

    lines.push('', en ? '## 3. Agent Roster' : '## 三、参与智能体花名册 (Agent Roster)')
    for (const m of room.members) {
      const permTag = en ? `[permission: ${m.permissions.level}]` : `[权限: ${m.permissions.level}]`
      const name = en && m.nameEn ? m.nameEn : m.name
      const title = en && m.titleEn ? m.titleEn : (m.title || '')
      const desc = en && m.roleDescriptionEn ? m.roleDescriptionEn : m.roleDescription
      lines.push(`- **${name}** (\`@${m.id}\`${title ? `, ${title}` : ''}): ${desc} ${permTag}`)
    }

    if (room.assignments?.length) {
      lines.push('', en ? '## 4. Assignments & Mailbox' : '## 四、任务分派与邮箱 (Assignments & Mailbox)')
      for (const a of room.assignments.slice(-20)) {
        lines.push(`- [${a.status}] ${a.ownerRoleId} · ${a.taskType} · ${a.brief}${a.resultMessageId ? ` · result=${a.resultMessageId}` : ''}`)
      }
      const mailboxCount = Object.values(room.mailboxes || {}).reduce((sum, list) => sum + list.length, 0)
      lines.push(`- mailbox messages: ${mailboxCount}`)
      lines.push('', this.formatCommanderMailboxDigest(roomId, room.orchestration?.masterAgentId || room.moderatorAgentId || 'commander'))
    }

    lines.push('', en ? '## 5. Message Stream' : '## 五、讨论核心脉络 (Message Stream)')
    for (const msg of messages) {
      if (msg.metadata?.isSilent) continue
      const senderTag = msg.sender.kind === 'user' ? '👤 ' + msg.sender.name : '🤖 ' + msg.sender.name
      const timeStr = new Date(msg.timestamp).toLocaleTimeString()
      lines.push(`### [${timeStr}] ${senderTag}`)
      lines.push(msg.content, '')
    }

    const ledger = this.getLedger(roomId)
    if (ledger && ledger.totalCalls > 0) {
      lines.push(en ? '## 6. Token Ledger' : '## 六、资源消耗审计 (Token Ledger)')
      lines.push(en ? `- Total calls: ${ledger.totalCalls}` : `- 累计调用: ${ledger.totalCalls} 次`)
      lines.push(en ? `- Total tokens: ${ledger.totalTokens}` : `- 累计消耗: ${ledger.totalTokens} Tokens`)
      for (const [id, stat] of Object.entries(ledger.agentStats)) {
        lines.push(en ? `  - **${stat.agentName}**: ${stat.callCount} calls, ${stat.totalTokens} Tokens` : `  - **${stat.agentName}**: ${stat.callCount} 次调用，${stat.totalTokens} Tokens`)
      }
    }

    return lines.join('\n')
  }
}



/**
 * DSH Group Chat (多 Agent 角色协同与群聊插件) - 核心类型定义与契约
 */

export interface ModelRef {
  provider: 'deepseek' | 'pi-ai' | 'local' | string
  model: string
  temperature?: number
  reasoningEffort?: 'low' | 'medium' | 'high'
}

export interface ResiliencePolicy {
  /** 级联降级备选模型链 */
  fallbackModels: ModelRef[]
  /** 单模型最大重试次数 (500/超时) */
  maxRetriesPerModel: number
  /** 重试退避基数 (毫秒) */
  retryBackoffMs: number
  /** 超时阈值 (毫秒) */
  timeoutMs: number
}

/** 角色权限定义 */
export type RolePermissionLevel = 'admin' | 'read_write' | 'read_only' | 'audit_only'

export interface RolePermissions {
  /** 权限级别 */
  level: RolePermissionLevel
  /** 是否允许覆写共享黑板 */
  canWriteScratchpad: boolean
  /** 是否拥有工作流审批通过/驳回特权 (仅指挥官或管理员) */
  canApproveWorkflow: boolean
  /** 允许调用的外部工具白名单 */
  allowedTools: string[]
}

/** 主题映射库代号 */
export type PersonaThemeKey = 'modern' | 'three_kingdoms' | 'legends' | 'meme_comedy' | 'genshin' | `custom_${string}`

export interface RoleThemeMapping {
  roleKey: string
  name: string
  avatar: string
  color: string
  title: string
  catchphrase: string
}


export interface AgentOrchestrationStrategy {
  /** 主 Agent：负责理解用户、追问澄清、确认草案、派发与收口 */
  masterAgentId: string
  /** SubAgent：由主 Agent/工作流阶段唤醒的专业成员 */
  subAgentIds: string[]
  /** 策略说明：映射到 DSH 单主会话 + 多 agent/request 派发的插件编排层 */
  strategy: 'master_subagents'
}

export interface PendingAutoSetupDraft {
  id: string
  brief: string
  members: AgentProfile[]
  workflow: WorkflowDefinition
  orchestration: AgentOrchestrationStrategy
  createdAt: number
  status: 'awaiting_confirmation'
}

export interface GroupChatRules {
  /** 唤醒与匹配关键词列表 (如 ["@architect", "@架构师"]) */
  mentionKeywords: string[]
  /** 是否允许在回复中主动 @ 唤醒其他智能体 */
  canDelegateToOthers: boolean
  /** 专属工具白名单（为空则继承系统工具，非空则隔离外呼） */
  allowedTools?: string[]
}

export interface AgentProfile {
  /** 角色唯一 ID，如 "commander", "researcher", "backend", "frontend", "qa", "writer" */
  id: string
  /** 当前显示昵称 */
  name: string
  /** 当前头像 Emoji 或图片链接 */
  avatar: string
  /** 主题色值，用于前端气泡与徽章标识，如 "#3b82f6" */
  color?: string
  /** 头衔与标语 */
  title?: string
  /** 角色职责简介 */
  roleDescription: string
  /** 专属 Persona 系统提示词 */
  systemPrompt: string
  /** 绑定的 LLM 模型与 Provider */
  llmConfig: ModelRef
  /** 权限控制清单 */
  permissions: RolePermissions
  /** 容灾降级策略 */
  resiliencePolicy?: ResiliencePolicy
  /** 群聊行为守则 */
  groupChatRules: GroupChatRules
}

/** 发言调度模式 */
export type DispatchMode =
  | 'mention_only'     // 严格 @Mention 触发（默认推荐，最稳定且节俭）
  | 'moderator_led'    // 主持人/总指挥官编排模式（由 Commander Agent 调度下一发言人）
  | 'workflow_driven'  // 流程化工作流驱动模式（按阶段顺序/并行推进）
  | 'free_discussion'  // 自由争鸣模式（结合 Silence Token 自主决定是否发言）

export interface SafetyPolicy {
  /** 单次人类消息触发的最大互动轮数（默认 5 轮，防止死循环与费用失控） */
  maxTurnsPerPrompt: number
  /** 静默标记（默认 "NO_REPLY"，检测到后直接吞吐不广播） */
  silenceToken: string
  /** 是否允许 Bot 之间的 @ 自动触发下一步调用（默认 false） */
  enableBotToBotTrigger: boolean
  /** 429 限流冷却时间（毫秒，默认 30000） */
  cooldownPeriodMs: number
}

/** 工作流阶段状态 */
export type WorkflowStageStatus = 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'rejected'

export interface WorkflowStage {
  id: string
  name: string
  description: string
  assignedRoleIds: string[]
  status: WorkflowStageStatus
  /** 产物摘要或审查意见 */
  deliverableSummary?: string
  /** 是否必须总指挥官审批后方可流转下一阶段 */
  requiresApproval: boolean
  approvedBy?: string
  approvedAt?: number
}

export interface WorkflowDefinition {
  id: string
  title: string
  stages: WorkflowStage[]
  currentStageIndex: number
}

export interface GroupChatRoom {
  /** 房间唯一标识 */
  roomId: string
  /** 房间标题 */
  title: string
  /** 绑定的 DSH 主会话 ID */
  masterSessionId: string
  /** 当前发言调度模式 */
  dispatchMode: DispatchMode
  /** 主持人/指挥官角色 ID（默认 "commander"） */
  moderatorAgentId?: string
  /** 当前使用的主题映射方案 ('modern' | 'three_kingdoms' | 'legends') */
  activeTheme: PersonaThemeKey
  /** 群内成员画像清单 */
  members: AgentProfile[]
  /** 流程化工作流 */
  workflow?: WorkflowDefinition
  /** 主 Agent + SubAgent 编排策略 */
  orchestration?: AgentOrchestrationStrategy
  /** 中间对话触发的待确认角色/工作流草案，确认后才写入成员与工作流 */
  pendingAutoSetup?: PendingAutoSetupDraft
  /** 共享黑板内容（Shared Scratchpad Markdown） */
  scratchpad: string
  /** 当前置顶阶段目标 */
  pinnedGoal?: string
  /** 安全防死循环策略 */
  safetyPolicy: SafetyPolicy
  /** 当前人类指令触发的互动轮数计数器 */
  interactionRound: number
  /** 房间创建时间戳 */
  createdAt: number
  /** 最后更新时间戳 */
  updatedAt: number
}

export interface MessageSender {
  kind: 'user' | 'agent' | 'system'
  id: string
  name: string
  avatar: string
  color?: string
}

export interface GroupMessageEnvelope {
  messageId: string
  roomId: string
  sender: MessageSender
  content: string
  reasoningContent?: string
  mentions: string[]
  metadata: {
    modelUsed?: string
    providerUsed?: string
    stageId?: string
    tokensConsumed?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
    runtimeMetrics?: AgentRuntimeMetrics
    isSilent?: boolean
    isFallback?: boolean
    fallbackChain?: string[]
    systemNotice?: string
    autoSetup?: 'draft' | 'applied' | 'clarify' | 'cancelled'
  }
  timestamp: number
}

export interface AgentRuntimeMetrics {
  turnCount: number
  stepCount: number
  llmMs: number
  toolMs: number
  firstTokenMsTotal: number
  firstTokenCount: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

export interface AgentModelTokenStats {
  provider: string
  model: string
  callCount: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  metrics: AgentRuntimeMetrics
}

export interface AgentTokenStats {
  agentId: string
  agentName: string
  callCount: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  metrics: AgentRuntimeMetrics
  modelStats: Record<string, AgentModelTokenStats>
}


export interface RoomLedger {
  roomId: string
  totalCalls: number
  totalTokens: number
  metrics: AgentRuntimeMetrics
  agentStats: Record<string, AgentTokenStats>
}

export interface DispatchDecision {
  /** 下一个或下一批被选中的发言者角色 ID */
  nextSpeakerIds: string[]
  /** 仲裁原因与依据 */
  reason: string
  /** 当前使用的调度模式 */
  mode: DispatchMode
  /** 是否已达熔断或无需继续发言 */
  isTerminal: boolean
}

export interface ToolCacheEntry {
  hashKey: string
  toolName: string
  normalizedArgs: string
  result: unknown
  timestamp: number
  hits: number
}

/** 前后端事件总线协议 */
export type GroupChatEventType =
  | 'room:sync'
  | 'room:updated'
  | 'message:new'
  | 'message:chunk'
  | 'message:complete'
  | 'scratchpad:updated'
  | 'workflow:stage_changed'
  | 'circuit_breaker:tripped'
  | 'error:notice'
  | 'agent:status'

export interface GroupChatEvent {
  type: GroupChatEventType
  roomId: string
  payload: unknown
  timestamp: number
}

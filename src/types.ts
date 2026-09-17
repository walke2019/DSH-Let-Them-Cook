/**
 * Core public contract type field.
 */

export interface ModelRef {
  provider: 'deepseek' | 'pi-ai' | 'local' | string
  model: string
  temperature?: number
  reasoningEffort?: 'low' | 'medium' | 'high'
}

export interface ResiliencePolicy {
  /**
 * Core public contract type field.
 */
  fallbackModels: ModelRef[]
  /**
 * Core public contract type field.
 */
  maxRetriesPerModel: number
  /**
 * Core public contract type field.
 */
  retryBackoffMs: number
  /**
 * Core public contract type field.
 */
  timeoutMs: number
}

/**
 * Core public contract type field.
 */
export type RolePermissionLevel = 'admin' | 'read_write' | 'read_only' | 'audit_only'

export interface RolePermissions {
  /**
 * Core public contract type field.
 */
  level: RolePermissionLevel
  /**
 * Core public contract type field.
 */
  canWriteScratchpad: boolean
  /**
 * Core public contract type field.
 */
  canApproveWorkflow: boolean
  /**
 * Core public contract type field.
 */
  allowedTools: string[]
}

/**
 * Core public contract type field.
 */
export type PersonaThemeKey = 'modern' | 'three_kingdoms' | 'legends' | 'meme_comedy' | 'genshin' | `custom_${string}`

export interface RoleThemeMapping {
  roleKey: string
  name: string
  nameEn?: string
  avatar: string
  color: string
  title: string
  titleEn?: string
  catchphrase: string
  catchphraseEn?: string
}

export interface ThemeVoiceProfile {
  theme: PersonaThemeKey | 'default'
  emptyTitle: string
  emptySubtitle: string
  clarifyPrefix: string
  draftIntro: string
  draftActionHint: string
  appliedTitle: string
  appliedHint: string
  cancelledText: string
  idleStatusText: string
  runningText: string
  completeText: string
  errorText: string
}


export type ModelCapability = 'reasoning' | 'coding' | 'tool_use' | 'web_research' | 'data_extraction' | 'ui_design' | 'writing' | 'qa_audit' | 'long_context' | 'fast_reply' | 'low_cost'

export interface RoleModelHint {
  requiredCapabilities: ModelCapability[]
  preferredCapabilities?: ModelCapability[]
  costPreference: 'low' | 'balanced' | 'quality_first'
  latencyPreference: 'fast' | 'normal' | 'patient'
  fallbackStrategy: 'same_capability_cheaper' | 'host_default' | 'manual_only'
}

export interface ToolRoutingPolicy {
  webSearchOwner: string
  crawlOwner: string
  dataExtractionOwner: string
  backendCodeOwner: string
  frontendCodeOwner: string
  uiDebugOwner: string
  qaOwner: string
  docsOwner: string
  reducerOwner: string
  allowStageParallelism: boolean
  forbidDuplicateToolRace: boolean
}

export interface AgentOrchestrationStrategy {
  /**
 * Core public contract type field.
 */
  masterAgentId: string
  /**
 * Core public contract type field.
 */
  subAgentIds: string[]
  /**
 * Core public contract type field.
 */
  strategy: 'master_subagents'
  /**
 * Core public contract type field.
 */
  toolRoutingPolicy: ToolRoutingPolicy
  /**
 * Core public contract type field.
 */
  modelHints: Record<string, RoleModelHint>
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
  /**
 * Core public contract type field.
 */
  mentionKeywords: string[]
  /**
 * Core public contract type field.
 */
  canDelegateToOthers: boolean
}

export interface AgentProfile {
  /**
 * Core public contract type field.
 */
  id: string
  /**
 * Core public contract type field.
 */
  name: string
  nameEn?: string
  /**
 * Core public contract type field.
 */
  avatar: string
  /**
 * Core public contract type field.
 */
  color?: string
  /**
 * Core public contract type field.
 */
  title?: string
  titleEn?: string
  /**
 * Core public contract type field.
 */
  roleDescription: string
  roleDescriptionEn?: string
  /**
 * Core public contract type field.
 */
  systemPrompt: string
  /**
 * Core public contract type field.
 */
  llmConfig: ModelRef
  /**
 * Core public contract type field.
 */
  modelHint?: RoleModelHint
  /**
 * Core public contract type field.
 */
  permissions: RolePermissions
  /**
 * Core public contract type field.
 */
  resiliencePolicy?: ResiliencePolicy
  /**
 * Core public contract type field.
 */
  groupChatRules: GroupChatRules
}

/**
 * Core public contract type field.
 */
export type DispatchMode =
  | 'mention_only'     // Core public contract type field.
  | 'moderator_led'    // Core public contract type field.
  | 'workflow_driven'  // Core public contract type field.
  | 'free_discussion'  // Core public contract type field.

export interface SafetyPolicy {
  /**
 * Core public contract type field.
 */
  maxTurnsPerPrompt: number
  /**
 * Core public contract type field.
 */
  silenceToken: string
  /**
 * Core public contract type field.
 */
  enableBotToBotTrigger: boolean
  /**
 * Core public contract type field.
 */
  cooldownPeriodMs: number
}

/**
 * Core public contract type field.
 */
export type WorkflowStageStatus = 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'rejected'


export type WorkflowTaskStatus = 'pending' | 'ready' | 'running' | 'passed' | 'failed' | 'rejected' | 'request_human'

export interface WorkflowTaskQualityContract {
  acceptanceCriteria: string[]
  riskChecks?: string[]
  doneDefinition?: string
}

export interface WorkflowTaskVerification {
  command?: string
  output?: string
  exitCode?: number
  verifiedByRoleId?: string
  verifiedAt?: number
}

export interface WorkflowTask {
  taskId: string
  title: string
  description: string
  ownerRoleId: string
  dependsOn?: string[]
  status: WorkflowTaskStatus
  verifyCommand?: string
  qualityContract?: WorkflowTaskQualityContract
  verification?: WorkflowTaskVerification
  assignmentId?: string
  createdAt?: number
  updatedAt?: number
}

export interface WorkflowStage {
  id: string
  name: string
  description: string
  assignedRoleIds: string[]
  /**
 * Core public contract type field.
 */
  tasks?: WorkflowTask[]
  status: WorkflowStageStatus
  /**
 * Core public contract type field.
 */
  deliverableSummary?: string
  /**
 * Core public contract type field.
 */
  requiresApproval: boolean
  approvedBy?: string
  approvedAt?: number
}

export interface WorkflowDefinition {
  id: string
  title: string
  stages: WorkflowStage[]
  currentStageIndex: number
  isCompleted?: boolean
}


export type AssignmentStatus = 'queued' | 'running' | 'completed' | 'failed' | 'blocked' | 'cancelled'
export type GroupTaskTier = 'quick' | 'long'
export type AssignmentTaskType = 'research' | 'backend' | 'frontend' | 'qa' | 'docs' | 'review' | 'handoff' | 'general'


export interface CaptainTaskDependency {
  fromTaskId: string
  toTaskId: string
  reason: string
}

export interface CaptainTaskNode {
  taskId: string
  title: string
  ownerRoleId: string
  taskType: AssignmentTaskType
  status: WorkflowTaskStatus | 'blocked'
  dependsOn: string[]
  brief: string
  assignmentId?: string
  latestReport?: string
  createdAt: number
  updatedAt: number
}

export interface CaptainTaskProtocol {
  protocolId: string
  roomId: string
  sourceMessageId?: string
  title: string
  commanderRoleId: string
  taskTier: GroupTaskTier
  status: 'draft' | 'running' | 'awaiting_approval' | 'completed' | 'blocked'
  tasks: CaptainTaskNode[]
  dependencies: CaptainTaskDependency[]
  createdAt: number
  updatedAt: number
}

export interface CoordinationEvent {
  eventId: string
  roomId: string
  type: 'claim' | 'block' | 'handoff' | 'report' | 'close' | 'resume'
  actorRoleId: string
  targetRoleId?: string
  assignmentId?: string
  taskId?: string
  content: string
  createdAt: number
}

export interface ApprovalTransaction {
  transactionId: string
  roomId: string
  title: string
  summary: string
  status: 'pending' | 'approved' | 'rejected' | 'rolled_back'
  willChange: string[]
  rollbackPlan: string[]
  createdByRoleId: string
  createdAt: number
  updatedAt: number
  resolvedByRoleId?: string
  resolvedAt?: number
}

export interface DshRuntimeTrace {
  sourceSessionId?: string
  sourceEventSeqs?: number[]
  projectionSource?: 'dsh-session-projections' | 'event-stream-fallback'
  liveness?: {
    phase: string
    lastEventSeq?: number
    lastEventAt?: number
    openToolCallIds: string[]
    retryCount: number
    terminalReason?: string
  }
}

export interface AssignmentEnvelope {
  assignmentId: string
  roomId: string
  stageId?: string
  workflowTaskId?: string
  ownerRoleId: string
  createdByRoleId: string
  sourceMessageId?: string
  taskType: AssignmentTaskType
  taskTier?: GroupTaskTier
  expectedMs?: number
  brief: string
  status: AssignmentStatus
  resultMessageId?: string
  error?: string
  createdAt: number
  updatedAt: number
  startedAt?: number
  finishedAt?: number
  toolCalls?: ToolCallRecord[]
  runtimeTrace?: DshRuntimeTrace
}

export interface AgentMailboxMessage {
  mailboxMessageId: string
  roomId: string
  fromRoleId: string
  toRoleId: string
  assignmentId?: string
  content: string
  artifactRefs?: string[]
  createdAt: number
  readAt?: number
}

export interface UserDecisionOption {
  key: string
  label: string
  description?: string
  isRecommended?: boolean
}

export interface UserDecisionPrompt {
  header?: string
  question: string
  detail?: string
  options?: UserDecisionOption[]
  recommendedOptionKey?: string
  multiSelect?: boolean
  askedByRoleId: string
  askedAt: number
}

export interface GroupChatRoom {
  /**
 * Core public contract type field.
 */
  roomId: string
  /**
 * Core public contract type field.
 */
  title: string
  /**
 * Core public contract type field.
 */
  masterSessionId: string
  /**
 * Core public contract type field.
 */
  dispatchMode: DispatchMode
  /**
 * Core public contract type field.
 */
  moderatorAgentId?: string
  /**
 * Core public contract type field.
 */
  activeTheme: PersonaThemeKey
  /**
 * Core public contract type field.
 */
  members: AgentProfile[]
  /**
 * Core public contract type field.
 */
  workflow?: WorkflowDefinition
  /**
 * Core public contract type field.
 */
  assignments?: AssignmentEnvelope[]
  captainTaskProtocol?: CaptainTaskProtocol
  coordinationEvents?: CoordinationEvent[]
  approvalTransactions?: ApprovalTransaction[]
  /**
 * Core public contract type field.
 */
  mailboxes?: Record<string, AgentMailboxMessage[]>
  /**
 * Core public contract type field.
 */
  orchestration?: AgentOrchestrationStrategy
  /**
 * Core public contract type field.
 */
  pendingAutoSetup?: PendingAutoSetupDraft
  /**
 * Core public contract type field.
 */
  scratchpad: string
  /**
 * Core public contract type field.
 */
  pinnedGoal?: string
  /**
 * Core public contract type field.
 */
  safetyPolicy: SafetyPolicy
  awaitingUserDecision?: UserDecisionPrompt
  /**
 * Core public contract type field.
 */
  interactionRound: number
  /**
 * Core public contract type field.
 */
  createdAt: number
  /**
 * Core public contract type field.
 */
  updatedAt: number
}

export interface MessageSender {
  kind: 'user' | 'agent' | 'system'
  id: string
  name: string
  avatar: string
  color?: string
}



export interface ToolCallRecord {
  id: string
  name: string
  arguments: string
  result?: string
  status: 'pending' | 'running' | 'success' | 'error'
  durationMs?: number
  readWritePath?: string
}

export interface StructuredAgentResultMetadata {
  status: 'passed' | 'failed' | 'request_human'
  summary?: string
  next?: string
  evidence?: string[]
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
    taskTier?: GroupTaskTier
    locale?: 'zh-CN' | 'en-US'
    dispatchHint?: string
    autoSetup?: 'draft' | 'applied' | 'clarify' | 'cancelled'
    assignmentId?: string
    structuredResult?: StructuredAgentResultMetadata
    toolCalls?: ToolCallRecord[]
    runtimeTrace?: DshRuntimeTrace
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
  /**
 * Core public contract type field.
 */
  nextSpeakerIds: string[]
  /**
 * Core public contract type field.
 */
  reason: string
  /**
 * Core public contract type field.
 */
  mode: DispatchMode
  /**
 * Core public contract type field.
 */
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

/**
 * Core public contract type field.
 */
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
  | 'assignment:updated'
  | 'mailbox:new'
  | 'mailbox:updated'
  | 'coordination:updated'
  | 'transaction:updated'
  | 'room:cleared'

export interface GroupChatEvent {
  type: GroupChatEventType
  roomId: string
  payload: unknown
  timestamp: number
}

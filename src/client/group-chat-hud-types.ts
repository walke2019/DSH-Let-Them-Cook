export interface WorkflowTask {
  taskId: string
  title: string
  description: string
  ownerRoleId: string
  dependsOn?: string[]
  status: 'pending' | 'ready' | 'running' | 'passed' | 'failed' | 'rejected' | 'request_human'
  verifyCommand?: string
  qualityContract?: { acceptanceCriteria: string[]; riskChecks?: string[]; doneDefinition?: string }
  verification?: { command?: string; output?: string; exitCode?: number; verifiedByRoleId?: string; verifiedAt?: number }
  assignmentId?: string
}

export interface AssignmentEnvelope {
  assignmentId: string
  roomId: string
  stageId?: string
  workflowTaskId?: string
  ownerRoleId: string
  createdByRoleId: string
  taskType: string
  taskTier?: 'quick' | 'long'
  expectedMs?: number
  brief: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'blocked' | 'cancelled'
  resultMessageId?: string
  error?: string
  createdAt: number
  updatedAt: number
  toolCalls?: any[]
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

export interface StructuredAgentResult {
  status: 'passed' | 'failed' | 'request_human'
  summary?: string
  next?: string
  evidence?: string[]
}

export interface GroupMessageData {
  messageId: string
  metadata?: {
    assignmentId?: string
    structuredResult?: StructuredAgentResult
  }
}

export interface RuntimeMetrics {
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

export interface ModelLedgerData {
  provider: string
  model: string
  callCount: number
  totalTokens: number
  metrics: RuntimeMetrics
}

export interface CompatReport {
  ok: boolean
  version?: string
  features: Record<string, boolean>
  bridge?: {
    features: Record<string, boolean>
    sources: Record<string, string>
    warnings: string[]
    optimizations: string[]
  }
  sources?: Record<string, string>
  warnings: string[]
  optimizations: string[]
}

export interface LedgerData {
  totalCalls: number
  totalTokens: number
  metrics?: RuntimeMetrics
  agentStats: Record<string, {
    agentName: string
    callCount: number
    totalTokens: number
    metrics?: RuntimeMetrics
    modelStats?: Record<string, ModelLedgerData>
  }>
}


export interface CaptainTaskNode {
  taskId: string
  title: string
  ownerRoleId: string
  taskType: string
  status: string
  dependsOn: string[]
  brief: string
  assignmentId?: string
  latestReport?: string
  createdAt: number
  updatedAt: number
}

export interface ApprovalTransaction {
  transactionId: string
  title: string
  summary: string
  status: 'pending' | 'approved' | 'rejected' | 'rolled_back'
  willChange: string[]
  rollbackPlan: string[]
  createdByRoleId: string
}

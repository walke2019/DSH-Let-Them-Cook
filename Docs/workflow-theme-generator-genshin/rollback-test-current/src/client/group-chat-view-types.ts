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

export interface GroupMessage {
  messageId: string
  roomId: string
  sender: MessageSender
  content: string
  reasoningContent?: string
  mentions: string[]
  metadata: {
    modelUsed?: string
    providerUsed?: string
    tokensConsumed?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
    isSilent?: boolean
    stateMachine?: 'thinking' | 'tool_call' | 'tool_result' | 'writing' | 'completed' | 'awaiting_approval'
    toolCalls?: ToolCallRecord[]
  }
  timestamp: number
}

export interface AgentStatus {agentId:string;name:string;avatar:string;title?:string;status:'running'|'complete'|'error';message?:string;modelUsed?:string;providerUsed?:string;startedAt?:number;finishedAt?:number}

export interface AgentProfile {
  resiliencePolicy?: {fallbackModels:{provider:string;model:string}[];maxRetriesPerModel:number;retryBackoffMs:number;timeoutMs:number}
  id: string
  name: string
  avatar: string
  color?: string
  title?: string
  roleDescription: string
  systemPrompt?: string
  permissions: {
    level: string
    canWriteScratchpad: boolean
    canApproveWorkflow: boolean
  }
  llmConfig: {
    provider: string
    model: string
  }
}


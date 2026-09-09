import React, { useState, useEffect, useRef } from 'react'
import { GroupChatComposer } from './GroupChatComposer.js'

interface MessageSender {
  kind: 'user' | 'agent' | 'system'
  id: string
  name: string
  avatar: string
  color?: string
}

interface ToolCallRecord {
  id: string
  name: string
  arguments: string
  result?: string
  status: 'pending' | 'running' | 'success' | 'error'
  durationMs?: number
  readWritePath?: string
}

interface GroupMessage {
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

interface AgentProfile {
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

interface WorkflowStage {
  id: string
  name: string
  description: string
  assignedRoleIds: string[]
  status: 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'rejected'
  deliverableSummary?: string
  requiresApproval: boolean
  approvedBy?: string
}

interface RoomData {
  id: string
  name: string
  activeTheme: 'modern' | 'three_kingdoms' | 'legends'
  dispatchMode: 'mention_only' | 'moderator_led' | 'workflow_driven' | 'free_discussion'
  scratchpad: string
  workflow: {
    stages: WorkflowStage[]
    currentStageIndex: number
    isCompleted: boolean
  }
  members: AgentProfile[]
}

interface LedgerData {
  totalCalls: number
  totalTokens: number
  agentStats: Record<string, {
    agentName: string
    callCount: number
    totalTokens: number
  }>
}

export interface GroupChatPanelProps {
  mode?: 'dock' | 'full'
  onClose?: () => void
}

export function GroupChatPanel({ mode = 'full', onClose }: GroupChatPanelProps) {
  const [room, setRoom] = useState<RoomData | null>(null)
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [ledger, setLedger] = useState<LedgerData | null>(null)
  const [inputVal, setInputVal] = useState('')
  const [scratchpadDraft, setScratchpadDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({})
  const [showThinkingMap, setShowThinkingMap] = useState<Record<string, boolean>>({})
  const [showToolsMap, setShowToolsMap] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<'steps' | 'scratchpad' | 'roster'>('steps')

  // 角色编辑模态框状态
  const [editingAgent, setEditingAgent] = useState<AgentProfile | null>(null)
  const [agentForm, setAgentForm] = useState<{
    name: string
    avatar: string
    title: string
    roleDescription: string
    systemPrompt: string
    provider: string
    model: string
    canWriteScratchpad: boolean
    canApproveWorkflow: boolean
  }>({
    name: '',
    avatar: '',
    title: '',
    roleDescription: '',
    systemPrompt: '',
    provider: 'deepseek',
    model: 'deepseek-chat',
    canWriteScratchpad: false,
    canApproveWorkflow: false,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const stepsEndRef = useRef<HTMLDivElement>(null)

  // Visibility is owned by CSS and only while this view is mounted.
  useEffect(() => {
    if (mode !== 'full') return
    document.body.setAttribute('data-dsh-group-chat-active', 'true')
    return () => document.body.removeAttribute('data-dsh-group-chat-active')
  }, [mode])

  // 获取房间数据
  const fetchRoomData = async () => {
    try {
      const res = await fetch('/dsh-group-chat/api/room?id=dev-team-alpha')
      if (!res.ok) return
      const data = await res.json()
      if (data.room) {
        setRoom(data.room)
        setScratchpadDraft(data.room.scratchpad || '')
      }
      if (data.messages) setMessages(data.messages)
      if (data.ledger) setLedger(data.ledger)
    } catch (err) {
      console.error('[GroupChat] fetch error:', err)
    }
  }

  useEffect(() => {
    fetchRoomData()

    let es: EventSource | null = null
    try {
      es = new EventSource('/dsh-group-chat/api/events')
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'message:new') {
            setMessages(prev => {
              const next = [...prev, data.payload]
              setExpandedSteps(old => ({ ...old, [data.payload.messageId]: true }))
              return next
            })
            fetchRoomData()
          } else if (data.type === 'scratchpad:updated') {
            setScratchpadDraft(data.payload.scratchpad)
          } else if (data.type === 'room:updated') {
            setRoom(data.payload)
          } else if (data.type === 'stage:advanced' || data.type === 'stage:rejected') {
            setRoom(data.payload)
          }
        } catch {}
      }
    } catch {}

    return () => {
      if (es) es.close()
    }
  }, [])

  // 滚动到底部
  useEffect(() => {
    if (activeTab === 'steps') {
      stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeTab])

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputVal.trim() || isSending) return
    setIsSending(true)
    try {
      await fetch('/dsh-group-chat/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room?.id || 'dev-team-alpha',
          content: inputVal.trim(),
        }),
      })
      setInputVal('')
    } catch (err) {
      console.error('Send message failed:', err)
    } finally {
      setIsSending(false)
    }
  }

  // 切换主题
  const handleSwitchTheme = async (theme: 'modern' | 'three_kingdoms' | 'legends') => {
    try {
      const res = await fetch('/dsh-group-chat/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room?.id || 'dev-team-alpha',
          theme,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.room) setRoom(data.room)
      }
    } catch (err) {
      console.error('Theme switch failed:', err)
    }
  }

  // 打开角色编辑弹窗
  const openEditAgentModal = (agent: AgentProfile) => {
    setEditingAgent(agent)
    setAgentForm({
      name: agent.name,
      avatar: agent.avatar,
      title: agent.title || '',
      roleDescription: agent.roleDescription,
      systemPrompt: agent.systemPrompt || '',
      provider: agent.llmConfig?.provider || 'deepseek',
      model: agent.llmConfig?.model || 'deepseek-chat',
      canWriteScratchpad: agent.permissions?.canWriteScratchpad ?? false,
      canApproveWorkflow: agent.permissions?.canApproveWorkflow ?? false,
    })
  }

  // 处理本地头像上传
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result
      if (typeof result === 'string') {
        setAgentForm(prev => ({ ...prev, avatar: result }))
      }
    }
    reader.readAsDataURL(file)
  }

  // 保存角色编辑
  const handleSaveAgent = async () => {
    if (!editingAgent) return
    try {
      const res = await fetch('/dsh-group-chat/api/agent/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room?.id || 'dev-team-alpha',
          agentId: editingAgent.id,
          name: agentForm.name,
          avatar: agentForm.avatar,
          title: agentForm.title,
          roleDescription: agentForm.roleDescription,
          systemPrompt: agentForm.systemPrompt,
          llmConfig: {
            provider: agentForm.provider,
            model: agentForm.model,
          },
          permissions: {
            canWriteScratchpad: agentForm.canWriteScratchpad,
            canApproveWorkflow: agentForm.canApproveWorkflow,
          },
        }),
      })
      if (res.ok) {
        setEditingAgent(null)
        fetchRoomData()
      }
    } catch (err) {
      console.error('Save agent failed:', err)
    }
  }

  // 审批放行当前阶段
  const handleApproveStage = async () => {
    try {
      await fetch('/dsh-group-chat/api/workflow/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room?.id || 'dev-team-alpha',
          approverRoleId: 'commander',
          summary: '指挥官审查通过当前阶段交付成果，准予放行进入下一阶段',
        }),
      })
      fetchRoomData()
    } catch (err) {
      console.error('Approve failed:', err)
    }
  }

  // 驳回整改
  const handleRejectStage = async () => {
    const reason = prompt('请输入指挥官打回整改意见：', '交付物未满足验收标准，缺少边界异常处理')
    if (!reason) return
    try {
      await fetch('/dsh-group-chat/api/workflow/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room?.id || 'dev-team-alpha',
          reason,
        }),
      })
      fetchRoomData()
    } catch (err) {
      console.error('Reject failed:', err)
    }
  }

  const currentStage = room?.workflow?.stages[room.workflow.currentStageIndex]

  return (
    <div data-dsh-group-chat-panel style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      flex: '1 1 auto',
      width: '100%',
      backgroundColor: 'var(--dsw-alias-bg-base, #0d0d11)',
      color: 'var(--dsw-alias-label-primary, #f8fafc)',
      fontFamily: 'var(--dsw-font-family, system-ui, -apple-system, sans-serif)',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 隐藏的图片上传文件输入框 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* 顶部作战大厅控制栏 */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.08))',
        backgroundColor: 'var(--dsw-alias-bg-layer-1, #151518)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🎖️</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>{room?.name || '研发特遣阿尔法分队'}</span>
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: 'rgba(77, 107, 254, 0.15)',
                color: 'var(--dsw-alias-state-business-primary, #4d6bfe)',
                border: '1px solid rgba(77, 107, 254, 0.3)',
              }}>
                模式: {room?.dispatchMode}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', marginTop: '2px' }}>
              总指挥审核把控 · 全盘分工 · 角色流程化驱动 · 状态机推演
            </div>
          </div>
        </div>

        {/* 右侧主题切换与标签页切换 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 主题选择器 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)', padding: '2px 4px', borderRadius: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', paddingLeft: '4px' }}>主题:</span>
            {[
              { id: 'modern', label: '现代精英' },
              { id: 'three_kingdoms', label: '三国风云' },
              { id: 'legends', label: '现代传奇' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => handleSwitchTheme(t.id as any)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: room?.activeTheme === t.id ? 'var(--dsw-alias-state-business-primary, #4d6bfe)' : 'transparent',
                  color: room?.activeTheme === t.id ? '#fff' : 'var(--dsw-alias-label-secondary, #94a3b8)',
                  fontWeight: room?.activeTheme === t.id ? 600 : 400,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 选项卡 */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)', padding: '2px 4px', borderRadius: '6px' }}>
            {[
              { id: 'steps', label: '推演流 (State Machine)' },
              { id: 'scratchpad', label: '共享黑板' },
              { id: 'roster', label: '特遣花名册' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab.id ? 'var(--dsw-alias-bg-layer-3, #2a2a30)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--dsw-alias-label-primary, #fff)' : 'var(--dsw-alias-label-tertiary, #94a3b8)',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 工作流阶段横幅 (Workflow Stage Stepper) */}
      <div style={{
        padding: '8px 16px',
        backgroundColor: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
        borderBottom: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, overflowX: 'auto' }}>
          {room?.workflow?.stages.map((st, idx) => {
            const isCurrent = idx === room.workflow.currentStageIndex && !room.workflow.isCompleted
            const isDone = idx < room.workflow.currentStageIndex || room.workflow.isCompleted
            const isWaitingApproval = st.status === 'awaiting_approval'

            return (
              <div
                key={st.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isCurrent || isDone ? 1 : 0.45,
                  flexShrink: 0,
                }}
              >
                <span style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  backgroundColor: isDone ? '#10b981' : isCurrent ? '#4d6bfe' : '#475569',
                  color: '#fff',
                }}>
                  {isDone ? '✓' : idx + 1}
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: isCurrent ? 600 : 400,
                  color: isWaitingApproval ? '#eab308' : isCurrent ? '#60a5fa' : 'inherit',
                }}>
                  {st.name}
                </span>
                {idx < (room?.workflow?.stages.length || 0) - 1 && (
                  <span style={{ color: 'var(--dsw-alias-border-l2, rgba(255,255,255,0.2))', marginLeft: '6px' }}>➔</span>
                )}
              </div>
            )
          })}
        </div>

        {/* 指挥官审核把控快速动作条 */}
        {currentStage?.status === 'awaiting_approval' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '2px 10px',
            backgroundColor: 'rgba(234, 179, 8, 0.12)',
            borderRadius: '6px',
            border: '1px solid rgba(234, 179, 8, 0.3)',
          }}>
            <span style={{ fontSize: '11px', color: '#eab308' }}>⚠️ 当前阶段产物等待指挥官审查：</span>
            <button
              onClick={handleApproveStage}
              style={{
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              ✓ 审核放行
            </button>
            <button
              onClick={handleRejectStage}
              style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              ✕ 打回整改
            </button>
          </div>
        )}
      </div>

      {/* 主工作区 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', position: 'relative' }}>
        {/* A. 状态机推演流 (仿官方对话卡片 + 工具调用 + 思考状态机) */}
        {activeTab === 'steps' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '1000px', margin: '0 auto' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', padding: '60px 0', fontSize: '13px' }}>
                特遣队已集结就绪。请在下方指令台输入任务分工，或直接 @特定角色 发起协同推演！
              </div>
            ) : (
              messages.map((msg) => {
                const isExpanded = expandedSteps[msg.messageId] ?? true
                const hasThinking = Boolean(msg.reasoningContent)
                const isThinkingExpanded = showThinkingMap[msg.messageId] ?? false
                const hasTools = Boolean(msg.metadata?.toolCalls && msg.metadata.toolCalls.length > 0)
                const isToolsExpanded = showToolsMap[msg.messageId] ?? true
                const isUser = msg.sender.kind === 'user'

                return (
                  <div
                    key={msg.messageId}
                    style={{
                      borderRadius: '8px',
                      backgroundColor: isUser ? 'var(--dsw-alias-bg-layer-2, #1b1b1f)' : 'var(--dsw-alias-bg-layer-1, #151518)',
                      border: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.08))',
                      overflow: 'hidden',
                    }}
                  >
                    {/* 头部状态机标题条 (参考 DSH turnStatus 与 IoCard Header) */}
                    <div
                      onClick={() => setExpandedSteps(prev => ({ ...prev, [msg.messageId]: !isExpanded }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        backgroundColor: isUser ? 'rgba(77, 107, 254, 0.05)' : 'transparent',
                        borderBottom: isExpanded ? '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))' : 'none',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: msg.sender.color || 'var(--dsw-alias-state-business-primary, #4d6bfe)',
                          overflow: 'hidden',
                          fontSize: '13px',
                        }}>
                          {msg.sender.avatar.startsWith('data:') ? (
                            <img src={msg.sender.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            msg.sender.avatar
                          )}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--dsw-alias-label-primary, #f8fafc)' }}>
                          {msg.sender.name}
                        </span>

                        {/* 状态机徽章：如 [思考完成] [执行工具: web_search] [总指挥审查] */}
                        {msg.metadata?.stateMachine && (
                          <span style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(77, 107, 254, 0.12)',
                            color: '#60a5fa',
                            fontFamily: 'monospace',
                          }}>
                            ⚙️ {msg.metadata.stateMachine}
                          </span>
                        )}

                        {hasTools && (
                          <span style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            fontFamily: 'monospace',
                          }}>
                            🛠️ {msg.metadata.toolCalls?.length} 个工具调用
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--dsw-alias-label-caption, #64748b)' }}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)' }}>
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>

                    {/* 展开后的主体内容：包含思考链、工具执行细节与最终产物 */}
                    {isExpanded && (
                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* 1. 思考状态机展示 (Thinking Chain) */}
                        {hasThinking && (
                          <div style={{
                            borderRadius: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))',
                            overflow: 'hidden',
                          }}>
                            <div
                              onClick={() => setShowThinkingMap(p => ({ ...p, [msg.messageId]: !isThinkingExpanded }))}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                color: 'var(--dsw-alias-label-tertiary, #94a3b8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                background: 'rgba(255,255,255,0.03)',
                              }}
                            >
                              <span>🧠 思考过程与逻辑规划 (Thinking Chain)</span>
                              <span>{isThinkingExpanded ? '收起' : '展开'}</span>
                            </div>
                            {isThinkingExpanded && (
                              <div style={{
                                padding: '8px 10px',
                                fontSize: '12px',
                                color: 'var(--dsw-alias-label-secondary, #cbd5e1)',
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'monospace',
                                lineHeight: '1.5',
                              }}>
                                {msg.reasoningContent}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. 工具调用状态机与读写执行过程 (参考 DSH IoCard) */}
                        {hasTools && (
                          <div style={{
                            borderRadius: '6px',
                            backgroundColor: 'var(--dsw-alias-markdown-code-block, #121215)',
                            border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.1))',
                            overflow: 'hidden',
                          }}>
                            <div
                              onClick={() => setShowToolsMap(p => ({ ...p, [msg.messageId]: !isToolsExpanded }))}
                              style={{
                                padding: '6px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                borderBottom: isToolsExpanded ? '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))' : 'none',
                              }}
                            >
                              <span>🛠️ 工具调用与读写执行详情 (Tool Execution Inspector)</span>
                              <span>{isToolsExpanded ? '▲' : '▼'}</span>
                            </div>

                            {isToolsExpanded && (
                              <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {msg.metadata.toolCalls?.map((tc, tcIdx) => (
                                  <div
                                    key={tc.id || tcIdx}
                                    style={{
                                      padding: '6px 8px',
                                      borderRadius: '4px',
                                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                      border: '1px solid rgba(255, 255, 255, 0.06)',
                                      fontSize: '11px',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                      <span style={{ fontWeight: 600, color: '#60a5fa', fontFamily: 'monospace' }}>
                                        $ {tc.name}
                                      </span>
                                      <span style={{ color: tc.status === 'success' ? '#10b981' : '#f59e0b', fontSize: '10px' }}>
                                        {tc.status === 'success' ? '✓ 执行完成' : '执行中...'}
                                        {tc.durationMs ? ` (${tc.durationMs}ms)` : ''}
                                      </span>
                                    </div>

                                    {tc.readWritePath && (
                                      <div style={{ color: 'var(--dsw-alias-label-tertiary, #94a3b8)', fontSize: '10px', marginBottom: '4px' }}>
                                        📁 目标路径: <code>{tc.readWritePath}</code>
                                      </div>
                                    )}

                                    <div style={{ color: 'var(--dsw-alias-label-secondary, #cbd5e1)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '11px' }}>
                                      <span style={{ color: '#64748b' }}>入参: </span>{tc.arguments}
                                    </div>

                                    {tc.result && (
                                      <div style={{
                                        marginTop: '4px',
                                        padding: '4px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                        color: '#a7f3d0',
                                        fontFamily: 'monospace',
                                        fontSize: '11px',
                                        whiteSpace: 'pre-wrap',
                                        maxHeight: '120px',
                                        overflowY: 'auto',
                                      }}>
                                        <span style={{ color: '#64748b' }}>返回: </span>{tc.result}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. Agent 交付正文内容 */}
                        <div style={{
                          fontSize: '13px',
                          lineHeight: '1.6',
                          color: 'var(--dsw-alias-label-primary, #f8fafc)',
                          whiteSpace: 'pre-wrap',
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
            <div ref={stepsEndRef} />
          </div>
        )}

        {/* B. 共享黑板 (Shared Scratchpad) */}
        {activeTab === 'scratchpad' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>团队共享黑板 (Shared Scratchpad)</span>
                <span style={{ fontSize: '11px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', marginLeft: '10px' }}>
                  仅限总指挥官与文档写手具备写权限，沉淀全盘共识与架构定式
                </span>
              </div>
              <button
                onClick={async () => {
                  await fetch('/dsh-group-chat/api/scratchpad', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      roomId: room?.id || 'dev-team-alpha',
                      scratchpad: scratchpadDraft,
                      operatorRoleId: 'commander',
                    }),
                  })
                  alert('共享黑板保存成功！')
                }}
                style={{
                  backgroundColor: 'var(--dsw-alias-state-business-primary, #4d6bfe)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                保存备忘录
              </button>
            </div>
            <textarea
              value={scratchpadDraft}
              onChange={e => setScratchpadDraft(e.target.value)}
              style={{
                flex: 1,
                minHeight: '400px',
                width: '100%',
                backgroundColor: 'var(--dsw-alias-bg-layer-1, #151518)',
                border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.1))',
                borderRadius: '8px',
                color: 'var(--dsw-alias-label-primary, #f8fafc)',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '12px',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* C. 特遣花名册与角色编辑定义 */}
        {activeTab === 'roster' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>特遣队成员花名册与权限矩阵</span>
                <div style={{ fontSize: '11px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', marginTop: '2px' }}>
                  点击任意角色卡片中的【✏️ 编辑角色】或头像，可自定义名称、上传自定义头像图片、修改系统设定及模型配置
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
              {room?.members.map(member => (
                <div
                  key={member.id}
                  style={{
                    backgroundColor: 'var(--dsw-alias-bg-layer-1, #151518)',
                    border: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.08))',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          onClick={() => openEditAgentModal(member)}
                          title="点击更换头像图片"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: member.color || '#4d6bfe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            fontSize: '18px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          }}
                        >
                          {member.avatar.startsWith('data:') ? (
                            <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            member.avatar
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{member.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)' }}>
                            {member.title || member.id}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => openEditAgentModal(member)}
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.12))',
                          borderRadius: '4px',
                          color: 'var(--dsw-alias-label-secondary, #cbd5e1)',
                          padding: '3px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ 编辑角色
                      </button>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--dsw-alias-label-secondary, #cbd5e1)', marginTop: '8px', lineHeight: '1.4' }}>
                      {member.roleDescription}
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--dsw-alias-label-caption, #64748b)' }}>
                    <span>模型: {member.llmConfig?.model || 'deepseek-chat'}</span>
                    <span>黑板权限: {member.permissions?.canWriteScratchpad ? '✓ 允许' : '✕ 只读'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <GroupChatComposer members={room?.members ?? []} value={inputVal}
        onChange={setInputVal} onSend={handleSendMessage} sending={isSending} />

      {/* 角色编辑与头像图片上传弹窗 */}
      {editingAgent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            width: '520px',
            backgroundColor: 'var(--dsw-alias-bg-layer-1, #151518)',
            border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.12))',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'var(--dsw-shadow-lv3, 0 12px 32px rgba(0,0,0,0.5))',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>编辑特遣角色属性 ({editingAgent.id})</span>
              <button
                onClick={() => setEditingAgent(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* 头像修改与图片上传 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                title="点击上传本地头像图片"
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: editingAgent.color || '#4d6bfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  fontSize: '24px',
                  border: '2px dashed rgba(255,255,255,0.3)',
                }}
              >
                {agentForm.avatar.startsWith('data:') ? (
                  <img src={agentForm.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  agentForm.avatar
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    backgroundColor: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
                    border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.12))',
                    color: 'var(--dsw-alias-label-primary, #fff)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  📁 上传本地头像图片
                </button>
                <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', marginTop: '4px' }}>
                  支持 PNG、JPG、WebP 格式，将自动保存为角色自定义头像
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--dsw-alias-label-secondary, #cbd5e1)' }}>角色显示姓名</label>
                <input
                  type="text"
                  value={agentForm.name}
                  onChange={e => setAgentForm({ ...agentForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: 'var(--dsw-alias-bg-base, #0d0d11)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '12px',
                    marginTop: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--dsw-alias-label-secondary, #cbd5e1)' }}>角色头衔/职称</label>
                <input
                  type="text"
                  value={agentForm.title}
                  onChange={e => setAgentForm({ ...agentForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: 'var(--dsw-alias-bg-base, #0d0d11)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '12px',
                    marginTop: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--dsw-alias-label-secondary, #cbd5e1)' }}>专长职责描述</label>
              <textarea
                value={agentForm.roleDescription}
                onChange={e => setAgentForm({ ...agentForm, roleDescription: e.target.value })}
                style={{
                  width: '100%',
                  height: '50px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: 'var(--dsw-alias-bg-base, #0d0d11)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '11px',
                  marginTop: '4px',
                  resize: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--dsw-alias-label-secondary, #cbd5e1)' }}>角色系统设定提示词 (System Prompt)</label>
              <textarea
                value={agentForm.systemPrompt}
                onChange={e => setAgentForm({ ...agentForm, systemPrompt: e.target.value })}
                style={{
                  width: '100%',
                  height: '80px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: 'var(--dsw-alias-bg-base, #0d0d11)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '11px',
                  marginTop: '4px',
                  resize: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 权限设定 */}
            <div style={{ display: 'flex', gap: '20px', padding: '6px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={agentForm.canWriteScratchpad}
                  onChange={e => setAgentForm({ ...agentForm, canWriteScratchpad: e.target.checked })}
                />
                <span>允许编辑共享黑板 (Write Scratchpad)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={agentForm.canApproveWorkflow}
                  onChange={e => setAgentForm({ ...agentForm, canApproveWorkflow: e.target.checked })}
                />
                <span>具备工作流审核审批特权 (Approve Workflow)</span>
              </label>
            </div>

            {/* 底部按钮 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setEditingAgent(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveAgent}
                style={{
                  backgroundColor: 'var(--dsw-alias-state-business-primary, #4d6bfe)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

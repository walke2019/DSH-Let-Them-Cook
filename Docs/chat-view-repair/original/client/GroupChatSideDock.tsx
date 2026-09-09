import React, { useState, useEffect } from 'react'
import { updateLayoutPushWidth } from './layout-push.js'

const SIDEBAR_DEFAULT_WIDTH = 380

interface RoomData {
  id: string
  name: string
  activeTheme: 'modern' | 'three_kingdoms' | 'legends'
  dispatchMode: 'mention_only' | 'moderator_led' | 'workflow_driven' | 'free_discussion'
  scratchpad: string
  workflow: {
    stages: Array<{
      id: string
      name: string
      description: string
      assignedRoleIds: string[]
      status: 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'rejected'
      deliverableSummary?: string
      requiresApproval: boolean
    }>
    currentStageIndex: number
    isCompleted: boolean
  }
  members: Array<{
    id: string
    name: string
    avatar: string
    color?: string
    title?: string
    roleDescription: string
    permissions: {
      canWriteScratchpad: boolean
      canApproveWorkflow: boolean
    }
  }>
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

/**
 * 侧边栏辅助副屏 (Companion HUD)
 * 定位：区别于全屏主推演区，侧栏仅提供轻量、高密度的【拓扑监控 + 共享黑板 + 成员账本 + 快速指令】，绝不产生功能重叠！
 */
export function GroupChatSideDock() {
  const [isOpen, setIsOpen] = useState(false)
  const [room, setRoom] = useState<RoomData | null>(null)
  const [ledger, setLedger] = useState<LedgerData | null>(null)
  const [scratchpadDraft, setScratchpadDraft] = useState('')
  const [isEditingScratchpad, setIsEditingScratchpad] = useState(false)
  const [quickCmd, setQuickCmd] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [activeTab, setActiveTab] = useState<'workflow' | 'scratchpad' | 'roster'>('workflow')

  const fetchRoomData = async () => {
    try {
      const res = await fetch('/dsh-group-chat/api/room?id=dev-team-alpha')
      if (!res.ok) return
      const data = await res.json()
      if (data.room) {
        setRoom(data.room)
        setScratchpadDraft(data.room.scratchpad || '')
      }
      if (data.ledger) setLedger(data.ledger)
    } catch (err) {
      console.error('[GroupChatDock] fetch error:', err)
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
          if (data.type === 'room:updated' || data.type === 'stage:advanced' || data.type === 'stage:rejected') {
            setRoom(data.payload)
          } else if (data.type === 'scratchpad:updated') {
            setScratchpadDraft(data.payload.scratchpad)
          } else if (data.type === 'message:new') {
            fetchRoomData()
          }
        } catch {}
      }
    } catch {}

    return () => {
      if (es) es.close()
    }
  }, [])

  // 监听打开/收起状态，推挤 DSH 页面
  useEffect(() => {
    if (isOpen) {
      updateLayoutPushWidth(SIDEBAR_DEFAULT_WIDTH)
    } else {
      updateLayoutPushWidth(0)
    }
  }, [isOpen])

  // Esc 收起
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen])

  // 快速广播指令
  const handleQuickSend = async () => {
    if (!quickCmd.trim() || isSending) return
    setIsSending(true)
    try {
      await fetch('/dsh-group-chat/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room?.id || 'dev-team-alpha',
          content: quickCmd.trim(),
        }),
      })
      setQuickCmd('')
    } catch (err) {
      console.error('Send error:', err)
    } finally {
      setIsSending(false)
    }
  }

  // 保存共享黑板
  const handleSaveScratchpad = async () => {
    try {
      await fetch('/dsh-group-chat/api/scratchpad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room?.id || 'dev-team-alpha',
          scratchpad: scratchpadDraft,
          operatorRoleId: 'commander',
        }),
      })
      setIsEditingScratchpad(false)
    } catch (err) {
      console.error('Save scratchpad error:', err)
    }
  }

  // 审批放行
  const handleApproveStage = async () => {
    try {
      await fetch('/dsh-group-chat/api/workflow/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room?.id || 'dev-team-alpha',
          approverRoleId: 'commander',
          summary: '指挥官审核通过，批准进入下一阶段',
        }),
      })
      fetchRoomData()
    } catch (err) {
      console.error('Approve error:', err)
    }
  }

  return (
    <>
      {/* 1. 贴边收起把手 */}
      {!isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          title="展开特遣协同副屏 (实时监控 HUD)"
          style={{
            position: 'fixed',
            top: '72px',
            right: '0px',
            zIndex: 49,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            backgroundColor: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
            border: '1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12))',
            borderRight: 'none',
            borderTopLeftRadius: '16px',
            borderBottomLeftRadius: '16px',
            boxShadow: 'var(--dsw-shadow-lv2, 0 4px 12px rgba(0,0,0,0.3))',
            cursor: 'pointer',
            userSelect: 'none',
            color: 'var(--dsw-alias-label-primary, #f8fafc)',
            fontSize: '11px',
            fontWeight: 500,
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
        >
          <span style={{ fontSize: '13px' }}>🧭</span>
          <span>特遣副屏</span>
          {room?.workflow && !room.workflow.isCompleted && (
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--dsw-alias-state-business-primary, #4d6bfe)',
            }} />
          )}
        </div>
      )}

      {/* 2. 侧栏副屏容器 (Layout-Push 推挤宿主) */}
      <div
        className="dsh-gc-sidebar-host"
        data-collapsed={!isOpen}
        style={{
          pointerEvents: isOpen ? 'auto' : 'none',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--dsw-alias-bg-layer-1, #151518)',
        }}
      >
        {/* 副屏头部 */}
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🧭</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dsw-alias-label-primary, #f8fafc)' }}>
                特遣监控室 (HUD)
              </div>
              <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)' }}>
                {room?.name || '研发特遣阿尔法分队'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--dsw-alias-label-secondary, #94a3b8)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '4px',
              borderRadius: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* 导航微标签 */}
        <div style={{
          display: 'flex',
          padding: '6px 12px',
          gap: '6px',
          background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
          borderBottom: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.06))',
        }}>
          {[
            { id: 'workflow', label: '工作流拓扑' },
            { id: 'scratchpad', label: '共享黑板' },
            { id: 'roster', label: '特遣账本' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                padding: '4px 6px',
                fontSize: '11px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab.id ? 'var(--dsw-alias-bg-layer-3, #2a2a30)' : 'transparent',
                color: activeTab === tab.id ? 'var(--dsw-alias-label-primary, #fff)' : 'var(--dsw-alias-label-tertiary, #94a3b8)',
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 副屏内容区 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', fontSize: '12px' }}>
          {/* A. 工作流实时拓扑 */}
          {activeTab === 'workflow' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--dsw-alias-label-secondary, #94a3b8)',
                marginBottom: '4px',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>阶段流程（共 {room?.workflow?.stages?.length || 0} 步）</span>
                <span style={{ color: 'var(--dsw-alias-state-business-primary, #4d6bfe)' }}>
                  {room?.workflow?.isCompleted ? '已全部验收完成 ✓' : `进行中: 第 ${(room?.workflow?.currentStageIndex || 0) + 1} 步`}
                </span>
              </div>

              {room?.workflow?.stages.map((st, idx) => {
                const isCurrent = idx === room.workflow.currentStageIndex && !room.workflow.isCompleted
                const isPast = idx < room.workflow.currentStageIndex || room.workflow.isCompleted
                const isWaitingApproval = st.status === 'awaiting_approval'

                return (
                  <div
                    key={st.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: isCurrent
                        ? 'rgba(77, 107, 254, 0.08)'
                        : 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
                      border: isCurrent
                        ? '1px solid var(--dsw-alias-state-business-primary, #4d6bfe)'
                        : '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: isPast ? '#10b981' : isCurrent ? '#4d6bfe' : '#475569',
                          color: '#fff',
                        }}>
                          {isPast ? '✓' : idx + 1}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--dsw-alias-label-primary, #f8fafc)' }}>
                          {st.name}
                        </span>
                      </div>

                      <span style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        backgroundColor: isWaitingApproval
                          ? 'rgba(234, 179, 8, 0.15)'
                          : isCurrent
                          ? 'rgba(77, 107, 254, 0.15)'
                          : 'transparent',
                        color: isWaitingApproval
                          ? '#eab308'
                          : isCurrent
                          ? '#60a5fa'
                          : 'var(--dsw-alias-label-caption, #64748b)',
                      }}>
                        {st.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', marginTop: '4px' }}>
                      {st.description}
                    </div>

                    {/* 待指挥官审批门控提示 */}
                    {isWaitingApproval && (
                      <div style={{
                        marginTop: '8px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: 'rgba(234, 179, 8, 0.1)',
                        border: '1px dashed rgba(234, 179, 8, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <span style={{ color: '#eab308', fontSize: '11px' }}>⚠️ 产物就绪，等待指挥官放行</span>
                        <button
                          onClick={handleApproveStage}
                          style={{
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          批准放行
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* B. 共享黑板 */}
          {activeTab === 'scratchpad' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--dsw-alias-label-secondary, #94a3b8)', fontSize: '11px' }}>
                  团队共识备忘录 (Markdown)
                </span>
                {!isEditingScratchpad ? (
                  <button
                    onClick={() => setIsEditingScratchpad(true)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.1))',
                      color: 'var(--dsw-alias-label-primary, #fff)',
                      fontSize: '10px',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      cursor: 'pointer',
                    }}
                  >
                    ✏️ 编辑
                  </button>
                ) : (
                  <button
                    onClick={handleSaveScratchpad}
                    style={{
                      backgroundColor: 'var(--dsw-alias-state-business-primary, #4d6bfe)',
                      color: '#fff',
                      border: 'none',
                      fontSize: '10px',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    保存
                  </button>
                )}
              </div>

              {isEditingScratchpad ? (
                <textarea
                  value={scratchpadDraft}
                  onChange={e => setScratchpadDraft(e.target.value)}
                  style={{
                    flex: 1,
                    minHeight: '260px',
                    width: '100%',
                    background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
                    border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.1))',
                    borderRadius: '8px',
                    color: 'var(--dsw-alias-label-primary, #f8fafc)',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    padding: '8px',
                    resize: 'none',
                  }}
                />
              ) : (
                <div style={{
                  flex: 1,
                  minHeight: '260px',
                  background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
                  border: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))',
                  borderRadius: '8px',
                  padding: '10px',
                  color: 'var(--dsw-alias-label-primary, #f8fafc)',
                  whiteSpace: 'pre-wrap',
                  overflowY: 'auto',
                  lineHeight: '1.5',
                }}>
                  {scratchpadDraft || '（暂无黑板内容，指挥官与文案写手可随时写入技术决策）'}
                </div>
              )}
            </div>
          )}

          {/* C. 特遣账本与成员花名册 */}
          {activeTab === 'roster' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-caption, #64748b)' }}>总交互调用</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dsw-alias-label-primary, #fff)' }}>
                    {ledger?.totalCalls || 0} 次
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-caption, #64748b)' }}>总消耗 Token</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
                    {ledger?.totalTokens || 0}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--dsw-alias-label-secondary, #94a3b8)', marginTop: '4px' }}>
                成员列表（{room?.members.length || 0} 人）
              </div>

              {room?.members.map(member => {
                const stat = ledger?.agentStats[member.id]
                return (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{member.avatar}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--dsw-alias-label-primary, #f8fafc)', fontSize: '11px' }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-caption, #64748b)' }}>
                          {member.title || member.id}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)' }}>
                      <div>{stat?.callCount || 0} 轮</div>
                      <div>{stat?.totalTokens || 0} T</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 副屏底部：快捷广播指令 */}
        <div style={{
          padding: '10px',
          borderTop: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.08))',
          background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
          display: 'flex',
          gap: '6px',
        }}>
          <input
            type="text"
            placeholder="下达快捷指令 (如 @孔明 查下竞品)..."
            value={quickCmd}
            onChange={e => setQuickCmd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuickSend()}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.12))',
              background: 'var(--dsw-alias-bg-layer-1, #151518)',
              color: 'var(--dsw-alias-label-primary, #f8fafc)',
              fontSize: '11px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleQuickSend}
            disabled={isSending || !quickCmd.trim()}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--dsw-alias-state-business-primary, #4d6bfe)',
              color: '#fff',
              fontSize: '11px',
              cursor: isSending || !quickCmd.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            派发
          </button>
        </div>
      </div>
    </>
  )
}

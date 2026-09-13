import React, { useState, useEffect, useRef } from 'react'
import { GroupChatLocale, tx } from './i18n.js'
import { setCurrentGroupChatRoomId } from './current-room.js'
import type { AssignmentEnvelope } from './types.js'

interface WarRoomItem {
  roomId: string
  title?: string
  pinnedGoal?: string
  assignments?: AssignmentEnvelope[]
  messagesCount?: number
  workflow?: {
    currentStageIndex: number
    stages: Array<{ id: string; name: string; status: string }>
  }
}

export interface GroupChatCockpitModalProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
  locale: GroupChatLocale
  room?: any
}

export function GroupChatCockpitModal({
  isOpen,
  onClose,
  roomId,
  locale,
  room,
}: GroupChatCockpitModalProps) {
  const [availableRooms, setAvailableRooms] = useState<WarRoomItem[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [archivedRoomIds, setArchivedRoomIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dsh-group-chat:archived-room-ids') || '[]')
    } catch {
      return []
    }
  })
  const modalRef = useRef<HTMLDivElement>(null)

  const fetchRooms = async () => {
    setLoadingRooms(true)
    try {
      const res = await fetch('/dsh-group-chat/api/rooms')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.rooms)) {
          const sorted = [...data.rooms].sort((a: WarRoomItem, b: WarRoomItem) => {
            const aTasks = a.assignments?.length || 0
            const bTasks = b.assignments?.length || 0
            if (aTasks !== bTasks) return bTasks - aTasks
            if (a.roomId === 'dev-team-alpha') return -1
            if (b.roomId === 'dev-team-alpha') return 1
            return 0
          })
          setAvailableRooms(sorted)
        }
      }
    } catch (e) {
      console.error('Failed to load war rooms', e)
    } finally {
      setLoadingRooms(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchRooms()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleArchiveRoom = (targetRoomId: string) => {
    setArchivedRoomIds(prev => {
      const next = Array.from(new Set([...prev, targetRoomId]))
      try { localStorage.setItem('dsh-group-chat:archived-room-ids', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const handlePruneOtherRooms = () => {
    const others = availableRooms
      .map(r => r.roomId)
      .filter(id => id !== roomId && id !== 'dev-team-alpha')
    setArchivedRoomIds(prev => {
      const next = Array.from(new Set([...prev, ...others]))
      try { localStorage.setItem('dsh-group-chat:archived-room-ids', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const visibleRooms = availableRooms.filter(r => !archivedRoomIds.includes(r.roomId) || r.roomId === roomId)
  const isAutoMode = typeof localStorage !== 'undefined' && !localStorage.getItem('dsh-group-chat.selected-room-id')

  const handleSwitchRoom = (targetRoomId: string | null) => {
    setCurrentGroupChatRoomId(targetRoomId)
    // Also smoothly ensure central Agent group chat tab is focused
    const tabs = Array.from(document.querySelectorAll('*'))
    const agentTab = tabs.find(el => el.textContent?.trim() === 'Agent 群聊' && (el.tagName === 'BUTTON' || el.getAttribute('role') === 'tab')) as HTMLElement | undefined
    if (agentTab) {
      agentTab.click()
    }
    onClose()
  }

  return (
    <div
      className="dsh-gc-cockpit-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={modalRef}
        className="dsh-gc-cockpit-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={tx(locale, '联动驾驶舱', 'Linked Cockpit')}
        style={{
          width: '440px',
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 48px)',
          background: 'var(--dsw-alias-bg-layer-2, #1c1c22)',
          border: '1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.16))',
          borderRadius: '14px',
          padding: '16px 18px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxSizing: 'border-box',
          color: 'var(--dsw-alias-label-primary, #f8fafc)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '10px',
            borderBottom: '1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08))',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700 }}>
              <span>🏛️</span>
              <span>{tx(locale, '联动驾驶舱', 'Linked Cockpit')}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', marginTop: '3px' }}>
              {tx(locale, '作战室调度与未完任务找回', 'War Room Orchestration & Task Recovery')}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--dsw-alias-label-tertiary, #94a3b8)',
              cursor: 'pointer',
              fontSize: '14px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
            title={tx(locale, '关闭驾驶舱', 'Close Cockpit')}
          >
            ✕
          </button>
        </div>

        {/* Option: Auto Follow Current Session */}
        <div
          onClick={() => handleSwitchRoom(null)}
          style={{
            padding: '10px 12px',
            borderRadius: '9px',
            cursor: 'pointer',
            fontSize: '12px',
            background: isAutoMode ? 'rgba(77, 107, 254, 0.18)' : 'rgba(255, 255, 255, 0.03)',
            border: isAutoMode ? '1px solid rgba(77, 107, 254, 0.45)' : '1px solid rgba(255, 255, 255, 0.06)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600, color: isAutoMode ? '#818cf8' : 'var(--dsw-alias-label-primary, #f8fafc)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔄</span>
              <span>{tx(locale, '自动跟随当前会话', 'Auto Follow Current Session')}</span>
            </div>
            {isAutoMode && (
              <span style={{ fontSize: '10px', color: '#818cf8', fontWeight: 600 }}>✓ {tx(locale, '当前生效', 'Active')}</span>
            )}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', marginTop: '3px' }}>
            {tx(locale, '随 DSH 左栏切换会话而自动进入对应的作战室', 'Switches room automatically with DSH left session selection')}
          </div>
        </div>

        {/* Room List Title & Prune Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 2px 0' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dsw-alias-label-tertiary, #94a3b8)' }}>
            {tx(locale, '作战室清单', 'War Room List')} {visibleRooms.length > 0 && `(${visibleRooms.length})`}
          </span>
          {visibleRooms.length > 1 && (
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--dsw-alias-label-caption, #64748b)',
                fontSize: '11px',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--dsw-alias-label-caption, #64748b)')}
              onClick={() => {
                if (confirm(tx(locale, '确定清空所有其他历史作战室，仅保留当前作战室吗？', 'Clear all other historical war rooms?'))) {
                  handlePruneOtherRooms()
                }
              }}
            >
              {tx(locale, '清理闲置作战室', 'Prune idle rooms')}
            </button>
          )}
        </div>

        {/* Room Cards Scroll Area */}
        <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {loadingRooms ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', fontSize: '12px' }}>
              {tx(locale, '正在刷新作战室状态…', 'Loading war rooms…')}
            </div>
          ) : visibleRooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', fontSize: '12px' }}>
              {tx(locale, '暂无其他作战室', 'No other war rooms found')}
            </div>
          ) : (
            visibleRooms.map((r) => {
              const isSelected = roomId === r.roomId
              const taskCount = r.assignments?.length || 0
              const isAlpha = r.roomId === 'dev-team-alpha'
              const title = r.title || (isAlpha ? tx(locale, '默认小队工作台', 'Default Team Cockpit') : `${tx(locale, '作战室', 'War Room')} (${r.roomId.replace(/^dsh-session-/, '').slice(0, 8)}…)`)

              return (
                <div
                  key={r.roomId}
                  onClick={() => handleSwitchRoom(r.roomId)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    background: isSelected ? 'rgba(77, 107, 254, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1px solid rgba(77, 107, 254, 0.45)' : '1px solid rgba(255, 255, 255, 0.06)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                      <span style={{ fontSize: '14px' }}>{isAlpha ? '🏠' : '💬'}</span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: isSelected ? '#818cf8' : 'var(--dsw-alias-label-primary, #f8fafc)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {taskCount > 0 ? (
                        <span
                          style={{
                            background: '#ef4444',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '10px',
                          }}
                        >
                          🔥 {taskCount} {tx(locale, '任务', 'tasks')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--dsw-alias-label-tertiary, #94a3b8)', fontSize: '10px' }}>
                          0 {tx(locale, '任务', 'tasks')}
                        </span>
                      )}
                      {isSelected ? (
                        <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 700 }}>✓</span>
                      ) : !isAlpha && (
                        <button
                          type="button"
                          title={tx(locale, '归档/移除该作战室', 'Archive / Delete this war room')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--dsw-alias-label-caption, #64748b)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            padding: '0 2px',
                            lineHeight: 1,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--dsw-alias-label-caption, #64748b)')}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(tx(locale, `确定归档并移除作战室【${title}】吗？`, `Archive and delete war room ${title}?`))) {
                              handleArchiveRoom(r.roomId)
                            }
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  {r.pinnedGoal && (
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'var(--dsw-alias-label-tertiary, #94a3b8)',
                        marginTop: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      🎯 {r.pinnedGoal}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

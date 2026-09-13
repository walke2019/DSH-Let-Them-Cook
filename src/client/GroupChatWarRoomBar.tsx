import React, { useState, useEffect, useRef } from 'react'
import { GroupChatLocale, tx } from './i18n.js'
import { setCurrentGroupChatRoomId, resolveCurrentGroupChatRoomId } from './current-room.js'
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

interface GroupChatWarRoomBarProps {
  roomId: string
  locale: GroupChatLocale
  room: any
  activeAssignments: AssignmentEnvelope[]
}

export function GroupChatWarRoomBar({
  roomId,
  locale,
  room,
  activeAssignments,
}: GroupChatWarRoomBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<WarRoomItem[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [archivedRoomIds, setArchivedRoomIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dsh-group-chat:archived-room-ids') || '[]')
    } catch {
      return []
    }
  })
  const popoverRef = useRef<HTMLDivElement>(null)

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

  const displayRoomTitle = room?.title || (roomId === 'dev-team-alpha' ? tx(locale, '默认小队工作台', 'Default Team Cockpit') : `${tx(locale, '作战室', 'War Room')} (${roomId.replace(/^dsh-session-/, '').slice(0, 8)}…)`)

  const currentStage = room?.workflow?.stages?.[room?.workflow?.currentStageIndex]

  const openPicker = async () => {
    setPickerOpen(true)
    setLoadingRooms(true)
    try {
      const res = await fetch('/dsh-group-chat/api/rooms')
      const data = await res.json()
      if (Array.isArray(data.rooms)) {
        // Sort rooms: rooms with active tasks first, then dev-team-alpha, then others
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
    } catch (e) {
      console.error('Failed to load war rooms', e)
    } finally {
      setLoadingRooms(false)
    }
  }

  const handleSwitchRoom = (targetRoomId: string | null) => {
    setCurrentGroupChatRoomId(targetRoomId)
    setPickerOpen(false)
  }

  // Dismiss when clicking outside & listen to external open trigger
  useEffect(() => {
    const handleExternalOpen = () => {
      openPicker()
    }
    window.addEventListener('dsh-group-chat:open-war-room-picker', handleExternalOpen)
    return () => window.removeEventListener('dsh-group-chat:open-war-room-picker', handleExternalOpen)
  }, [])

  useEffect(() => {
    if (!pickerOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [pickerOpen])

  return (
    <div
      className="gc-warroom-bar"
      data-dsh-gc-warroom-bar
      style={{
        position: 'relative',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 16px',
        background: 'linear-gradient(180deg, var(--dsw-alias-bg-layer-2, #18181c) 0%, var(--dsw-alias-bg-base, #101014) 100%)',
        borderBottom: '1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08))',
        fontSize: '12px',
        color: 'var(--dsw-alias-label-secondary, #cbd5e1)',
        userSelect: 'none',
        boxSizing: 'border-box',
        width: '100%',
        minHeight: '40px',
      }}
    >
      {/* Left: War Room Identity & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
        <span style={{ fontSize: '15px', flexShrink: 0 }}>🏛️</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
          <span
            style={{
              fontWeight: 600,
              color: 'var(--dsw-alias-label-primary, #f8fafc)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '220px',
            }}
            title={displayRoomTitle}
          >
            {displayRoomTitle}
          </span>
          {roomId === 'dev-team-alpha' && (
            <span
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--dsw-alias-label-tertiary, #94a3b8)',
              }}
            >
              {tx(locale, '默认', 'Default')}
            </span>
          )}
        </div>

        {/* Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '4px' }}>
          {activeAssignments.length > 0 ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 8px #ef4444',
                }}
              />
              🔥 {activeAssignments.length} {tx(locale, '任务全力开整中', 'active task(s)')}
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 7px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '10px',
                fontWeight: 500,
              }}
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
              {tx(locale, '待命中', 'Ready')}
            </span>
          )}

          {currentStage && (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--dsw-alias-label-tertiary, #94a3b8)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <span>·</span>
              <span>{currentStage.name}</span>
            </span>
          )}
        </div>
      </div>

      {/* Right: Prominent Switch / Recover Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={pickerOpen ? () => setPickerOpen(false) : openPicker}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '7px',
            background: 'linear-gradient(135deg, rgba(77, 107, 254, 0.22), rgba(99, 102, 241, 0.28))',
            border: '1px solid rgba(99, 102, 241, 0.45)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 8px rgba(77, 107, 254, 0.2)',
          }}
          title={tx(locale, '切换作战室或找回未完任务', 'Switch war room or recover tasks')}
        >
          <span>🏛️</span>
          <span>{tx(locale, '切换作战室 / 找回任务', 'Switch Room / Recover Tasks')}</span>
          <span style={{ fontSize: '9px', opacity: 0.8, transform: pickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
        </button>
      </div>

      {/* War Room Switcher Drawer / Popover */}
      {pickerOpen && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: '44px',
            right: '16px',
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            background: 'var(--dsw-alias-bg-layer-2, #1c1c22)',
            border: '1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.14))',
            borderRadius: '12px',
            padding: '12px',
            zIndex: 1000,
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08))',
              marginBottom: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dsw-alias-label-primary, #f8fafc)' }}>
                🏛️ {tx(locale, '作战室管理与任务找回', 'War Room & Task Recovery')}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', marginTop: '2px' }}>
                {tx(locale, '每个作战室拥有独立的消息记录、角色编排与任务队列', 'Independent messages, roles & task queues')}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--dsw-alias-label-tertiary, #94a3b8)',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '4px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Option: Auto Follow Current Session */}
          <div
            onClick={() => handleSwitchRoom(null)}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              background: isAutoMode ? 'rgba(77, 107, 254, 0.18)' : 'rgba(255, 255, 255, 0.03)',
              border: isAutoMode ? '1px solid rgba(77, 107, 254, 0.4)' : '1px solid transparent',
              marginBottom: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600, color: isAutoMode ? '#818cf8' : 'var(--dsw-alias-label-primary, #f8fafc)' }}>
                🔄 {tx(locale, '自动跟随当前会话', 'Auto Follow Current Session')}
              </div>
              {isAutoMode && (
                <span style={{ fontSize: '10px', color: '#818cf8', fontWeight: 600 }}>✓ {tx(locale, '当前生效', 'Active')}</span>
              )}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', marginTop: '2px' }}>
              {tx(locale, '随 DSH 左栏切换会话而自动进入对应的作战室', 'Switches room automatically with DSH left session selection')}
            </div>
          </div>

          {/* Room List Title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px 6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dsw-alias-label-tertiary, #94a3b8)' }}>
              {tx(locale, '所有作战室清单', 'All War Rooms')} {visibleRooms.length > 0 && `(${visibleRooms.length})`}
            </span>
            {visibleRooms.length > 1 && (
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--dsw-alias-label-caption, #64748b)',
                  fontSize: '10px',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--dsw-alias-label-caption, #64748b)')}
                onClick={(e) => {
                  e.stopPropagation()
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
          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {loadingRooms ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', fontSize: '11px' }}>
                {tx(locale, '正在刷新作战室状态…', 'Loading war rooms…')}
              </div>
            ) : visibleRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', fontSize: '11px' }}>
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
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      background: isSelected ? 'rgba(77, 107, 254, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid rgba(77, 107, 254, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                        <span>{isAlpha ? '🏠' : '💬'}</span>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
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
                          <span style={{ fontSize: '10px', color: '#818cf8', fontWeight: 600 }}>✓</span>
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
                              padding: '0 4px',
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

                    {/* Secondary info: pinned goal or stage */}
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
      )}
    </div>
  )
}

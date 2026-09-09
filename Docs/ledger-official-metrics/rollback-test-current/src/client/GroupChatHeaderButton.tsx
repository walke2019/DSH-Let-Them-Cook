import React, { useState, useEffect } from 'react'
import { GroupChatPanel } from './GroupChatPanel.js'

export interface GroupChatHeaderButtonProps {
  sessionId?: string
}

export function GroupChatHeaderButton({ sessionId }: GroupChatHeaderButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeStageName, setActiveStageName] = useState<string>('阶段一·调研')
  const [hasPendingApproval, setHasPendingApproval] = useState(false)

  // 轮询当前工作流阶段简况
  useEffect(() => {
    const checkState = async () => {
      try {
        const res = await fetch('/dsh-group-chat/api/room?id=dev-team-alpha')
        if (!res.ok) return
        const data = await res.json()
        if (data.room?.workflow) {
          const curr = data.room.workflow.stages[data.room.workflow.currentStageIndex]
          if (curr) {
            setActiveStageName(curr.name.replace(/^阶段[一二三四五]：/, ''))
            setHasPendingApproval(curr.requiresApproval && curr.status === 'awaiting_approval')
          }
        }
      } catch {}
    }

    checkState()
    const timer = setInterval(checkState, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {/* 1. DSH 原生风格会话顶栏胶囊按钮 (会话 Header Utilities) */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        title="点击展开/收起多 Agent 协同流转与审核看板"
        style={{
          border: '1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12))',
          height: '28px',
          color: isOpen
            ? 'var(--dsw-alias-state-business-primary, #4176e6)'
            : 'var(--dsw-alias-label-primary, #f8fafc)',
          fontFamily: 'var(--dsw-font-family, inherit)',
          cursor: 'pointer',
          background: isOpen
            ? 'var(--dsw-alias-interactive-bg-hover, rgba(65, 118, 230, 0.1))'
            : 'transparent',
          borderRadius: '14px',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '5px',
          padding: '2px 10px',
          fontSize: '12px',
          fontWeight: 500,
          lineHeight: '20px',
          display: 'inline-flex',
          userSelect: 'none',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          if (!isOpen) e.currentTarget.style.backgroundColor = 'var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06))'
        }}
        onMouseLeave={e => {
          if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <span style={{ fontSize: '13px' }}>🎖️</span>
        <span style={{ whiteSpace: 'nowrap' }}>特遣协同</span>
        {hasPendingApproval ? (
          <span style={{
            fontSize: '9px',
            backgroundColor: 'var(--dsw-alias-state-error-primary, #ef4444)',
            color: '#fff',
            padding: '0 4px',
            borderRadius: '6px',
            fontWeight: 700,
          }}>
            待审
          </span>
        ) : (
          <span style={{
            fontSize: '10px',
            color: 'var(--dsw-alias-label-tertiary, #94a3b8)',
            maxWidth: '70px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {activeStageName}
          </span>
        )}
      </button>

      {/* 2. 右侧伴随协同看板 (Copilot Companion Drawer，不覆盖全高全宽，优雅吸附在右侧) */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '52px',
            right: '12px',
            bottom: '12px',
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            zIndex: 90,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--dsw-alias-bg-layer-1, #151518)',
            border: '1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12))',
            borderRadius: '10px',
            boxShadow: 'var(--dsw-shadow-lv3, 0 8px 32px rgba(0, 0, 0, 0.45))',
            overflow: 'hidden',
            backdropFilter: 'blur(8px)',
          }}
        >
          <GroupChatPanel mode="dock" onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  )
}

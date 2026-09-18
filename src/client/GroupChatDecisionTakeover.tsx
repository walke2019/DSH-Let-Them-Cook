import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { RoomData } from '../types.js'
import { GroupChatQuestionComposer } from './GroupChatQuestionComposer.js'
import { tx, type GroupChatLocale } from './i18n.js'
import { DEFAULT_GROUP_CHAT_ROOM_ID } from './current-room.js'

export interface GroupChatDecisionTakeoverProps {
  room: RoomData | null
  roomId: string
  locale: GroupChatLocale
  onDecisionSubmitted?: () => void
  onDecisionDismissed?: () => void
}

function useComposerSeat(): HTMLElement | null {
  const [seat, setSeat] = useState<HTMLElement | null>(() => {
    if (typeof document === 'undefined') return null
    return document.querySelector<HTMLElement>('[data-composer-seat]')
  })

  useEffect(() => {
    if (typeof document === 'undefined') return
    const update = () => {
      const el = document.querySelector<HTMLElement>('[data-composer-seat]')
      setSeat(prev => prev === el ? prev : el)
    }
    update()
    const timer = window.setInterval(update, 600)
    const observer = new MutationObserver(update)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      window.clearInterval(timer)
      observer.disconnect()
    }
  }, [])

  return seat
}

/**
 * 1:1 official QuestionComposer takeover:
 * When room.awaitingUserDecision is active, this component takes over the central official
 * [data-composer-seat] area, replacing the standard text input with the interactive decision card.
 */
export function GroupChatDecisionTakeover({
  room,
  roomId,
  locale,
  onDecisionSubmitted,
  onDecisionDismissed,
}: GroupChatDecisionTakeoverProps) {
  const composerSeat = useComposerSeat()
  const [sending, setSending] = useState(false)
  const decisionPrompt = room?.awaitingUserDecision

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (decisionPrompt) {
      document.body.setAttribute('data-dsh-gc-decision-takeover', 'true')
    } else {
      document.body.removeAttribute('data-dsh-gc-decision-takeover')
    }
    return () => {
      document.body.removeAttribute('data-dsh-gc-decision-takeover')
    }
  }, [decisionPrompt])

  if (!decisionPrompt) return null

  const targetRoomId = room?.roomId || roomId || DEFAULT_GROUP_CHAT_ROOM_ID

  const handleDismiss = async () => {
    if (sending) return
    setSending(true)
    try {
      await fetch('/dsh-group-chat/api/room/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: targetRoomId, action: 'dismiss' }),
      })
      onDecisionDismissed?.()
    } catch (err) {
      console.error('[GroupChatTakeover] dismiss error:', err)
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = async (answerText: string) => {
    if (sending) return
    setSending(true)
    try {
      await fetch('/dsh-group-chat/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: targetRoomId,
          content: answerText,
          locale,
        }),
      })
      onDecisionSubmitted?.()
    } catch (err) {
      console.error('[GroupChatTakeover] submit error:', err)
    } finally {
      setSending(false)
    }
  }

  const cardContent = (
    <div
      data-dsh-gc-question-takeover="true"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        boxSizing: 'border-box',
        pointerEvents: 'auto',
      }}
    >
      <GroupChatQuestionComposer
        prompt={decisionPrompt}
        locale={locale}
        sending={sending}
        onDismiss={handleDismiss}
        onSubmit={handleSubmit}
      />
    </div>
  )

  return (
    <>
      <style>{`
        body[data-dsh-gc-decision-takeover="true"] [data-composer-seat] > *:not([data-dsh-gc-question-takeover]) {
          display: none !important;
        }
        body[data-dsh-gc-decision-takeover="true"] [data-composer-seat] {
          min-height: auto !important;
          background: transparent !important;
        }
      `}</style>

      {composerSeat ? (
        createPortal(cardContent, composerSeat)
      ) : (
        <div
          data-dsh-gc-question-takeover-floating="true"
          style={{
            position: 'fixed',
            bottom: '12px',
            left: 'var(--dsh-group-chat-hero-left, 0px)',
            right: 'var(--dsh-group-chat-hud-overlay-width, 0px)',
            zIndex: 46,
            display: 'flex',
            justifyContent: 'center',
            padding: '0 16px',
            pointerEvents: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {cardContent}
        </div>
      )}
    </>
  )
}
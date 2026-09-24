import {useEffect, useState} from 'react'

export const DEFAULT_GROUP_CHAT_ROOM_ID = 'dev-team-alpha'
export const NEW_SESSION_ROOM_ID = 'dsh-new-session'

function sanitizeRoomId(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 96)
}

let currentActiveSessionId: string | null = null

export function setActiveSessionId(sessionId: string | null | undefined): void {
  const normalized = typeof sessionId === 'string' ? sessionId.trim() : ''
  if (currentActiveSessionId !== normalized) {
    currentActiveSessionId = normalized
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dsh-group-chat:session-changed', {detail: {sessionId: normalized}}))
    }
  }
}

export function getActiveSessionId(): string | null {
  return currentActiveSessionId
}

/** The session identity must be supplied by DSH's native sessions service. */
export function resolveCurrentDshSessionId(explicitSessionId?: string | null): string {
  if (explicitSessionId !== undefined) {
    setActiveSessionId(explicitSessionId)
  }
  return currentActiveSessionId || ''
}

export function resolveDefaultGroupChatRoomId(sessionId: string): string {
  return sessionId ? `dsh-${sanitizeRoomId(sessionId)}` : NEW_SESSION_ROOM_ID
}

/** Room identity is deterministic: current DSH session only, with no browser/DOM/storage inference. */
export function resolveCurrentGroupChatRoomId(explicitSessionId?: string | null): string {
  return resolveDefaultGroupChatRoomId(resolveCurrentDshSessionId(explicitSessionId))
}

/** Manual room switching is intentionally session-scoped and never persisted globally. */
export function setCurrentGroupChatRoomId(roomId: string | null, explicitSessionId?: string | null): void {
  const sessionId = resolveCurrentDshSessionId(explicitSessionId)
  const expectedRoomId = resolveDefaultGroupChatRoomId(sessionId)
  if (roomId && roomId !== 'auto' && roomId !== expectedRoomId) {
    throw new Error(`Room ${roomId} is not the current DSH session room ${expectedRoomId}`)
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dsh-group-chat:room-changed', {detail: {roomId: roomId || expectedRoomId, sessionId}}))
  }
}

export function useCurrentGroupChatRoomId(explicitSessionId?: string | null): string {
  const [roomId, setRoomId] = useState(() => resolveCurrentGroupChatRoomId(explicitSessionId))

  useEffect(() => {
    if (explicitSessionId !== undefined) setActiveSessionId(explicitSessionId)
    const refresh = () => setRoomId(resolveCurrentGroupChatRoomId(explicitSessionId))
    refresh()
    window.addEventListener('dsh-group-chat:session-changed', refresh)
    window.addEventListener('dsh-group-chat:room-changed', refresh)
    return () => {
      window.removeEventListener('dsh-group-chat:session-changed', refresh)
      window.removeEventListener('dsh-group-chat:room-changed', refresh)
    }
  }, [explicitSessionId])

  return roomId
}

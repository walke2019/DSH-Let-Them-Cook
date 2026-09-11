import {useEffect, useState} from 'react'

export const DEFAULT_GROUP_CHAT_ROOM_ID = 'dev-team-alpha'

function sanitizeRoomId(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 96)
}

export function resolveCurrentGroupChatRoomId(): string {
  if (typeof localStorage === 'undefined') return DEFAULT_GROUP_CHAT_ROOM_ID
  try {
    const override = localStorage.getItem('dsh-group-chat.selected-room-id')
    if (override && override !== 'auto') return override
    const current = JSON.parse(localStorage.getItem('dsh.sessions.current') || '{}')
    const sessionId = typeof current?.sessionId === 'string' ? current.sessionId : ''
    if (sessionId) return `dsh-${sanitizeRoomId(sessionId)}`
  } catch {
    // Ignore malformed host storage and fall back to the workspace default room.
  }
  return DEFAULT_GROUP_CHAT_ROOM_ID
}

export function setCurrentGroupChatRoomId(roomId: string | null): void {
  if (typeof localStorage === 'undefined') return
  if (!roomId || roomId === 'auto') {
    localStorage.removeItem('dsh-group-chat.selected-room-id')
  } else {
    localStorage.setItem('dsh-group-chat.selected-room-id', roomId)
  }
  window.dispatchEvent(new CustomEvent('dsh-group-chat:room-changed', {detail: {roomId}}))
}

export function useCurrentGroupChatRoomId(): string {
  const [roomId, setRoomId] = useState(() => resolveCurrentGroupChatRoomId())
  useEffect(() => {
    const refresh = () => setRoomId(resolveCurrentGroupChatRoomId())
    refresh()
    const timer = window.setInterval(refresh, 700)
    const observer = new MutationObserver(refresh)
    observer.observe(document.body, {childList: true, subtree: true, attributes: true})
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('popstate', refresh)
    window.addEventListener('hashchange', refresh)
    window.addEventListener('dsh-group-chat:room-changed', refresh)
    return () => {
      window.clearInterval(timer)
      observer.disconnect()
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('popstate', refresh)
      window.removeEventListener('hashchange', refresh)
      window.removeEventListener('dsh-group-chat:room-changed', refresh)
    }
  }, [])
  return roomId
}

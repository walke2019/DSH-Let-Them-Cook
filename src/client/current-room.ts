import {useEffect, useState} from 'react'

export const DEFAULT_GROUP_CHAT_ROOM_ID = 'dev-team-alpha'
export const NEW_SESSION_ROOM_ID = 'dsh-new-session'

function sanitizeRoomId(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 96)
}

let lastObservedSessionId: string | null = null
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

export function resolveCurrentGroupChatRoomId(explicitSessionId?: string | null): string {
  let sessionId = ''

  if (explicitSessionId !== undefined) {
    sessionId = typeof explicitSessionId === 'string' ? explicitSessionId.trim() : ''
    currentActiveSessionId = sessionId
  } else if (currentActiveSessionId) {
    sessionId = currentActiveSessionId
  } else if (typeof window !== 'undefined') {
    // 1. Check window.__dshSessions list snapshot (injected by DSH / runtime bridge)
    try {
      const snapCurrent = (window as any).__dshSessions?.list?.getSnapshot?.()?.current
      if (typeof snapCurrent === 'string' && snapCurrent.trim()) {
        sessionId = snapCurrent.trim()
      }
    } catch {}

    // 2. Check window.__dshSessions manager selected
    if (!sessionId) {
      try {
        const mgrSelected = (window as any).__dshSessions?.manager?.selected
        if (typeof mgrSelected === 'string' && mgrSelected.trim()) {
          sessionId = mgrSelected.trim()
        }
      } catch {}
    }

    // 3. Check active tree item in DSH sidebar
    if (!sessionId && typeof document !== 'undefined') {
      try {
        const activeTree = document.querySelector('[role="treeitem"][aria-selected="true"]')
        if (activeTree) {
          const raw = activeTree.getAttribute('data-session-id') || activeTree.getAttribute('id') || ''
          const match = raw.match(/(?:session-|sess-)?([a-zA-Z0-9_-]{8,})/)
          if (match && !match[1].includes('workspace')) {
            sessionId = match[1]
          }
        }
      } catch {}
    }

    // 4. Fallback: URL search params
    if (!sessionId && typeof location !== 'undefined') {
      try {
        const params = new URLSearchParams(location.search)
        const sid = params.get('session') || params.get('sessionId')
        if (sid && sid.trim()) sessionId = sid.trim()
      } catch {}
    }

    // 5. Fallback: legacy storage probe if any host wrote it
    if (!sessionId && typeof localStorage !== 'undefined') {
      try {
        const current = JSON.parse(localStorage.getItem('dsh.sessions.current') || '{}')
        if (typeof current?.sessionId === 'string' && current.sessionId.trim()) {
          sessionId = current.sessionId.trim()
        }
      } catch {}
    }
  }

  if (sessionId) {
    currentActiveSessionId = sessionId
  }

  // Detect official session change in DSH: clear manual room override so room always follows active session
  if (lastObservedSessionId !== null && lastObservedSessionId !== sessionId) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem('dsh-group-chat.selected-room-id')
    } catch {}
  }
  lastObservedSessionId = sessionId

  if (typeof localStorage !== 'undefined') {
    try {
      const override = localStorage.getItem('dsh-group-chat.selected-room-id')
      if (override && override !== 'auto') return override
    } catch {}
  }

  if (sessionId) return `dsh-${sanitizeRoomId(sessionId)}`
  // Fresh / new session with no DSH session ID yet: return clean new session room
  return NEW_SESSION_ROOM_ID
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

export function useCurrentGroupChatRoomId(explicitSessionId?: string | null): string {
  const [roomId, setRoomId] = useState(() => resolveCurrentGroupChatRoomId(explicitSessionId))

  useEffect(() => {
    if (explicitSessionId !== undefined) {
      setActiveSessionId(explicitSessionId || '')
      setRoomId(resolveCurrentGroupChatRoomId(explicitSessionId))
    }
  }, [explicitSessionId])

  useEffect(() => {
    const refresh = () => setRoomId(resolveCurrentGroupChatRoomId(explicitSessionId))
    refresh()

    // Subscribe to DSH official sessions list changes if available
    let unsubscribeSessions: (() => void) | undefined
    try {
      const sessionsList = (window as any).__dshSessions?.list
      if (sessionsList && typeof sessionsList.subscribe === 'function') {
        unsubscribeSessions = sessionsList.subscribe(() => {
          const newSnap = sessionsList.getSnapshot?.()
          if (explicitSessionId === undefined && newSnap?.current !== undefined) {
            setActiveSessionId(newSnap.current || '')
          }
          refresh()
        })
      }
    } catch {}

    const timer = window.setInterval(refresh, 600)
    const fastTimer = window.setInterval(refresh, 200)
    const observer = new MutationObserver(refresh)
    observer.observe(document.body, {childList: true, subtree: true, attributes: true})
    window.addEventListener('click', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('popstate', refresh)
    window.addEventListener('hashchange', refresh)
    window.addEventListener('dsh-group-chat:session-changed', refresh)
    window.addEventListener('dsh-group-chat:room-changed', refresh)
    return () => {
      if (unsubscribeSessions) unsubscribeSessions()
      window.clearInterval(timer)
      window.clearInterval(fastTimer)
      observer.disconnect()
      window.removeEventListener('click', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('popstate', refresh)
      window.removeEventListener('hashchange', refresh)
      window.removeEventListener('dsh-group-chat:session-changed', refresh)
      window.removeEventListener('dsh-group-chat:room-changed', refresh)
    }
  }, [explicitSessionId])
  return roomId
}


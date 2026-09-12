export type RuntimeLivenessPhase = 'empty' | 'starting' | 'llm_streaming' | 'tool_running' | 'retrying' | 'completed' | 'failed' | 'stalled'

export interface RuntimeLivenessSnapshot {
  phase: RuntimeLivenessPhase
  lastEventSeq?: number
  lastEventAt?: number
  openToolCallIds: string[]
  retryCount: number
  terminalReason?: string
}

const LIVE_EVENT_TYPES = new Set(['assistant/live-chunk', 'assistant/chunk', 'assistant/message', 'assistant/attempt', 'tool/call', 'tool/result', 'llm/retry', 'llm/retry-started', 'step/start', 'step/end', 'turn/start', 'turn/end'])

function eventSeq(event: any): number | undefined {
  return typeof event?.seq === 'number' ? event.seq : undefined
}

function eventTime(event: any): number | undefined {
  return typeof event?.time === 'number' ? event.time : undefined
}

function callIdFrom(event: any): string {
  const data = event?.data || {}
  return String(data.message?.source?.callId || data.callId || data.id || data.call?.id || '')
}

export function classifyRuntimeLiveness(events: readonly any[], now = Date.now(), staleAfterMs = 120000): RuntimeLivenessSnapshot {
  if (!events.length) return { phase: 'empty', openToolCallIds: [], retryCount: 0 }

  const openTools = new Set<string>()
  let retryCount = 0
  let lastLive: any | undefined
  let terminal: any | undefined

  for (const event of events) {
    if (LIVE_EVENT_TYPES.has(String(event?.type))) lastLive = event
    if (event?.type === 'tool/call') {
      const id = callIdFrom(event)
      if (id) openTools.add(id)
    }
    if (event?.type === 'tool/result') {
      const id = callIdFrom(event)
      if (id) openTools.delete(id)
    }
    if (event?.type === 'llm/retry' || event?.type === 'llm/retry-started') retryCount += 1
    if (event?.type === 'turn/end') terminal = event
  }

  const lastEventAt = eventTime(lastLive)
  const base = {
    lastEventSeq: eventSeq(lastLive),
    lastEventAt,
    openToolCallIds: [...openTools],
    retryCount,
  }

  if (terminal) {
    const reason = terminal.data?.reason
    const kind = String(reason?.kind || '')
    return { ...base, phase: kind === 'completed' ? 'completed' : 'failed', terminalReason: kind || JSON.stringify(reason || {}) }
  }
  if (openTools.size > 0) return { ...base, phase: 'tool_running' }
  if (retryCount > 0 && lastLive?.type !== 'assistant/live-chunk' && lastLive?.type !== 'assistant/chunk') return { ...base, phase: 'retrying' }
  if (lastLive?.type === 'assistant/live-chunk' || lastLive?.type === 'assistant/chunk' || lastLive?.type === 'assistant/attempt' || lastLive?.type === 'assistant/message') return { ...base, phase: 'llm_streaming' }
  if (lastEventAt && now - lastEventAt > staleAfterMs) return { ...base, phase: 'stalled' }
  return { ...base, phase: 'starting' }
}

import type { ToolCallRecord } from '../types.js'

interface MutableToolCallRecord extends ToolCallRecord {
  startedAt?: number
}

function stringifyToolPayload(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  try { return JSON.stringify(value, null, 2) } catch { return String(value) }
}

function extractToolName(data: any): string {
  return String(data?.name || data?.toolName || data?.call?.name || data?.message?.source?.name || data?.message?.name || data?.tool?.name || data?.presentation?.name || 'tool')
}

function extractToolCallId(data: any, fallback: number): string {
  return String(data?.message?.source?.callId || data?.callId || data?.id || data?.call?.id || data?.toolCallId || data?.presentation?.callId || fallback)
}

function extractToolPayload(data: any): unknown {
  return data?.arguments || data?.args || data?.call?.arguments || data?.input || data?.tool?.arguments || data?.presentation?.arguments
}

function extractToolResult(data: any): unknown {
  return data?.result || data?.output || data?.message?.content || data?.error || data?.presentation?.result
}

function parseToolPayload(rawArgs: any): any {
  if (!rawArgs) return undefined
  if (typeof rawArgs === 'string') {
    try { return JSON.parse(rawArgs) } catch { return rawArgs }
  }
  return rawArgs
}

export function extractToolTarget(rawArgs: any, toolName?: string): string | undefined {
  const parsed = parseToolPayload(rawArgs)
  if (typeof parsed === 'object' && parsed !== null) {
    if (toolName === 'bash') {
      return parsed.description ? String(parsed.description) : (parsed.command ? String(parsed.command) : undefined)
    }
    if (toolName === 'edit') {
      const path = parsed.file_path || parsed.path
      const oldStr = typeof parsed.old_string === 'string' ? parsed.old_string : ''
      const newStr = typeof parsed.new_string === 'string' ? parsed.new_string : ''
      if (oldStr || newStr) {
        const delLines = oldStr ? oldStr.split('\n').length : 0
        const addLines = newStr ? newStr.split('\n').length : 0
        return path ? `${path}  +${addLines} -${delLines}` : `+${addLines} -${delLines}`
      }
      return path ? String(path) : undefined
    }
    const candidate = parsed.description || parsed.file_path || parsed.path || parsed.pattern || parsed.query || (Array.isArray(parsed.queries) ? parsed.queries[0] : undefined) || parsed.command || parsed.dir || parsed.url
    if (candidate) return String(candidate)
  }
  return undefined
}

function isToolError(data: any, resultText: string): boolean {
  return !!data?.error || !!data?.presentation?.error || (resultText.includes('[exit code:') && !resultText.includes('[exit code: 0]'))
}

function applyPtcDispatch(calls: Map<string, MutableToolCallRecord>, event: any): void {
  const data = event.data || {}
  const id = extractToolCallId(data, calls.size + 1)
  const prev = calls.get(id)
  const rawPayload = extractToolPayload(data)
  const name = prev?.name || extractToolName(data)
  const resultText = stringifyToolPayload(extractToolResult(data))
  const status = data?.status || data?.presentation?.status
  const isTerminal = event.type === 'tool/ptc-dispatch' && (status === 'success' || status === 'error' || status === 'failed' || resultText)
  calls.set(id, {
    id,
    name,
    arguments: prev?.arguments || stringifyToolPayload(rawPayload),
    result: resultText || prev?.result,
    status: isTerminal ? (isToolError(data, resultText) || status === 'error' || status === 'failed' ? 'error' : 'success') : (prev?.status || 'running'),
    startedAt: prev?.startedAt || (typeof event.time === 'number' ? event.time : undefined),
    durationMs: prev?.startedAt && typeof event.time === 'number' && isTerminal ? Math.max(0, event.time - prev.startedAt) : prev?.durationMs,
    readWritePath: prev?.readWritePath || extractToolTarget(rawPayload, name) || data?.presentation?.target,
  })
}

export function summarizeToolCalls(events: readonly any[]): ToolCallRecord[] {
  const calls = new Map<string, MutableToolCallRecord>()
  for (const event of events) {
    const data = event.data || {}
    if (event.type === 'tool/ptc-dispatch-start' || event.type === 'tool/ptc-dispatch') {
      applyPtcDispatch(calls, event)
    }
    if (event.type === 'tool/call') {
      const id = extractToolCallId(data, calls.size + 1)
      const rawPayload = extractToolPayload(data)
      const name = extractToolName(data)
      calls.set(id, {
        id,
        name,
        arguments: stringifyToolPayload(rawPayload),
        status: 'running',
        startedAt: typeof event.time === 'number' ? event.time : undefined,
        readWritePath: extractToolTarget(rawPayload, name),
      })
    }
    if (event.type === 'tool/result') {
      const id = extractToolCallId(data, calls.size + 1)
      const prev = calls.get(id)
      const startedAt = prev?.startedAt
      const rawPayload = extractToolPayload(data)
      const name = prev?.name || extractToolName(data)
      const target = prev?.readWritePath || extractToolTarget(rawPayload, name)
      const resultText = stringifyToolPayload(extractToolResult(data))
      calls.set(id, {
        id,
        name,
        arguments: prev?.arguments || stringifyToolPayload(rawPayload),
        result: resultText,
        status: isToolError(data, resultText) ? 'error' : 'success',
        durationMs: typeof startedAt === 'number' && typeof event.time === 'number' ? Math.max(0, event.time - startedAt) : undefined,
        readWritePath: target,
      })
    }
  }
  return [...calls.values()].map(({startedAt, ...call}) => call).slice(-20)
}

import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { AgentHandle, AgentRegistry } from '@deepseek-ai/dsh-agent'
import type { SessionId, UserMessage } from '@deepseek-ai/dsh-session'
import type { AgentRuntimeMetrics, ModelRef, ToolCallRecord } from '../types.js'
import type {GroupChatLocale} from '../client/i18n.js'
import { getCurrentModel, restrictToolsCompat } from '../compat/dsh.js'

export type RuntimeContext = Context & { agents: AgentRegistry; tools: any; systemPrompt: any; agentDefaultModel: any }


function emptyRuntimeMetrics(): AgentRuntimeMetrics {
  return {turnCount:0,stepCount:0,llmMs:0,toolMs:0,firstTokenMsTotal:0,firstTokenCount:0,inputTokens:0,outputTokens:0,cacheReadTokens:0,cacheWriteTokens:0}
}

function hasVisibleDelta(chunk: any): boolean {
  return (chunk?.type === 'text-delta' || chunk?.type === 'reasoning-delta') && !!chunk.text
    || chunk?.type === 'tool-call-delta' && (!!chunk.argumentsDelta || !!chunk.name)
}

function asRuntimeEvents(events: unknown): readonly any[] {
  return Array.isArray(events) ? events : []
}

function findLastRuntimeEvent(events: readonly any[], predicate: (event: any) => boolean): any | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (predicate(event)) return event
  }
  return undefined
}

function extractAssistantTextFromEvents(events: readonly any[]): string {
  return events.filter(event => event.type === 'assistant/message')
    .flatMap(event => event.data?.message?.content || [])
    .filter(block => block?.type === 'text' && typeof block.text === 'string')
    .map(block => block.text)
    .join('\n')
    .trim()
}

function extractAssistantTextFromSurface(session: any): string {
  if (typeof session?.deriveMessages !== 'function') return ''
  try {
    return session.deriveMessages()
      .filter((message: any) => message?.role === 'assistant')
      .flatMap((message: any) => message.content || [])
      .filter((block: any) => block?.type === 'text' && typeof block.text === 'string')
      .map((block: any) => block.text)
      .join('\n')
      .trim()
  } catch (error) {
    console.warn?.(`[GroupChat] failed to derive assistant surface: ${error instanceof Error ? error.message : String(error)}`)
    return ''
  }
}

function summarizeRuntimeEventShape(events: readonly any[], session: any): string {
  const typeCounts = new Map<string, number>()
  for (const event of events) typeCounts.set(String(event?.type || 'unknown'), (typeCounts.get(String(event?.type || 'unknown')) || 0) + 1)
  const types = [...typeCounts.entries()].map(([type, count]) => `${type}:${count}`).join(', ') || 'none'
  let surface = 'unavailable'
  if (typeof session?.deriveMessages === 'function') {
    try {
      const messages = session.deriveMessages()
      surface = messages.map((message: any) => message?.role || 'unknown').join(', ') || 'empty'
    } catch (error) {
      surface = `error:${error instanceof Error ? error.message : String(error)}`
    }
  }
  return `events=${events.length} [${types}], surface=${surface}`
}

function stringifyToolPayload(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  try { return JSON.stringify(value, null, 2) } catch { return String(value) }
}

function extractToolName(data: any): string {
  return String(data?.name || data?.toolName || data?.call?.name || data?.message?.source?.name || data?.message?.name || 'tool')
}

function extractToolTarget(rawArgs: any, toolName?: string): string | undefined {
  if (!rawArgs) return undefined
  let parsed = rawArgs
  if (typeof rawArgs === 'string') {
    try { parsed = JSON.parse(rawArgs) } catch {}
  }
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

export function summarizeToolCalls(events: readonly any[]): ToolCallRecord[] {
  const calls = new Map<string, ToolCallRecord & { startedAt?: number }>()
  for (const event of events) {
    const data = event.data || {}
    if (event.type === 'tool/call') {
      const id = String(data.callId || data.id || data.call?.id || calls.size + 1)
      const rawPayload = data.arguments || data.args || data.call?.arguments || data.input
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
      const id = String(data.message?.source?.callId || data.callId || data.id || data.call?.id || calls.size + 1)
      const prev = calls.get(id)
      const startedAt = prev?.startedAt
      const rawPayload = data.arguments || data.args || data.input
      const name = prev?.name || extractToolName(data)
      const target = prev?.readWritePath || extractToolTarget(rawPayload, name)
      const resultText = stringifyToolPayload(data.result || data.output || data.message?.content || data.error)
      const isErr = !!data.error || (resultText.includes('[exit code:') && !resultText.includes('[exit code: 0]'))
      calls.set(id, {
        id,
        name,
        arguments: prev?.arguments || stringifyToolPayload(rawPayload),
        result: resultText,
        status: isErr ? 'error' : 'success',
        durationMs: typeof startedAt === 'number' && typeof event.time === 'number' ? Math.max(0, event.time - startedAt) : undefined,
        readWritePath: target,
      })
    }
  }
  return [...calls.values()].map(({startedAt, ...call}) => call).slice(-20)
}

function summarizeRuntimeMetrics(events: readonly any[], promptText = '', replyContent = '', durationMs = 0): AgentRuntimeMetrics {
  const metrics = emptyRuntimeMetrics()
  metrics.turnCount = Math.max(1, events.filter(e=>e.type==='turn/start').length)
  metrics.stepCount = Math.max(1, events.filter(e=>e.type==='step/start').length)
  const stepStarts = new Map<string, number>()
  const firstSeen = new Set<string>()
  const toolStarts = new Map<string, number>()
  for (const event of events) {
    const data = event.data || {}
    const key = `${data.turn}:${data.step}`
    if (event.type === 'step/start') stepStarts.set(key, event.time)
    if (event.type === 'assistant/chunk' && !firstSeen.has(key) && hasVisibleDelta(data.chunk)) {
      const start = stepStarts.get(key)
      if (start !== undefined) { metrics.firstTokenMsTotal += Math.max(0, event.time - start); metrics.firstTokenCount += 1 }
      firstSeen.add(key)
    }
    if (event.type === 'assistant/message') {
      const start = stepStarts.get(key)
      if (start !== undefined) metrics.llmMs += Math.max(0, event.time - start)
      const usage = data.usage || data.message?.usage || data.metadata?.usage
      if (usage) {
        metrics.inputTokens += usage.inputTokens || usage.prompt_tokens || 0
        metrics.outputTokens += usage.outputTokens || usage.completion_tokens || 0
        metrics.cacheReadTokens += usage.cacheReadTokens || 0
        metrics.cacheWriteTokens += usage.cacheWriteTokens || 0
      }
    }
    if (event.type === 'tool/call') toolStarts.set(String(data.callId), event.time)
    if (event.type === 'tool/result') {
      const start = toolStarts.get(String(data.message?.source?.callId || data.callId || ''))
      if (start !== undefined) metrics.toolMs += Math.max(0, event.time - start)
    }
  }

  // Token fallback estimation if provider emitted no usage metrics
  if (metrics.inputTokens === 0 && promptText) {
    metrics.inputTokens = Math.max(12, Math.ceil(promptText.length * 0.7))
  }
  if (metrics.outputTokens === 0 && replyContent) {
    metrics.outputTokens = Math.max(12, Math.ceil(replyContent.length * 0.7))
  }
  if (metrics.llmMs === 0 && durationMs > 0) {
    metrics.llmMs = durationMs
  }
  return metrics
}


async function waitForMemberIdle(agent: AgentHandle['agent'], signal: AbortSignal): Promise<void> {
  if (signal.aborted) throw signal.reason instanceof Error ? signal.reason : new Error(String(signal.reason || 'group-chat turn aborted'))
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => reject(signal.reason instanceof Error ? signal.reason : new Error(String(signal.reason || 'group-chat turn aborted')))
    signal.addEventListener('abort', onAbort, { once: true })
    agent.whenIdle().then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort))
  })
}

export interface MemberTurnRuntimeOptions {
  roleId?: string
  allowedTools?: readonly string[]
  locale?: GroupChatLocale
  onProgress?: (toolCalls: ToolCallRecord[]) => void
}

function normalizeAllowedTools(allowedTools?: readonly string[]): string[] {
  return Array.from(new Set((allowedTools || []).map(tool => String(tool).trim()).filter(Boolean))).sort()
}

function formatToolScope(roleId: string | undefined, allowedTools: readonly string[], locale: GroupChatLocale = 'zh-CN'): string {
  const label = roleId ? (locale === 'en-US' ? `role ${roleId}` : `角色 ${roleId}`) : (locale === 'en-US' ? 'current role' : '当前角色')
  if (!allowedTools.length) {
    return locale === 'en-US' ? `[Tool Scope] ${label} has no external tools enabled this turn. Use only the provided context; do not claim you searched, read files, ran commands, or modified artifacts.` : `【工具权限 / Tool Scope】${label} 本轮未开放任何外部工具。你只能基于已给上下文发言；不得声称已经搜索、读取文件、执行命令或修改产物。`
  }
  return locale === 'en-US' ? `[Tool Scope] ${label} may call only these tools this turn: ${allowedTools.join(', ')}. Do not call or claim tools outside this list.` : `【工具权限 / Tool Scope】${label} 本轮仅允许调用这些工具：${allowedTools.join(', ')}。未列出的工具不得调用，也不得声称已执行。`
}

/** One isolated group-chat turn, driven by the host agent registry with role-scoped tools. */
export async function runMemberTurn(ctx: RuntimeContext, model: ModelRef, prompt: string, signal: AbortSignal, options: MemberTurnRuntimeOptions = {}) {
  signal.throwIfAborted()
  const selected = model.provider && model.model ? model : getCurrentModel(ctx)
  const allowedTools = normalizeAllowedTools(options.allowedTools)
  let handle: AgentHandle | undefined
  const cancel = () => handle?.agent.cancel({ kind: 'hook', reason: 'group-chat turn cancelled' })
  signal.addEventListener('abort', cancel, { once: true })
  const turnStartTime = Date.now()
  try {
    handle = await ctx.agents.create({
      sessionId: `group-chat-${randomUUID()}` as SessionId,
      meta: { cwd: process.cwd(), origin: 'subagent', delegationDepth: 1 },
      signal,
      agentOptions: { provider: selected.provider, model: selected.model, maxTokens: 2048 },
      setup(agentCtx) {
        // Agent-scoped services must be resolved from the child context. Holding a
        // registry object from the parent can register into the global layer on
        // newer DSH builds and collide across concurrent group-chat members.
        agentCtx.inject(['systemPrompt', 'tools'], (scopedCtx) => {
          const scoped = scopedCtx as RuntimeContext
          agentCtx.effect(() => {
            const scope = restrictToolsCompat(scoped.tools, allowedTools)
            if (scope.missing.length) console.warn?.(`[GroupChat] 未找到工具别名，将跳过: ${scope.missing.join(', ')}`)
            if (scope.warning) console.warn?.(`[GroupChat] 工具白名单降级为 Prompt 约束: ${scope.warning}`)
            return scope.effect || (() => {})
          })
          agentCtx.effect(() => scoped.systemPrompt.section({
            name: 'group-chat:role', order: 0, text: `${prompt}\n\n${formatToolScope(options.roleId, allowedTools, options.locale)}`, complete: true,
          }))
        })
        agentCtx.effect(() => agentCtx.on('agent/request', async (_payload, next) => ({
          ...await next(), provider: selected.provider, model: selected.model,
          temperature: model.temperature ?? 0.3,
        })))
      },
    })
    signal.throwIfAborted()
    handle.agent.followup({
      id: randomUUID(), role: 'user', source: { kind: 'plugin', plugin: '@dsh-external/dsh-group-chat' },
      content: [{ type: 'text', text: options.locale === 'en-US' ? 'Respond to the group-chat topic only as your assigned role; do not claim tools or research you did not actually perform.' : '请基于群聊议题，仅代表你的角色发言；不要声称执行了未执行的工具或调研。' }],
    } as UserMessage)

    let progressTimer: NodeJS.Timeout | undefined
    if (options.onProgress) {
      let lastReported = ''
      progressTimer = setInterval(() => {
        try {
          const events = asRuntimeEvents(handle?.agent.session?.events)
          const currentCalls = summarizeToolCalls(events)
          if (currentCalls.length > 0) {
            const key = JSON.stringify(currentCalls.map(c => ({ id: c.id, s: c.status, p: c.readWritePath })))
            if (key !== lastReported) {
              lastReported = key
              options.onProgress?.(currentCalls)
            }
          }
        } catch {}
      }, 250)
    }

    try {
      await waitForMemberIdle(handle.agent, signal)
    } finally {
      if (progressTimer) clearInterval(progressTimer)
    }
    signal.throwIfAborted()
    const events = asRuntimeEvents(handle.agent.session?.events)
    const end = findLastRuntimeEvent(events, e => e.type === 'turn/end')
    if (end && end.data?.reason?.kind !== 'completed') {
      throw new Error(`Group-chat agent turn failed: ${JSON.stringify(end.data?.reason)}`)
    }
    const content = extractAssistantTextFromEvents(events) || extractAssistantTextFromSurface(handle.agent.session)
    if (!content) {
      throw new Error(`Group-chat model returned no assistant text after idle (${summarizeRuntimeEventShape(events, handle.agent.session)})`)
    }
    if (!end) {
      console.warn?.(`[GroupChat] completed member turn without turn/end marker; accepting assistant text (${summarizeRuntimeEventShape(events, handle.agent.session)})`)
    }
    const durationMs = Date.now() - turnStartTime
    return { content, reasoningContent: '', providerUsed: selected.provider, modelUsed: selected.model, metrics: summarizeRuntimeMetrics(events, prompt, content, durationMs), toolCalls: summarizeToolCalls(events) }
  } finally {
    signal.removeEventListener('abort', cancel)
    await handle?.dispose()
  }
}

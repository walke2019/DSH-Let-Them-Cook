import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { AgentHandle, AgentRegistry } from '@deepseek-ai/dsh-agent'
import type { SessionId, UserMessage } from '@deepseek-ai/dsh-session'
import type { AgentRuntimeMetrics, ModelRef } from '../types.js'
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

function summarizeRuntimeMetrics(events: readonly any[]): AgentRuntimeMetrics {
  const metrics = emptyRuntimeMetrics()
  metrics.turnCount = events.filter(e=>e.type==='turn/start').length
  metrics.stepCount = events.filter(e=>e.type==='step/start').length
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
      const usage = data.usage
      if (usage) {
        metrics.inputTokens += usage.inputTokens || 0
        metrics.outputTokens += usage.outputTokens || 0
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
  try {
    handle = await ctx.agents.create({
      sessionId: `group-chat-${randomUUID()}` as SessionId,
      meta: { cwd: process.cwd(), origin: 'subagent', delegationDepth: 1 },
      signal,
      agentOptions: { provider: selected.provider, model: selected.model, maxTokens: 2048 },
      setup(agentCtx) {
        // Inherit the role prompt and only the role-scoped tool surface.
        const scoped = agentCtx as RuntimeContext
        agentCtx.effect(() => {
          const scope = restrictToolsCompat(scoped.tools, allowedTools)
          if (scope.missing.length) console.warn?.(`[GroupChat] 未找到工具别名，将跳过: ${scope.missing.join(', ')}`)
          if (scope.warning) console.warn?.(`[GroupChat] 工具白名单降级为 Prompt 约束: ${scope.warning}`)
          return scope.effect || (() => {})
        })
        agentCtx.effect(() => scoped.systemPrompt.section({
          name: 'group-chat:role', order: 0, text: `${prompt}\n\n${formatToolScope(options.roleId, allowedTools, options.locale)}`, complete: true,
        }))
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
    await waitForMemberIdle(handle.agent, signal)
    signal.throwIfAborted()
    const events = asRuntimeEvents(handle.agent.session?.events)
    const end = findLastRuntimeEvent(events, e => e.type === 'turn/end')
    if (!end || end.data.reason.kind !== 'completed') {
      throw new Error(`Group-chat agent turn failed: ${JSON.stringify(end?.data.reason ?? 'missing turn/end')}`)
    }
    const answers = events.filter(e => e.type === 'assistant/message')
    const content = answers.flatMap(e => e.data.message.content)
      .filter(b => b.type === 'text').map(b => b.text).join('\n').trim()
    if (!content) throw new Error('Group-chat model returned no text')
    return { content, reasoningContent: '', providerUsed: selected.provider, modelUsed: selected.model, metrics: summarizeRuntimeMetrics(events) }
  } finally {
    signal.removeEventListener('abort', cancel)
    await handle?.dispose()
  }
}

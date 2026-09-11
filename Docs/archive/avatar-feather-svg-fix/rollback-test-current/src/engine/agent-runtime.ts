import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { AgentHandle, AgentRegistry } from '@deepseek-ai/dsh-agent'
import type { SessionId, UserMessage } from '@deepseek-ai/dsh-session'
import type { AgentRuntimeMetrics, ModelRef } from '../types.js'

export type RuntimeContext = Context & { agents: AgentRegistry; tools: any; systemPrompt: any; agentDefaultModel: any }


function emptyRuntimeMetrics(): AgentRuntimeMetrics {
  return {turnCount:0,stepCount:0,llmMs:0,toolMs:0,firstTokenMsTotal:0,firstTokenCount:0,inputTokens:0,outputTokens:0,cacheReadTokens:0,cacheWriteTokens:0}
}

function hasVisibleDelta(chunk: any): boolean {
  return (chunk?.type === 'text-delta' || chunk?.type === 'reasoning-delta') && !!chunk.text
    || chunk?.type === 'tool-call-delta' && (!!chunk.argumentsDelta || !!chunk.name)
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

/** One isolated, tool-less group-chat turn, driven by the host agent registry. */
export async function runMemberTurn(ctx: RuntimeContext, model: ModelRef, prompt: string, signal: AbortSignal) {
  signal.throwIfAborted()
  const selected = model.provider && model.model ? model : ctx.agentDefaultModel.currentSelection()
  let handle: AgentHandle | undefined
  const cancel = () => handle?.agent.cancel({ kind: 'hook', reason: 'group-chat turn cancelled' })
  signal.addEventListener('abort', cancel, { once: true })
  try {
    handle = await ctx.agents.create({
      sessionId: `group-chat-${randomUUID()}` as SessionId,
      signal,
      agentOptions: { provider: selected.provider, model: selected.model, maxTokens: 2048 },
      setup(agentCtx) {
        // Inherit only the role prompt, never the host's external tools.
        const scoped = agentCtx as RuntimeContext
        agentCtx.effect(() => scoped.tools.restrict({ allow: [] }))
        agentCtx.effect(() => scoped.systemPrompt.section({
          name: 'group-chat:role', order: 0, text: prompt, complete: true,
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
      content: [{ type: 'text', text: '请基于群聊议题，仅代表你的角色发言；不要声称执行了未执行的工具或调研。' }],
    } as UserMessage)
    await handle.agent.whenIdle()
    signal.throwIfAborted()
    const events = handle.agent.session.events
    const end = events.findLast(e => e.type === 'turn/end')
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

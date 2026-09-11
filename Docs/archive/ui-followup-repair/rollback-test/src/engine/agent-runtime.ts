import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { AgentHandle, AgentRegistry } from '@deepseek-ai/dsh-agent'
import type { SessionId, UserMessage } from '@deepseek-ai/dsh-session'
import type { ModelRef } from '../types.js'

export type RuntimeContext = Context & { agents: AgentRegistry; tools: any; systemPrompt: any; agentDefaultModel: any }

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
    return { content, reasoningContent: '', providerUsed: selected.provider, modelUsed: selected.model }
  } finally {
    signal.removeEventListener('abort', cancel)
    await handle?.dispose()
  }
}

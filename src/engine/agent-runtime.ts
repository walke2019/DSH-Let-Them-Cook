import type { Context } from '@deepseek-ai/cordis'
import type { Agent, AgentRegistry } from '@deepseek-ai/dsh-agent'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import type { SubagentRuntime, SubagentRun } from '@deepseek-ai/dsh-subagent'
import type { AgentRuntimeMetrics, DshRuntimeTrace, ModelRef, NativeSubagentAssignmentContract, NativeSubagentTerminalResult, ToolCallRecord } from '../types.js'
import type {GroupChatLocale} from '../client/i18n.js'
import { summarizeToolCalls } from './dsh-tool-event-adapter.js'
import { classifyRuntimeLiveness, type RuntimeLivenessSnapshot } from './runtime-liveness.js'

export type RuntimeContext = Context & { agents: AgentRegistry; subagents: SubagentRuntime; agentDefaultModel: any; sessionProjections?: { stateOf(session: Agent['session'], key: string): unknown } }


export function emptyRuntimeMetrics(): AgentRuntimeMetrics {
  return {turnCount:0,stepCount:0,llmMs:0,toolMs:0,firstTokenMsTotal:0,firstTokenCount:0,inputTokens:0,outputTokens:0,cacheReadTokens:0,cacheWriteTokens:0}
}

function hasVisibleDelta(chunk: any): boolean {
  return (chunk?.type === 'text-delta' || chunk?.type === 'reasoning-delta') && !!chunk.text
    || chunk?.type === 'tool-call-delta' && (!!chunk.argumentsDelta || !!chunk.name)
}

function asRuntimeEvents(events: unknown): readonly any[] {
  return Array.isArray(events) ? events : []
}

function extractUsageFromEvent(event: any): any {
  const data = event?.data || {}
  if (data.usage) return data.usage
  if (data.message?.usage) return data.message.usage
  if (data.metadata?.usage) return data.metadata.usage
  if (Array.isArray(data.stream)) {
    for (let index = data.stream.length - 1; index >= 0; index -= 1) {
      const record = data.stream[index]
      if (record?.type === 'chunk' && record.chunk?.type === 'usage' && record.chunk.usage) {
        return record.chunk.usage
      }
      if (record?.chunk?.usage) return record.chunk.usage
      if (record?.usage) return record.usage
    }
  }
  return undefined
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
    if ((event.type === 'assistant/chunk' || event.type === 'assistant/live-chunk') && !firstSeen.has(key) && hasVisibleDelta(data.chunk)) {
      const start = stepStarts.get(key)
      if (start !== undefined) { metrics.firstTokenMsTotal += Math.max(0, event.time - start); metrics.firstTokenCount += 1 }
      firstSeen.add(key)
    }
    if (event.type === 'assistant/message' || event.type === 'assistant/attempt') {
      const start = stepStarts.get(key)
      if (start !== undefined) metrics.llmMs += Math.max(0, event.time - start)
      const usage = extractUsageFromEvent(event)
      if (usage) {
        const cacheRead = usage.cacheReadTokens ?? usage.prompt_tokens_details?.cached_tokens ?? usage.prompt_cache_hit_tokens ?? usage.cache_read_input_tokens ?? usage.cached_tokens ?? usage.total_cached_tokens ?? usage.input_cached_tokens ?? 0
        const cacheWrite = usage.cacheWriteTokens ?? usage.prompt_cache_miss_tokens ?? usage.cache_creation_input_tokens ?? 0
        let inTok = 0
        if (typeof usage.inputTokens === 'number') {
          inTok = usage.inputTokens
        } else if (typeof usage.prompt_tokens === 'number') {
          inTok = Math.max(0, usage.prompt_tokens - cacheRead)
        } else if (typeof usage.uncachedInputTokens === 'number') {
          inTok = usage.uncachedInputTokens
        }
        const outTok = usage.outputTokens ?? usage.completion_tokens ?? 0

        metrics.inputTokens += inTok
        metrics.outputTokens += outTok
        metrics.cacheReadTokens += cacheRead
        metrics.cacheWriteTokens += cacheWrite
      }
    }
    if (event.type === 'tool/call') toolStarts.set(String(data.callId), event.time)
    if (event.type === 'tool/result') {
      const start = toolStarts.get(String(data.message?.source?.callId || data.callId || ''))
      if (start !== undefined) metrics.toolMs += Math.max(0, event.time - start)
    }
  }

  // Do not estimate tokens from text length: DSH-native metrics must come from usage chunks or sessionProjections.
  if (metrics.llmMs === 0 && durationMs > 0) {
    metrics.llmMs = durationMs
  }
  return metrics
}


function contentBlocksToText(blocks: readonly ContentBlock[]): string {
  return blocks
    .filter((block): block is Extract<ContentBlock, { type: 'text' }> => block.type === 'text')
    .map(block => block.text)
    .join('\n')
    .trim()
}

export interface MemberTurnRuntimeOptions {
  parentAgent: Agent
  roleId?: string
  roleName?: string
  allowedTools?: readonly string[]
  locale?: GroupChatLocale
  onProgress?: (toolCalls: ToolCallRecord[], liveness?: RuntimeLivenessSnapshot) => void
  workflow?: {
    runId: string
    name: string
    phase?: string
    parentSession?: { append(type: any, data: any, ...rest: any[]): unknown }
    onEvent?: (session: { append(type: any, data: any, ...rest: any[]): unknown }) => void
  }
}

export function assertExactNativeToolFilter(allowedTools?: readonly string[]): string[] {
  const tools = (allowedTools ?? []).map(tool => tool.trim())
  if (tools.some(tool => !tool)) throw new Error('Native subagent toolFilter contains an empty tool name')
  if (new Set(tools).size !== tools.length) throw new Error('Native subagent toolFilter contains duplicate tool names')
  return tools
}

function buildPersona(prompt: string, options: MemberTurnRuntimeOptions): string {
  const role = options.roleName || options.roleId
  if (!role) throw new Error('Native subagent assignment requires an explicit role identity')
  const boundary = options.locale === 'en-US'
    ? `You are ${role}. Act strictly within this assigned specialist role. Report only work you actually performed.`
    : `你是${role}。必须严格在该专员职责内执行，只报告实际完成的工作。`
  return `${boundary}\n\n${prompt}`
}

function requireLocalRun(run: SubagentRun): NonNullable<SubagentRun['localAgent']> {
  if (!run.localAgent) throw new Error(`Native spawn subagent ${String(run.id)} did not publish a local Agent; local session metrics and tool trace are required`)
  if (!run.localAgent.session) throw new Error(`Native spawn subagent ${String(run.id)} has no live Session`)
  return run.localAgent
}

function readProjectionTotals(value: unknown): { uncachedInputTokens?: number; outputTokens?: number; cacheReadTokens?: number; cacheWriteTokens?: number } | undefined {
  if (!value || typeof value !== 'object') return undefined
  const totals = (value as { totals?: unknown }).totals
  if (!totals || typeof totals !== 'object') return undefined
  return totals as { uncachedInputTokens?: number; outputTokens?: number; cacheReadTokens?: number; cacheWriteTokens?: number }
}

function readProjectionStats(value: unknown): { llmMs?: number; toolMs?: number; ttftMs?: number; ttftSteps?: number } | undefined {
  if (!value || typeof value !== 'object') return undefined
  return value as { llmMs?: number; toolMs?: number; ttftMs?: number; ttftSteps?: number }
}

/** Execute one terminal assignment through the official DSH one-shot subagent seam. */
export async function runMemberTurn(ctx: RuntimeContext, model: ModelRef, prompt: string, signal: AbortSignal, options: MemberTurnRuntimeOptions) {
  signal.throwIfAborted()
  const parent = options.parentAgent
  if (!parent?.session) throw new Error('Native subagent assignment requires an explicit exact live parent Agent')
  if (ctx.agents.get(parent.id) !== parent) throw new Error(`Parent Agent ${String(parent.id)} is not the exact live registry entry`)
  if (!model.provider || !model.model) throw new Error('Native subagent assignment requires an exact provider and model')

  const allowedTools = assertExactNativeToolFilter(options.allowedTools)
  const contract: NativeSubagentAssignmentContract = {
    provider: 'spawn',
    parentAgentId: String(parent.id),
    label: options.roleName || options.roleId || 'specialist',
    prompt,
    persona: buildPersona(prompt, options),
    toolFilter: { allow: allowedTools },
    agentOptions: {
      provider: model.provider,
      model: model.model,
      maxTokens: 2048,
    },
    maxDepth: 1,
  }

  let run: SubagentRun | undefined
  let workflowStarted = false
  let workflowSettled = false
  const settleWorkflow = (outcome: 'completed' | 'failed' | 'cancelled') => {
    if (!options.workflow || !workflowStarted || workflowSettled) return
    workflowSettled = true
    const session = options.workflow.parentSession
    if (!session) throw new Error('DSH workflow event recording requires the parent session')
    session.append('tool-workflow/agent-end', { runId: options.workflow.runId, seq: 1, outcome })
    session.append('tool-workflow/run-end', { runId: options.workflow.runId, stopReason: outcome === 'completed' ? 'completed' : outcome === 'cancelled' ? 'cancelled' : 'error' })
  }

  const startedAt = Date.now()
  try {
    run = await ctx.subagents.start(contract.provider, {
      label: contract.label,
      prompt: [{ type: 'text', text: contract.prompt }],
      parent,
      signal,
      agentOptions: contract.agentOptions,
      maxDepth: contract.maxDepth,
      toolFilter: contract.toolFilter,
      persona: contract.persona,
    })
    const localAgent = requireLocalRun(run)

    if (options.workflow) {
      const session = options.workflow.parentSession
      if (!session) throw new Error('DSH workflow event recording requires the parent session')
      session.append('tool-workflow/run-start', { runId: options.workflow.runId, name: options.workflow.name })
      session.append('tool-workflow/agent-start', {
        runId: options.workflow.runId,
        seq: 1,
        label: contract.label,
        phase: options.workflow.phase,
        childId: String(run.id),
      })
      workflowStarted = true
    }

    const result = await run.result
    const terminal: NativeSubagentTerminalResult = {
      childSessionId: String(run.id),
      stopReason: result.stopReason,
      content: contentBlocksToText(result.output),
      diagnostic: result.diagnostic,
    }
    if (terminal.stopReason !== 'completed') {
      settleWorkflow(signal.aborted || terminal.stopReason === 'aborted' ? 'cancelled' : 'failed')
      throw new Error(`Native subagent assignment ended with ${terminal.stopReason}${terminal.diagnostic ? `: ${terminal.diagnostic}` : ''}`)
    }
    if (!terminal.content) throw new Error('Native subagent assignment completed without assistant output')

    const events = localAgent.session.snapshotEvents()
    const metrics = summarizeRuntimeMetrics(events, prompt, terminal.content, Date.now() - startedAt)
    const toolCalls = summarizeToolCalls(events)
    const liveness = classifyRuntimeLiveness(events)
    options.onProgress?.(toolCalls, liveness)
    const runtimeTrace: DshRuntimeTrace = {
      sourceSessionId: String(localAgent.session.id),
      sourceEventSeqs: events.map((event: any) => event.seq),
      projectionSource: 'native-session-events',
      liveness,
    }

    if (ctx.sessionProjections) {
      const totals = readProjectionTotals(ctx.sessionProjections.stateOf(localAgent.session, 'tokenUsage'))
      if (totals) {
        metrics.inputTokens = totals.uncachedInputTokens ?? metrics.inputTokens
        metrics.outputTokens = totals.outputTokens ?? metrics.outputTokens
        metrics.cacheReadTokens = totals.cacheReadTokens ?? metrics.cacheReadTokens
        metrics.cacheWriteTokens = totals.cacheWriteTokens ?? metrics.cacheWriteTokens
        runtimeTrace.projectionSource = 'dsh-session-projections'
      }
      const stats = readProjectionStats(ctx.sessionProjections.stateOf(localAgent.session, 'sessionStats'))
      if (stats) {
        if (typeof stats.llmMs === 'number') metrics.llmMs = stats.llmMs
        if (typeof stats.toolMs === 'number') metrics.toolMs = stats.toolMs
        if (typeof stats.ttftMs === 'number' && typeof stats.ttftSteps === 'number') {
          metrics.firstTokenMsTotal = stats.ttftMs
          metrics.firstTokenCount = stats.ttftSteps
        }
      }
    }

    settleWorkflow('completed')
    return {
      content: terminal.content,
      reasoningContent: '',
      providerUsed: model.provider,
      modelUsed: model.model,
      metrics,
      toolCalls,
      runtimeTrace,
    }
  } catch (error) {
    settleWorkflow(signal.aborted ? 'cancelled' : 'failed')
    throw error
  } finally {
    try {
      await run?.dispose()
    } catch (disposeError) {
      console.error('[GroupChat] Native subagent disposal failed after workflow settlement:', disposeError)
    }
  }
}

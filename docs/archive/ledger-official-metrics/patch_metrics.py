from pathlib import Path
# types
p=Path('src/types.ts')
s=p.read_text(encoding='utf-8')
s=s.replace("export interface AgentTokenStats {\n  agentId: string\n  agentName: string\n  callCount: number\n  promptTokens: number\n  completionTokens: number\n  totalTokens: number\n}", "export interface AgentRuntimeMetrics {\n  turnCount: number\n  stepCount: number\n  llmMs: number\n  toolMs: number\n  firstTokenMsTotal: number\n  firstTokenCount: number\n  inputTokens: number\n  outputTokens: number\n  cacheReadTokens: number\n  cacheWriteTokens: number\n}\n\nexport interface AgentModelTokenStats {\n  provider: string\n  model: string\n  callCount: number\n  promptTokens: number\n  completionTokens: number\n  totalTokens: number\n  metrics: AgentRuntimeMetrics\n}\n\nexport interface AgentTokenStats {\n  agentId: string\n  agentName: string\n  callCount: number\n  promptTokens: number\n  completionTokens: number\n  totalTokens: number\n  metrics: AgentRuntimeMetrics\n  modelStats: Record<string, AgentModelTokenStats>\n}\n")
s=s.replace("export interface RoomLedger {\n  roomId: string\n  totalCalls: number\n  totalTokens: number\n  agentStats: Record<string, AgentTokenStats>\n}", "export interface RoomLedger {\n  roomId: string\n  totalCalls: number\n  totalTokens: number\n  metrics: AgentRuntimeMetrics\n  agentStats: Record<string, AgentTokenStats>\n}")
s=s.replace("      totalTokens: number\n    }", "      totalTokens: number\n    }\n    runtimeMetrics?: AgentRuntimeMetrics")
p.write_text(s,encoding='utf-8')

# agent-runtime
p=Path('src/engine/agent-runtime.ts')
s=p.read_text(encoding='utf-8')
s=s.replace("import type { ModelRef } from '../types.js'", "import type { AgentRuntimeMetrics, ModelRef } from '../types.js'")
helper=r'''
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
'''
s=s.replace("/** One isolated, tool-less group-chat turn, driven by the host agent registry. */", helper+"\n/** One isolated, tool-less group-chat turn, driven by the host agent registry. */")
s=s.replace("    return { content, reasoningContent: '', providerUsed: selected.provider, modelUsed: selected.model }", "    return { content, reasoningContent: '', providerUsed: selected.provider, modelUsed: selected.model, metrics: summarizeRuntimeMetrics(events) }")
p.write_text(s,encoding='utf-8')

# room-manager
p=Path('src/engine/room-manager.ts')
s=p.read_text(encoding='utf-8')
s=s.replace("import type {", "import type {")
# init ledger
s=s.replace("      totalCalls: 0,\n      totalTokens: 0,\n      agentStats: {},", "      totalCalls: 0,\n      totalTokens: 0,\n      metrics: {turnCount:0,stepCount:0,llmMs:0,toolMs:0,firstTokenMsTotal:0,firstTokenCount:0,inputTokens:0,outputTokens:0,cacheReadTokens:0,cacheWriteTokens:0},\n      agentStats: {},")
# add helper after initLedger maybe
marker="  public getRoom(roomId: string): GroupChatRoom | undefined {"
helper2=r'''  private addRuntimeMetrics(target: import('../types.js').AgentRuntimeMetrics, delta?: import('../types.js').AgentRuntimeMetrics): void {
    if (!delta) return
    target.turnCount += delta.turnCount || 0
    target.stepCount += delta.stepCount || 0
    target.llmMs += delta.llmMs || 0
    target.toolMs += delta.toolMs || 0
    target.firstTokenMsTotal += delta.firstTokenMsTotal || 0
    target.firstTokenCount += delta.firstTokenCount || 0
    target.inputTokens += delta.inputTokens || 0
    target.outputTokens += delta.outputTokens || 0
    target.cacheReadTokens += delta.cacheReadTokens || 0
    target.cacheWriteTokens += delta.cacheWriteTokens || 0
  }

'''
s=s.replace(marker, helper2+marker)
# stat object add fields
s=s.replace("            totalTokens: 0,\n          }", "            totalTokens: 0,\n            metrics: {turnCount:0,stepCount:0,llmMs:0,toolMs:0,firstTokenMsTotal:0,firstTokenCount:0,inputTokens:0,outputTokens:0,cacheReadTokens:0,cacheWriteTokens:0},\n            modelStats: {},\n          }")
s=s.replace("        stat.totalTokens += consumed.totalTokens\n      }", "        stat.totalTokens += consumed.totalTokens\n        const runtimeMetrics = envelope.metadata.runtimeMetrics\n        this.addRuntimeMetrics(ledger.metrics, runtimeMetrics)\n        this.addRuntimeMetrics(stat.metrics, runtimeMetrics)\n        const provider = envelope.metadata.providerUsed || 'unknown'\n        const model = envelope.metadata.modelUsed || 'unknown'\n        const modelKey = `${provider}/${model}`\n        if (!stat.modelStats[modelKey]) stat.modelStats[modelKey] = {provider, model, callCount:0, promptTokens:0, completionTokens:0, totalTokens:0, metrics:{turnCount:0,stepCount:0,llmMs:0,toolMs:0,firstTokenMsTotal:0,firstTokenCount:0,inputTokens:0,outputTokens:0,cacheReadTokens:0,cacheWriteTokens:0}}\n        const modelStat = stat.modelStats[modelKey]\n        modelStat.callCount += 1\n        modelStat.promptTokens += consumed.promptTokens\n        modelStat.completionTokens += consumed.completionTokens\n        modelStat.totalTokens += consumed.totalTokens\n        this.addRuntimeMetrics(modelStat.metrics, runtimeMetrics)\n      }")
p.write_text(s,encoding='utf-8')

# index include tokensConsumed from metrics
p=Path('src/index.ts')
s=p.read_text(encoding='utf-8')
s=s.replace("        fallbackChain,\n\n      },", "        fallbackChain,\n        runtimeMetrics: execution.result.metrics,\n        tokensConsumed: execution.result.metrics ? { promptTokens: execution.result.metrics.inputTokens + execution.result.metrics.cacheReadTokens + execution.result.metrics.cacheWriteTokens, completionTokens: execution.result.metrics.outputTokens, totalTokens: execution.result.metrics.inputTokens + execution.result.metrics.cacheReadTokens + execution.result.metrics.cacheWriteTokens + execution.result.metrics.outputTokens } : undefined,\n\n      },")
p.write_text(s,encoding='utf-8')

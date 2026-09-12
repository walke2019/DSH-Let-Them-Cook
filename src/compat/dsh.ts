import type { ModelRef } from '../types.js'
import { detectDshApprovalWorkflowBridge, type DshApprovalWorkflowBridgeReport } from '../engine/dsh-approval-workflow-bridge.js'
import type { CatalogProvider } from '../engine/model-recommender.js'

export interface DshCompatReport {
  ok: boolean
  version?: string
  features: {
    llmCatalog: boolean
    currentModel: boolean
    toolRestrict: boolean
    webServer: boolean
    agents: boolean
    sessionProjections: boolean
    sessionProjectionStateOf: boolean
    userQuestions?: boolean
    nativeApproval: boolean
    nativeApprovalRequest: boolean
    nativeApprovalPolicy: boolean
    nativeWorkflow: boolean
    nativeWorkflowRun: boolean
  }
  bridge: DshApprovalWorkflowBridgeReport
  sources: {
    ledger: 'dsh-session-projections' | 'event-stream-usage'
    watchdog: 'dsh-runtime-liveness'
    toolEvents: 'dsh-tool-event-adapter'
    approval: 'dsh-user-approval' | 'plugin-transaction-card'
    workflow: 'dsh-workflow-run' | 'plugin-workflow-dag'
  }
  warnings: string[]
  optimizations: string[]
}

export interface ToolScopeResult {
  requested: string[]
  resolved: string[]
  missing: string[]
  knownTools: string[]
  effect?: any
  enforcement?: 'applied' | 'prompt-only'
  warning?: string
}

const LEGACY_TOOL_ALIASES: Record<string, string> = {
  workflow_advance_stage: 'group_chat_workflow_advance',
  workflow_reject_stage: 'group_chat_workflow_reject',
}

const SEMANTIC_TOOL_ALIASES: Record<string, string[]> = {
  web_search: ['web_search', 'browser_search', 'search', 'agent_reach_search'],
  web_fetch: ['web_fetch', 'fetch_url', 'stealth_read_page', 'read_page'],
  stealth_read_page: ['web_fetch', 'stealth_read_page', 'browser_read_page', 'read_page', 'fetch_url'],
  stealth_navigate: ['stealth_navigate', 'browser_navigate', 'navigate_page'],
  stealth_extract: ['stealth_extract', 'browser_extract', 'extract_page'],
  tool_fs: ['read', 'write', 'edit', 'glob', 'grep', 'tool_fs', 'read_file', 'write_file', 'edit_file', 'apply_patch'],
  tool_jobs: ['bash', 'job_output', 'job_list', 'job_kill', 'tool_jobs', 'run_command', 'shell', 'terminal'],
  modlens_read_image: ['read_image', 'modlens_read_image', 'view_image'],
  read: ['read', 'read_file'],
  write: ['write', 'write_file'],
  edit: ['edit', 'edit_file'],
  bash: ['bash', 'shell', 'terminal', 'run_command'],
  grep: ['grep'],
  glob: ['glob'],
}

export function detectDshCompat(ctx: any): DshCompatReport {
  const warnings: string[] = []
  const optimizations: string[] = []
  const projections = typeof ctx?.get === 'function' ? ctx.get('sessionProjections', false) : undefined
  const userQuestions = typeof ctx?.get === 'function' ? ctx.get('userQuestions', false) : undefined
  const bridge = detectDshApprovalWorkflowBridge(ctx)
  const features = {
    llmCatalog: !!ctx?.llm && typeof ctx.llm.listProviders === 'function' && typeof ctx.llm.listModels === 'function',
    currentModel: !!ctx?.agentDefaultModel && typeof ctx.agentDefaultModel.currentSelection === 'function',
    toolRestrict: !!ctx?.tools && typeof ctx.tools.restrict === 'function',
    webServer: !!ctx?.webServer && typeof ctx.webServer.register === 'function',
    agents: !!ctx?.agents && typeof ctx.agents.create === 'function',
    sessionProjections: !!projections,
    sessionProjectionStateOf: !!projections && typeof projections.stateOf === 'function',
    userQuestions: !!userQuestions,
    ...bridge.features,
  }
  if (!features.llmCatalog) warnings.push('DSH llm.listProviders/listModels 不可用，模型目录将降级为空列表。')
  if (!features.currentModel) warnings.push('DSH agentDefaultModel.currentSelection 不可用，将使用空默认模型。')
  if (!features.toolRestrict) warnings.push('DSH tools.restrict 不可用，角色工具白名单只能注入 Prompt，无法强制收口。')
  if (!features.webServer) warnings.push('DSH webServer.register 不可用，插件 API 无法挂载。')
  if (!features.agents) warnings.push('DSH agents.create 不可用，群聊角色无法执行独立 turn。')
  if (features.sessionProjectionStateOf) optimizations.push('DSH sessionProjections.stateOf 可用：优先使用 tokenUsage/sessionStats 官方投影作为账本与延迟数据源。')
  else warnings.push('DSH sessionProjections.stateOf 不可用：账本将降级为事件流 usage 深度解析。')
  if (features.agents) optimizations.push('DSH agents.create 可用：群聊角色以独立 subagent session 运行，保留 DSH 原生事件、工具与计量能力。')
  if (features.toolRestrict) optimizations.push('DSH tools.restrict 可用：角色工具白名单可由底座强制执行。')
  warnings.push(...bridge.warnings)
  optimizations.push(...bridge.optimizations)
  const requiredOk = features.llmCatalog && features.currentModel && features.toolRestrict && features.webServer && features.agents
  return {
    ok: requiredOk,
    features,
    bridge,
    sources: {
      ledger: features.sessionProjectionStateOf ? 'dsh-session-projections' : 'event-stream-usage',
      watchdog: 'dsh-runtime-liveness',
      toolEvents: 'dsh-tool-event-adapter',
      approval: bridge.sources.approval,
      workflow: bridge.sources.workflow,
    },
    warnings,
    optimizations,
  }
}

export function getCurrentModel(ctx: any): ModelRef {
  try {
    const selected = ctx?.agentDefaultModel?.currentSelection?.()
    return { provider: String(selected?.provider || ''), model: String(selected?.model || ''), temperature: selected?.temperature }
  } catch {
    return { provider: '', model: '' }
  }
}

export async function safeListModelCatalog(ctx: any): Promise<{ groups: CatalogProvider[]; warnings: string[] }> {
  const warnings: string[] = []
  if (!ctx?.llm || typeof ctx.llm.listProviders !== 'function' || typeof ctx.llm.listModels !== 'function') {
    return { groups: [], warnings: ['模型目录接口不可用'] }
  }
  let providers: Array<{ id: string; name: string }> = []
  try {
    providers = (ctx.llm.listProviders() || []).map((item: any) => ({ id: String(item.id || item.provider || ''), name: String(item.name || item.id || item.provider || '') })).filter((item: { id: string; name: string }) => item.id)
  } catch (error) {
    return { groups: [], warnings: [`模型 Provider 目录加载失败：${error instanceof Error ? error.message : String(error)}`] }
  }
  const groups = await Promise.all(providers.map(async provider => {
    try {
      const models = await ctx.llm.listModels(provider.id)
      return { ...provider, models: (models || []).map((model: any) => ({ id: String(model.id || model.model || ''), name: String(model.name || model.id || model.model || '') })).filter((model: { id: string; name: string }) => model.id) }
    } catch (error) {
      warnings.push(`${provider.id} 模型目录加载失败：${error instanceof Error ? error.message : String(error)}`)
      return { ...provider, models: [], error: '模型目录加载失败，可手动输入 ID' }
    }
  }))
  return { groups, warnings }
}

export function listKnownToolNames(tools: any): string[] {
  const candidates = [tools?.names, tools?.list, tools?.all, tools?.registry, tools?._registry, tools?.store]
  for (const candidate of candidates) {
    try {
      const value = typeof candidate === 'function' ? candidate.call(tools) : candidate
      if (Array.isArray(value)) return value.map((item: any) => String(item?.name || item)).filter(Boolean)
      if (value instanceof Map) return Array.from(value.keys()).map(String)
      if (value && typeof value === 'object') return Object.keys(value)
    } catch {}
  }
  return []
}

export function normalizeToolNames(requested: readonly string[]): string[] {
  return Array.from(new Set((requested || []).map(item => LEGACY_TOOL_ALIASES[String(item).trim()] || String(item).trim()).filter(Boolean))).sort()
}

export function resolveToolScope(tools: any, requested: readonly string[]): ToolScopeResult {
  const cleaned = normalizeToolNames(requested)
  const known = listKnownToolNames(tools)
  if (!known.length) return { requested: cleaned, resolved: cleaned, missing: [], knownTools: [] }
  const knownSet = new Set(known)
  const resolved: string[] = []
  const missing: string[] = []
  for (const name of cleaned) {
    if (knownSet.has(name)) {
      resolved.push(name)
      continue
    }
    const aliases = (SEMANTIC_TOOL_ALIASES[name] || []).filter(item => knownSet.has(item))
    if (aliases.length > 0) {
      resolved.push(...aliases)
    } else {
      missing.push(name)
    }
  }
  return { requested: cleaned, resolved: Array.from(new Set(resolved)).sort(), missing, knownTools: known }
}

export function restrictToolsCompat(tools: any, requested: readonly string[]): ToolScopeResult {
  const scope = resolveToolScope(tools, requested)
  if (typeof tools?.restrict !== 'function') return { ...scope, enforcement: 'prompt-only' }
  const applyRestriction = (allow: readonly string[]) => tools.restrict({ allow })
  try {
    const effect = applyRestriction(scope.resolved)
    return { ...scope, effect, enforcement: 'applied' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('requires a scoped context')) {
      return {
        ...scope,
        enforcement: 'prompt-only',
        warning: message,
      }
    }
    const match = message.match(/known global tools: (.+)$/)
    if (!match) throw error
    const known = new Set(match[1].split(',').map(item => item.trim()).filter(Boolean))
    const retried = scope.resolved.filter(name => known.has(name))
    const missing = Array.from(new Set([...scope.missing, ...scope.resolved.filter(name => !known.has(name))])).sort()
    try {
      // Compatibility path is equivalent to tools.restrict({ allow: retried }).
      const effect = applyRestriction(retried)
      return { ...scope, resolved: retried, missing, knownTools: Array.from(known), effect, enforcement: 'applied' }
    } catch (retryError) {
      const retryMessage = retryError instanceof Error ? retryError.message : String(retryError)
      if (retryMessage.includes('requires a scoped context')) {
        return { ...scope, resolved: retried, missing, knownTools: Array.from(known), enforcement: 'prompt-only', warning: retryMessage }
      }
      throw retryError
    }
  }
}


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
    subagents: boolean
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
    workflow: 'dsh-workflow-events' | 'dsh-workflow-run' | 'plugin-workflow-dag'
  }
  warnings: string[]
  optimizations: string[]
}

export function detectDshCompat(ctx: any): DshCompatReport {
  const warnings: string[] = []
  const optimizations: string[] = []
  const projections = typeof ctx?.get === 'function' ? ctx.get('sessionProjections', false) : undefined
  const userQuestions = typeof ctx?.get === 'function' ? ctx.get('userQuestions', false) : undefined
  const bridge = detectDshApprovalWorkflowBridge(ctx)
  const workflowEvents = typeof ctx?.on === 'function' || typeof ctx?.session?.append === 'function'
  const features = {
    llmCatalog: !!ctx?.llm && typeof ctx.llm.listProviders === 'function' && typeof ctx.llm.listModels === 'function',
    currentModel: !!ctx?.agentDefaultModel && typeof ctx.agentDefaultModel.currentSelection === 'function',
    toolRestrict: !!ctx?.tools && typeof ctx.tools.restrict === 'function',
    webServer: !!ctx?.webServer && typeof ctx.webServer.register === 'function',
    agents: !!ctx?.agents && typeof ctx.agents.requireInitiator === 'function',
    subagents: !!ctx?.subagents && typeof ctx.subagents.start === 'function',
    sessionProjections: !!projections,
    sessionProjectionStateOf: !!projections && typeof projections.stateOf === 'function',
    userQuestions: !!userQuestions,
    ...bridge.features,
    workflowEvents,
  }
  if (!features.llmCatalog) warnings.push('DSH llm.listProviders/listModels 不可用；依赖模型目录的操作将被显式阻断。')
  if (!features.currentModel) warnings.push('DSH agentDefaultModel.currentSelection 不可用，将使用空默认模型。')
  if (!features.toolRestrict) warnings.push('DSH tools.restrict 不可用，原生 Subagent 工具权限契约无法执行。')
  if (!features.webServer) warnings.push('DSH webServer.register 不可用，插件 API 无法挂载。')
  if (!features.agents) warnings.push('DSH agents.requireInitiator 不可用，无法取得精确 live parent Agent。')
  if (!features.subagents) warnings.push('DSH subagents.start 不可用，无法执行原生 one-shot assignment。')
  if (features.sessionProjectionStateOf) optimizations.push('DSH sessionProjections.stateOf 可用：优先使用 tokenUsage/sessionStats 官方投影作为账本与延迟数据源。')
  else warnings.push('DSH sessionProjections.stateOf 不可用：官方投影计量不可用，仅保留子 Agent 原生 Session 事件账本。')
  if (features.agents && features.subagents) optimizations.push('DSH 原生 subagents.start 可用：assignment 通过 spawn provider 执行，并继承精确 live parent Agent。')
  if (features.toolRestrict) optimizations.push('DSH 原生 Subagent toolFilter 可用：角色工具白名单由底座强制执行。')
  warnings.push(...bridge.warnings.filter(warning => !warning.startsWith('DSH workflow run seam 不可用')))
  if (workflowEvents) optimizations.push('DSH workflow event seam 可用：使用 tool-workflow/* 记录原生 workflow run 生命周期。')
  else warnings.push('DSH workflow event seam 不可用：无法记录原生 workflow run 生命周期。')
  optimizations.push(...bridge.optimizations)
  const requiredOk = features.llmCatalog && features.currentModel && features.toolRestrict && features.webServer && features.agents && features.subagents
  return {
    ok: requiredOk,
    features,
    bridge,
    sources: {
      ledger: features.sessionProjectionStateOf ? 'dsh-session-projections' : 'event-stream-usage',
      watchdog: 'dsh-runtime-liveness',
      toolEvents: 'dsh-tool-event-adapter',
      approval: bridge.sources.approval,
      workflow: bridge.sources.workflow === 'dsh-workflow-run' ? 'dsh-workflow-run' : workflowEvents ? 'dsh-workflow-events' : 'plugin-workflow-dag',
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


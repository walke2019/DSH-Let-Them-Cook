export interface DshApprovalWorkflowBridgeReport {
  features: {
    nativeApproval: boolean
    nativeApprovalRequest: boolean
    nativeApprovalPolicy: boolean
    nativeWorkflow: boolean
    nativeWorkflowRun: boolean
  }
  sources: {
    approval: 'dsh-user-approval' | 'plugin-transaction-card'
    workflow: 'dsh-workflow-run' | 'plugin-workflow-dag'
  }
  warnings: string[]
  optimizations: string[]
}

function serviceOf(ctx: any, key: string): any {
  try { return ctx?.get?.(key, false) || ctx?.[key] } catch { return ctx?.[key] }
}

export function detectDshApprovalWorkflowBridge(ctx: any): DshApprovalWorkflowBridgeReport {
  const approval = serviceOf(ctx, 'approval')
  const workflow = serviceOf(ctx, 'workflow') || serviceOf(ctx, 'workflows') || serviceOf(ctx, 'workflowRun')
  const features = {
    nativeApproval: !!approval,
    nativeApprovalRequest: !!approval && typeof approval.request === 'function',
    nativeApprovalPolicy: !!approval && (typeof approval.effectivePolicy === 'function' || typeof approval.setApprovalPolicy === 'function'),
    nativeWorkflow: !!workflow,
    nativeWorkflowRun: !!workflow && (typeof workflow.run === 'function' || typeof workflow.start === 'function' || typeof workflow.createRun === 'function'),
  }
  const warnings: string[] = []
  const optimizations: string[] = []
  const sources = {
    approval: features.nativeApprovalRequest ? 'dsh-user-approval' as const : 'plugin-transaction-card' as const,
    workflow: features.nativeWorkflowRun ? 'dsh-workflow-run' as const : 'plugin-workflow-dag' as const,
  }
  if (features.nativeApprovalRequest) {
    optimizations.push('DSH approval.request 可用：群聊确认后执行事务可记录为 DSH 原生 approval seam 引用；插件仍保留业务语义卡片。')
  } else {
    warnings.push('DSH approval.request 不可用或当前上下文不可用：确认后执行事务保持插件内 transaction card，不伪装为 native approval。')
  }
  if (features.nativeWorkflowRun) {
    optimizations.push('DSH workflow run seam 可用：群聊阶段推进可附加 native workflow run reference。')
  } else {
    warnings.push('DSH workflow run seam 不可用：群聊阶段推进保持插件内 workflow DAG，不伪装为 native workflow。')
  }
  return { features, sources, warnings, optimizations }
}

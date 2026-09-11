import type {AgentProfile, AgentOrchestrationStrategy, PendingAutoSetupDraft, WorkflowDefinition} from '../types.js'
import {createThemeDraft, createWorkflowDraft} from './theme-factory.js'

export type AutoSetupIntent =
  | {kind:'none'}
  | {kind:'confirm'}
  | {kind:'cancel'}
  | {kind:'clarify'; question:string}
  | {kind:'draft'; brief:string; reason:string}

const SETUP_HINTS = [
  '创建角色','生成角色','造角色','角色和工作流','工作流和角色','生成工作流','创建工作流',
  '帮我配置','帮我搭一套','搭一套','项目小队','agent小队','ai小队','自动创建',
  '根据我的任务','自由度','少设置','默认处理机制','主题角色',
]
const CONFIRM_WORDS = ['确认创建','确认套用','确认应用','确认写入','就这样','可以写入','应用草案','套用草案']
const CANCEL_WORDS = ['取消创建','取消套用','取消应用','别写入','不要了','作废草案','取消草案']

export function createMasterSubagentStrategy(members: AgentProfile[]): AgentOrchestrationStrategy {
  const master = members.find(m => m.id === 'commander')?.id || members[0]?.id || 'commander'
  return {masterAgentId: master, subAgentIds: members.filter(m => m.id !== master).map(m => m.id), strategy: 'master_subagents'}
}

export function classifyAutoSetupIntent(content: string, hasPendingDraft: boolean): AutoSetupIntent {
  const text = content.trim()
  const compact = text.replace(/\s+/g, '')
  if (!text) return {kind:'none'}
  if (hasPendingDraft && CONFIRM_WORDS.some(word => compact.includes(word))) return {kind:'confirm'}
  if (hasPendingDraft && CANCEL_WORDS.some(word => compact.includes(word))) return {kind:'cancel'}
  if (hasPendingDraft && /补充|修改|改成|换成|再加|少一点|多一点/.test(compact)) return {kind:'draft', brief: text, reason:'用户补充了待确认草案'}

  const hasSetupHint = SETUP_HINTS.some(word => compact.includes(word))
  if (!hasSetupHint) return {kind:'none'}

  const tooVague = compact.length < 18 || /^(帮我)?(创建|生成|造|配置)?(一套)?(角色|工作流|角色和工作流|agent小队)$/.test(compact)
  if (tooVague) {
    return {kind:'clarify', question:'我可以先帮你生成一套「主 Agent + SubAgent」角色与工作流草案。先补一句：这个工作区主要要完成什么任务？例如：修复插件 UI、做数据采集、写运营文案、搭网站。'}
  }
  return {kind:'draft', brief: text, reason:'检测到用户想减少设置并自动生成角色/工作流'}
}

export function buildAutoSetupDraft(brief: string, baseMembers: AgentProfile[]): PendingAutoSetupDraft {
  const members = createThemeDraft(brief || '沙雕但靠谱的工作区项目小队', baseMembers)
  const workflow = createWorkflowDraft(brief || '当前工作区任务')
  const orchestration = createMasterSubagentStrategy(members)
  return {id:`autosetup_${Date.now()}`, brief, members, workflow, orchestration, createdAt:Date.now(), status:'awaiting_confirmation'}
}

export function formatAutoSetupDraft(draft: PendingAutoSetupDraft): string {
  const master = draft.members.find(m => m.id === draft.orchestration.masterAgentId)
  const subagents = draft.orchestration.subAgentIds.map(id => draft.members.find(m => m.id === id)?.name || id)
  const roleLines = draft.members.map(m => `- ${m.avatar} **${m.name}**（@${m.id}）：${m.title || m.roleDescription}`).join('\n')
  const workflowLines = draft.workflow.stages.map((s, i) => `- ${i + 1}. **${s.name}**：${s.description}  \n  责任：${s.assignedRoleIds.join(' / ')}${s.requiresApproval ? ' · 需主 Agent 确认' : ''}`).join('\n')
  return `我理解你是想少配设置，直接按任务生成一套工作区专属协同配置。\n\n**待确认草案：角色 + 工作流**\n\n**主 Agent 策略**\n- 主 Agent：${master?.avatar || '🎯'} **${master?.name || draft.orchestration.masterAgentId}**（${draft.orchestration.masterAgentId}）\n- SubAgent：${subagents.join(' / ')}\n- 执行方式：中间对话由主 Agent 先理解意图；需要专业产出时按工作流唤醒 SubAgent；不理解时先追问，不直接乱跑。\n\n**角色草案**\n${roleLines}\n\n**工作流草案：${draft.workflow.title}**\n${workflowLines}\n\n回复 **确认创建** 后写入当前工作区；回复 **取消创建** 放弃；也可以直接补充修改要求，我会重生成草案。`
}

export function formatAutoSetupApplied(workflow: WorkflowDefinition, strategy: AgentOrchestrationStrategy): string {
  return `已写入当前工作区配置。\n\n- 调度模式：工作流驱动\n- 主 Agent：${strategy.masterAgentId}\n- SubAgent：${strategy.subAgentIds.join(' / ')}\n- 工作流：${workflow.title}\n\n之后你直接在中间对话区说任务即可；如果意图不清，主 Agent 会先追问再推进。`
}

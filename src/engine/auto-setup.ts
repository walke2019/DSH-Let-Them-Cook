import type {AgentProfile, AgentOrchestrationStrategy, PendingAutoSetupDraft, RoleModelHint, ToolRoutingPolicy, WorkflowDefinition} from '../types.js'
import type {GroupChatLocale} from '../client/i18n.js'
import {createThemeDraft, createWorkflowDraft} from './theme-factory.js'
import {getThemeVoice} from './theme-voice.js'

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
  'create roles','generate roles','roles and workflow','workflow and roles','create workflow','generate workflow',
  'set up agents','agent squad','ai squad','project squad','auto setup','based on my task','default handling',
]

const CONFIRM_WORDS = ['确认创建','确认套用','确认应用','确认写入','就这样','可以写入','应用草案','套用草案','confirm setup','apply setup','confirm draft','apply draft','looks good','save setup']
const CANCEL_WORDS = ['取消创建','取消套用','取消应用','别写入','不要了','作废草案','取消草案','cancel setup','cancel draft','discard setup','discard draft']
const EXECUTION_HINTS = [
  '进入真实开发流程','开发任务','当前工作流','启动第一阶段','执行当前','继续执行','检查','补齐','修复','测试','验收','派发',
]

export const DEFAULT_TOOL_ROUTING_POLICY: ToolRoutingPolicy = {
  webSearchOwner: 'researcher',
  crawlOwner: 'researcher',
  dataExtractionOwner: 'researcher',
  backendCodeOwner: 'backend',
  frontendCodeOwner: 'frontend',
  uiDebugOwner: 'frontend',
  qaOwner: 'qa',
  docsOwner: 'writer',
  reducerOwner: 'commander',
  allowStageParallelism: true,
  forbidDuplicateToolRace: true,
}

export const DEFAULT_ROLE_MODEL_HINTS: Record<string, RoleModelHint> = {
  commander: {requiredCapabilities:['reasoning','long_context'], preferredCapabilities:['qa_audit','tool_use'], costPreference:'quality_first', latencyPreference:'patient', fallbackStrategy:'same_capability_cheaper'},
  researcher: {requiredCapabilities:['web_research','tool_use','data_extraction'], preferredCapabilities:['long_context','reasoning'], costPreference:'balanced', latencyPreference:'normal', fallbackStrategy:'same_capability_cheaper'},
  backend: {requiredCapabilities:['coding','reasoning','tool_use'], preferredCapabilities:['long_context'], costPreference:'quality_first', latencyPreference:'normal', fallbackStrategy:'same_capability_cheaper'},
  frontend: {requiredCapabilities:['coding','ui_design'], preferredCapabilities:['tool_use','fast_reply'], costPreference:'balanced', latencyPreference:'normal', fallbackStrategy:'same_capability_cheaper'},
  qa: {requiredCapabilities:['qa_audit','reasoning'], preferredCapabilities:['coding','long_context'], costPreference:'balanced', latencyPreference:'patient', fallbackStrategy:'same_capability_cheaper'},
  writer: {requiredCapabilities:['writing','fast_reply'], preferredCapabilities:['long_context','low_cost'], costPreference:'low', latencyPreference:'fast', fallbackStrategy:'same_capability_cheaper'},
}

export function attachRoleModelHints(members: AgentProfile[]): AgentProfile[] {
  return members.map(member => ({...member, modelHint: DEFAULT_ROLE_MODEL_HINTS[member.id] || DEFAULT_ROLE_MODEL_HINTS.writer}))
}

export function createMasterSubagentStrategy(members: AgentProfile[]): AgentOrchestrationStrategy {
  const master = members.find(m => m.id === 'commander')?.id || members[0]?.id || 'commander'
  return {
    masterAgentId: master,
    subAgentIds: members.filter(m => m.id !== master).map(m => m.id),
    strategy: 'master_subagents',
    toolRoutingPolicy: DEFAULT_TOOL_ROUTING_POLICY,
    modelHints: DEFAULT_ROLE_MODEL_HINTS,
  }
}

export function classifyAutoSetupIntent(content: string, hasPendingDraft: boolean, locale: GroupChatLocale = 'zh-CN'): AutoSetupIntent {
  const text = content.trim()
  const compact = text.replace(/\s+/g, '')
  const lowerText = text.toLowerCase()
  const compactLower = compact.toLowerCase()
  if (!text) return {kind:'none'}
  if (hasPendingDraft && CONFIRM_WORDS.some(word => compactLower.includes(word.replace(/\s+/g, '')))) return {kind:'confirm'}
  if (hasPendingDraft && CANCEL_WORDS.some(word => compactLower.includes(word.replace(/\s+/g, '')))) return {kind:'cancel'}
  if (hasPendingDraft && /补充|修改|改成|换成|再加|少一点|多一点|edit|change|add|remove|less|more|revise|adjust/i.test(text)) return {kind:'draft', brief: text, reason: locale === 'en-US' ? 'User updated the pending setup draft' : '用户补充了待确认草案'}

  const hasSetupHint = SETUP_HINTS.some(word => compactLower.includes(word.replace(/\s+/g, '')))

  // Auto-setup guard: execution messages bypass draft generation and continue through the dispatcher.
  // Auto-setup guard: execution messages bypass draft generation and continue through the dispatcher.
  if (!hasPendingDraft && /^@[^\s]+/.test(text)) return {kind:'none'}
  if (!hasPendingDraft && !hasSetupHint && EXECUTION_HINTS.some(word => compact.includes(word))) return {kind:'none'}

  if (!hasSetupHint) return {kind:'none'}

  const tooVague = compact.length < 18 || /^(帮我)?(创建|生成|造|配置)?(一套)?(角色|工作流|角色和工作流|agent小队)$/.test(compact) || /^(create|generate|setup|set up)?\s*(roles?|workflow|roles? and workflow|agent squad)$/i.test(text.trim())
  if (tooVague) {
    const voice = getThemeVoice('meme_comedy', locale)
    return {kind:'clarify', question: locale === 'en-US'
      ? `${voice.clarifyPrefix}\n\nI can draft a “Master Agent + SubAgent” role set and workflow first. Add one sentence: what should this workspace mainly deliver? For example: fix plugin UI, collect data, write campaign copy, or build a website.`
      : `${voice.clarifyPrefix}\n\n我可以先帮你生成一套「主 Agent + SubAgent」角色与工作流草案。先补一句：这个工作区主要要完成什么任务？例如：修复插件 UI、做数据采集、写运营文案、搭网站。`}
  }
  return {kind:'draft', brief: text, reason:'检测到用户想减少设置并自动生成角色/工作流'}
}

export function buildAutoSetupDraft(brief: string, baseMembers: AgentProfile[], locale: GroupChatLocale = 'zh-CN'): PendingAutoSetupDraft {
  const members = attachRoleModelHints(createThemeDraft(brief || (locale === 'en-US' ? 'a chaotic but reliable workspace project squad' : '沙雕但靠谱的工作区项目小队'), baseMembers, locale))
  const workflow = createWorkflowDraft(brief || (locale === 'en-US' ? 'current workspace task' : '当前工作区任务'), locale)
  const orchestration = createMasterSubagentStrategy(members)
  return {id:`autosetup_${Date.now()}`, brief, members, workflow, orchestration, createdAt:Date.now(), status:'awaiting_confirmation'}
}

export function formatAutoSetupDraft(draft: PendingAutoSetupDraft, theme: import('../types.js').PersonaThemeKey = 'meme_comedy', locale: GroupChatLocale = 'zh-CN'): string {
  const voice = getThemeVoice(theme, locale)
  const master = draft.members.find(m => m.id === draft.orchestration.masterAgentId)
  const subagents = draft.orchestration.subAgentIds.map(id => draft.members.find(m => m.id === id)?.name || id)
  const roleLines = draft.members.map(m => locale === 'en-US' ? `- ${m.avatar} **${m.name}** (@${m.id}): ${m.title || m.roleDescription}` : `- ${m.avatar} **${m.name}**（@${m.id}）：${m.title || m.roleDescription}`).join('\n')
  const workflowLines = draft.workflow.stages.map((s, i) => locale === 'en-US' ? `- ${i + 1}. **${s.name}**: ${s.description}  \n  Owners: ${s.assignedRoleIds.join(' / ')}${s.requiresApproval ? ' · Master Agent approval required' : ''}` : `- ${i + 1}. **${s.name}**：${s.description}  \n  责任：${s.assignedRoleIds.join(' / ')}${s.requiresApproval ? ' · 需主 Agent 确认' : ''}`).join('\n')
  const route = draft.orchestration.toolRoutingPolicy
  if (locale === 'en-US') return `${voice.draftIntro}\n\n**Pending draft: roles + workflow**\n\n**Master Agent strategy**\n- Master Agent: ${master?.avatar || '🎯'} **${master?.name || draft.orchestration.masterAgentId}** (${draft.orchestration.masterAgentId})\n- SubAgents: ${subagents.join(' / ')}\n- Execution: the center chat lets the Master Agent understand intent first; when specialist work is needed, it wakes SubAgents through the workflow; if unclear, it asks before running.
- Stage parallelism: keep DSH workflow parallelism for multiple Agents assigned to the same stage.
- Tool routing: search/crawl → ${route.webSearchOwner}; backend code → ${route.backendCodeOwner}; frontend/UI → ${route.frontendCodeOwner}; QA → ${route.qaOwner}; docs → ${route.docsOwner}; final synthesis → ${route.reducerOwner}.\n\n**Role draft**\n${roleLines}\n\n**Workflow draft: ${draft.workflow.title}**\n${workflowLines}\n\nReply **Confirm setup** to write into this workspace; reply **Cancel setup** to discard; or send more edits and I will regenerate the draft.`
  return `${voice.draftIntro}\n\n**待确认草案：角色 + 工作流**\n\n**主 Agent 策略**\n- 主 Agent：${master?.avatar || '🎯'} **${master?.name || draft.orchestration.masterAgentId}**（${draft.orchestration.masterAgentId}）\n- SubAgent：${subagents.join(' / ')}\n- 执行方式：中间对话由主 Agent 先理解意图；需要专业产出时按工作流唤醒 SubAgent；不理解时先追问，不直接乱跑。
- 阶段并发：保留 DSH workflow 同阶段多 Agent 并发。
- 工具归口：搜索/爬取 → ${route.webSearchOwner}；后端代码 → ${route.backendCodeOwner}；前端/UI → ${route.frontendCodeOwner}；QA → ${route.qaOwner}；文档 → ${route.docsOwner}；最终收口 → ${route.reducerOwner}。\n\n**角色草案**\n${roleLines}\n\n**工作流草案：${draft.workflow.title}**\n${workflowLines}\n\n回复 **确认创建** 后写入当前工作区；回复 **取消创建** 放弃；也可以直接补充修改要求，我会重生成草案。`
}

export function formatAutoSetupApplied(workflow: WorkflowDefinition, strategy: AgentOrchestrationStrategy, theme: import('../types.js').PersonaThemeKey = 'meme_comedy', locale: GroupChatLocale = 'zh-CN'): string {
  const voice = getThemeVoice(theme, locale)
  if (locale === 'en-US') return `${voice.appliedTitle}\n\n- Dispatch mode: workflow-driven\n- Master Agent: ${strategy.masterAgentId}\n- SubAgents: ${strategy.subAgentIds.join(' / ')}\n- Workflow: ${workflow.title}
- Stage parallelism: kept
- Tool routing: search/crawl to researcher, code to backend/frontend, tests to qa, docs to writer, final synthesis to commander\n\n${voice.appliedHint}`
  return `${voice.appliedTitle}\n\n- 调度模式：工作流驱动\n- 主 Agent：${strategy.masterAgentId}\n- SubAgent：${strategy.subAgentIds.join(' / ')}\n- 工作流：${workflow.title}
- 阶段内并发：保留
- 工具路由：搜索/爬取给 researcher，代码给 backend/frontend，测试给 qa，文档给 writer，commander 收口\n\n${voice.appliedHint}`
}

export function formatAutoSetupCancelled(theme: import('../types.js').PersonaThemeKey = 'meme_comedy', locale: GroupChatLocale = 'zh-CN'): string {
  return getThemeVoice(theme, locale).cancelledText
}

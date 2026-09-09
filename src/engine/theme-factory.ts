import type {AgentProfile, RoleThemeMapping, WorkflowDefinition} from '../types.js'
import type {GroupChatLocale} from '../client/i18n.js'

const AVATARS = ['🧃','🍉','🍳','🪩','🧨','🧻','🛵','🐟','🥤','🧋','🎲','🧠']
const ROLE_FLAVOR: Record<string, {label:string; duty:string; jokes:string[]}> = {
  commander: {label:'总控', duty:'把目标拆清楚、节奏控住、结论收口', jokes:['全场唯一不许跑题的人','负责把离谱变靠谱','专治战略性迷路']},
  researcher: {label:'情报', duty:'先查证再开麦，把背景和证据讲明白', jokes:['瓜田里最冷静的猹','截图和出处收纳大师','谣言过滤器']},
  backend: {label:'底座', duty:'把逻辑、状态、接口和异常处理搭稳', jokes:['锅来我接但锅底不能糊','接口炼丹但不炸炉','数据库门口保安']},
  frontend: {label:'门面', duty:'把交互、布局、反馈和可读性打磨成人能用', jokes:['像素级显眼包','按钮心理辅导师','审美急救医生']},
  qa: {label:'挑刺', duty:'专找边界、坏路、异常和反常识操作', jokes:['我就是那个乱点的人','bug 的气氛组','专治应该没问题']},
  writer: {label:'人话', duty:'把过程和结论沉淀成清楚、有用、不油的文档', jokes:['废话压缩机','黑话翻译官','会议纪要灭火器']},
}

const ROLE_FLAVOR_EN: Record<string, {label:string; duty:string; jokes:string[]}> = {
  commander: {label:'Lead', duty:'clarifies goals, controls tempo, and closes decisions', jokes:['the one person not allowed to wander off','turns chaos into a plan','treats strategic confusion as a bug']},
  researcher: {label:'Scout', duty:'checks facts before speaking and explains evidence clearly', jokes:['calmest raccoon in the data dumpster','collector of receipts and links','rumor filter with legs']},
  backend: {label:'Core', duty:'keeps logic, state, APIs, and failure handling solid', jokes:['catches the pot but refuses burnt bottoms','brews APIs without explosions','database gate bouncer']},
  frontend: {label:'Face', duty:'polishes interaction, layout, feedback, and readability', jokes:['pixel-level attention gremlin','button therapist','emergency aesthetic medic']},
  qa: {label:'Breaker', duty:'hunts edges, bad paths, exceptions, and weird user moves', jokes:['professional random clicker','bug party host','specialist in “should be fine” disasters']},
  writer: {label:'PlainTalk', duty:'turns process and conclusions into clear useful docs', jokes:['fluff compressor','jargon translator','meeting-notes firefighter']},
}

function pick(seed: string, list: string[], offset=0) {
  let n = offset
  for (const ch of seed) n = (n * 33 + ch.charCodeAt(0)) >>> 0
  return list[n % list.length]
}

function deriveThemePrefix(brief: string): string {
  const compact = brief
    .replace(/请把|请将|帮我|需要|作为一个开发任务来处理|作为开发任务|先根据当前项目情况|用户确认后再写入|这个|扩展|插件|功能|业务|支持|所有|当前|项目|情况|生成|角色|工作流|草案/g, '')
    .replace(/[\s，。,.!！?？、：:；;（）()【】\[\]{}\/\-]+/g, '')
  if (/中英|中\/英|英文|双语|i18n|国际化|en-US|zh-CN/i.test(brief)) return '双语'
  if (/本地化|多语言|locale|language/i.test(brief)) return '语境'
  if (/UI|界面|前端|交互/i.test(brief)) return '门面'
  if (/搜索|调研|爬取/i.test(brief)) return '情报'
  if (/文档|说明|手册/i.test(brief)) return '文档'
  return compact.slice(0, 4) || '整活'
}

function deriveThemePrefixEn(brief: string): string {
  const compact = brief
    .replace(/please|create|generate|set up|setup|roles?|workflow|agents?|squad|plugin|extension|feature|project|current|business|support|all|task|draft/gi, '')
    .replace(/[\s，。,.!！?？、：:；;（）()【】\[\]{}\/\-]+/g, '')
  if (/bilingual|i18n|internationali[sz]ation|locale|language|en-US|zh-CN/i.test(brief)) return 'Bilingual'
  if (/UI|interface|frontend|interaction/i.test(brief)) return 'UI'
  if (/search|research|crawl|scrape/i.test(brief)) return 'Intel'
  if (/docs?|manual|readme|copy/i.test(brief)) return 'Docs'
  return compact.slice(0, 10) || 'MemeOps'
}

export function buildHumanSystemPrompt(baseRole: AgentProfile, mapping: RoleThemeMapping, worldBrief: string, locale: GroupChatLocale = 'zh-CN'): string {
  if (locale === 'en-US') return `You are the group-chat team's [${baseRole.title || mapping.title}] (${mapping.name}).\nWorld/theme: ${worldBrief || 'a fun but reliable multi-Agent project squad'}\nCatchphrase: "${mapping.catchphrase}"\nOutput style: plain human language first; a little personality is welcome, but do not let roleplay bury the answer. Keep conclusions short, precise, and executable.\nCore duty: ${baseRole.roleDescription}\nCollaboration rule: be serious when needed, joke lightly when useful, and make every message move the task forward.`
  return `你是群聊团队的【${baseRole.title || mapping.title}】(${mapping.name})。\n世界观/主题：${worldBrief || '轻松有趣但交付靠谱的多 Agent 小队'}\n口头禅: "${mapping.catchphrase}"\n输出风格：先说人话，少端架子；可以有轻微梗和人格，但不要喧宾夺主；结论要短、准、可执行。\n你的核心职责：${baseRole.roleDescription}\n协作要求：该认真时认真，该吐槽时点到为止；每次发言都要推进任务，不要为了角色扮演水字数。`
}

export function createThemeDraft(worldBrief: string, members: AgentProfile[], locale: GroupChatLocale = 'zh-CN') {
  const brief = worldBrief.trim() || (locale === 'en-US' ? 'a chaotic but professional project squad' : '沙雕但专业的项目小队')
  return members.map((member, i) => {
    const flavor = (locale === 'en-US' ? ROLE_FLAVOR_EN[member.id] : ROLE_FLAVOR[member.id]) || (locale === 'en-US' ? ROLE_FLAVOR_EN.writer : ROLE_FLAVOR.writer)
    const joke = pick(`${brief}:${member.id}`, flavor.jokes, i)
    const namePrefix = locale === 'en-US' ? deriveThemePrefixEn(brief) : deriveThemePrefix(brief)
    const mapping: RoleThemeMapping = {
      roleKey: member.id,
      name: locale === 'en-US' ? `${namePrefix} ${flavor.label}` : `${namePrefix}${flavor.label}官`,
      avatar: pick(`${brief}:avatar:${member.id}`, AVATARS, i),
      color: member.color || ['#ef4444','#06b6d4','#3b82f6','#ec4899','#f59e0b','#10b981'][i % 6],
      title: `${flavor.duty} · ${joke}`,
      catchphrase: locale === 'en-US' ? `${joke}, but the delivery still has to land.` : `${joke}，但活儿必须交得漂亮。`,
    }
    return { ...member, name: mapping.name, avatar: mapping.avatar, color: mapping.color, title: mapping.title, systemPrompt: buildHumanSystemPrompt(member, mapping, brief, locale), groupChatRules: {...member.groupChatRules, mentionKeywords: Array.from(new Set([`@${member.id}`, `@${mapping.name}`, ...(member.groupChatRules.mentionKeywords || [])]))} }
  })
}


function stageTitle(brief: string, fallback: string): string {
  const compact = brief.replace(/[\s\n\r]+/g, '').slice(0, 10)
  return compact ? `${fallback}：${compact}` : fallback
}

export function createWorkflowDraft(projectBrief: string, locale: GroupChatLocale = 'zh-CN'): WorkflowDefinition {
  const brief = projectBrief.trim() || (locale === 'en-US' ? 'current project task' : '当前项目任务')
  const now = Date.now()
  const productLike = /产品|应用|网站|插件|系统|平台|小程序|app|web|扩展|工具|product|app|website|plugin|system|platform|extension|tool/i.test(brief)
  const contentLike = /文案|文章|视频|脚本|故事|角色|世界观|运营|营销|copy|article|video|script|story|persona|world|marketing/i.test(brief)
  const auditName = locale === 'en-US' ? (productLike ? 'Break edges and accept UX' : contentLike ? 'Plain-language style review' : 'Quality nitpick and delivery review') : productLike ? '边界爆破与体验验收' : contentLike ? '人话校对与风格验收' : '质量挑刺与交付验收'
  if (locale === 'en-US') return {
    id: `wf_custom_${now}`,
    title: `${stageTitle(brief, 'AI custom workflow')} · chaotic-but-reliable edition`,
    currentStageIndex: 0,
    stages: [
      {id:'custom_stage_1_brief',name:'Make the goal human-readable',description:`Clarify goal, audience, boundaries, success criteria, and traps for “${brief}”.`,assignedRoleIds:['commander','researcher'],status:'in_progress',requiresApproval:false},
      {id:'custom_stage_2_plan',name:'Split the work, not the house',description:'Turn the task into executable items with dependencies, role ownership, and a minimum shippable version.',assignedRoleIds:['commander','backend','frontend'],status:'pending',requiresApproval:true},
      {id:'custom_stage_3_make',name: productLike ? 'Build the prototype' : contentLike ? 'Cook the content' : 'Make the first solution',description:'Produce the first version by role, keep key tradeoffs visible, and prefer verifiable artifacts over vague talk.',assignedRoleIds:['backend','frontend','writer'],status:'pending',requiresApproval:true},
      {id:'custom_stage_4_audit',name:auditName,description:'Challenge it from user perspective and weird paths; list must-fix, should-fix, and can-wait items.',assignedRoleIds:['qa','commander'],status:'pending',requiresApproval:true},
      {id:'custom_stage_5_ship',name:'Wrap it up without a cliffhanger',description:'Prepare final notes, usage, changelog, and next-step suggestions so the user can keep going.',assignedRoleIds:['writer','commander'],status:'pending',requiresApproval:true},
    ],
  }
  return {
    id: `wf_custom_${now}`,
    title: `${stageTitle(brief, 'AI 定制工作流')} · 沙雕但靠谱版`,
    currentStageIndex: 0,
    stages: [
      {id:'custom_stage_1_brief',name:'先把话说人话',description:`围绕「${brief}」澄清目标、受众、边界、成功标准和不该做的坑。`,assignedRoleIds:['commander','researcher'],status:'in_progress',requiresApproval:false},
      {id:'custom_stage_2_plan',name:'拆活别拆家',description:'把任务拆成可执行清单，明确前后依赖、角色分工和最小可交付版本。',assignedRoleIds:['commander','backend','frontend'],status:'pending',requiresApproval:true},
      {id:'custom_stage_3_make',name: productLike ? '原型开整' : contentLike ? '内容开炖' : '方案开工',description:'按分工产出第一版结果，保留关键取舍，少空话，多可验证产物。',assignedRoleIds:['backend','frontend','writer'],status:'pending',requiresApproval:true},
      {id:'custom_stage_4_audit',name:auditName,description:'从用户视角和反常识路径挑刺，列出必须改、建议改、可以先不改。',assignedRoleIds:['qa','commander'],status:'pending',requiresApproval:true},
      {id:'custom_stage_5_ship',name:'收口交付别烂尾',description:'整理最终说明、使用方式、变更记录和下一步建议，给用户一个能接着用的交付结果。',assignedRoleIds:['writer','commander'],status:'pending',requiresApproval:true},
    ],
  }
}


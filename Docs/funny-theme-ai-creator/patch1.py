from pathlib import Path
# types
p=Path('src/types.ts')
s=p.read_text(encoding='utf-8')
s=s.replace("export type PersonaThemeKey = 'modern' | 'three_kingdoms' | 'legends'", "export type PersonaThemeKey = 'modern' | 'three_kingdoms' | 'legends' | 'meme_comedy' | `custom_${string}`")
p.write_text(s,encoding='utf-8')
# themes add meme before closing
p=Path('src/engine/themes.ts')
s=p.read_text(encoding='utf-8')
s=s.replace('支持现代经典、三国风云、现代传奇三大主题','支持现代经典、三国风云、现代传奇、沙雕整活与自定义主题')
block=r'''

  meme_comedy: {
    commander: { roleKey: 'commander', name: '离谱总导演', avatar: '🧃', color: '#ef4444', title: '全局控场·拒绝尬住', catchphrase: '先别急着开香槟，剧本我来控，锅也别乱飞！' },
    researcher: { roleKey: 'researcher', name: '瓜田侦探', avatar: '🍉', color: '#06b6d4', title: '吃瓜不信瓜·证据挖掘机', catchphrase: '没有截图的瓜先放冷藏，证据链给我端上来。' },
    backend: { roleKey: 'backend', name: '后端锅王', avatar: '🍳', color: '#3b82f6', title: '背锅但不糊锅·接口炼丹师', catchphrase: '锅可以背，bug 不能留；接口先稳住别炸锅。' },
    frontend: { roleKey: 'frontend', name: '像素显眼包', avatar: '🪩', color: '#ec4899', title: '好看能打·按钮别乱蹦', catchphrase: '这 UI 得像奶茶第一口：顺、亮、还有点上头。' },
    qa: { roleKey: 'qa', name: '阴间测试员', avatar: '🧨', color: '#f59e0b', title: '专治侥幸·边界爆破', catchphrase: '你说不会有人这么点？我就是那个人。' },
    writer: { roleKey: 'writer', name: '废话压缩师', avatar: '🧻', color: '#10b981', title: '人话翻译·文档去油', catchphrase: '把黑话榨干，把人话留下，顺手加点灵魂。' },
  },
'''
s=s.replace('\n}', block+'\n}')
p.write_text(s,encoding='utf-8')
# create custom theme generator
p=Path('src/engine/theme-factory.ts')
p.write_text(r'''import type {AgentProfile, RoleThemeMapping} from '../types.js'

const AVATARS = ['🧃','🍉','🍳','🪩','🧨','🧻','🛵','🐟','🥤','🧋','🎲','🧠']
const ROLE_FLAVOR: Record<string, {label:string; duty:string; jokes:string[]}> = {
  commander: {label:'总控', duty:'把目标拆清楚、节奏控住、结论收口', jokes:['全场唯一不许跑题的人','负责把离谱变靠谱','专治战略性迷路']},
  researcher: {label:'情报', duty:'先查证再开麦，把背景和证据讲明白', jokes:['瓜田里最冷静的猹','截图和出处收纳大师','谣言过滤器']},
  backend: {label:'底座', duty:'把逻辑、状态、接口和异常处理搭稳', jokes:['锅来我接但锅底不能糊','接口炼丹但不炸炉','数据库门口保安']},
  frontend: {label:'门面', duty:'把交互、布局、反馈和可读性打磨成人能用', jokes:['像素级显眼包','按钮心理辅导师','审美急救医生']},
  qa: {label:'挑刺', duty:'专找边界、坏路、异常和反常识操作', jokes:['我就是那个乱点的人','bug 的气氛组','专治应该没问题']},
  writer: {label:'人话', duty:'把过程和结论沉淀成清楚、有用、不油的文档', jokes:['废话压缩机','黑话翻译官','会议纪要灭火器']},
}

function pick(seed: string, list: string[], offset=0) {
  let n = offset
  for (const ch of seed) n = (n * 33 + ch.charCodeAt(0)) >>> 0
  return list[n % list.length]
}

export function buildHumanSystemPrompt(baseRole: AgentProfile, mapping: RoleThemeMapping, worldBrief: string): string {
  return `你是群聊团队的【${baseRole.title || mapping.title}】(${mapping.name})。\n世界观/主题：${worldBrief || '轻松有趣但交付靠谱的多 Agent 小队'}\n口头禅: "${mapping.catchphrase}"\n输出风格：先说人话，少端架子；可以有轻微梗和人格，但不要喧宾夺主；结论要短、准、可执行。\n你的核心职责：${baseRole.roleDescription}\n协作要求：该认真时认真，该吐槽时点到为止；每次发言都要推进任务，不要为了角色扮演水字数。`
}

export function createThemeDraft(worldBrief: string, members: AgentProfile[]) {
  const brief = worldBrief.trim() || '沙雕但专业的项目特遣队'
  return members.map((member, i) => {
    const flavor = ROLE_FLAVOR[member.id] || ROLE_FLAVOR.writer
    const joke = pick(`${brief}:${member.id}`, flavor.jokes, i)
    const namePrefix = brief.replace(/[\s，。,.!！?？、：:；;（）()【】\[\]{}]/g,'').slice(0,4) || '整活'
    const mapping: RoleThemeMapping = {
      roleKey: member.id,
      name: `${namePrefix}${flavor.label}官`,
      avatar: pick(`${brief}:avatar:${member.id}`, AVATARS, i),
      color: member.color || ['#ef4444','#06b6d4','#3b82f6','#ec4899','#f59e0b','#10b981'][i % 6],
      title: `${flavor.duty} · ${joke}`,
      catchphrase: `${joke}，但活儿必须交得漂亮。`,
    }
    return { ...member, name: mapping.name, avatar: mapping.avatar, color: mapping.color, title: mapping.title, systemPrompt: buildHumanSystemPrompt(member, mapping, brief), groupChatRules: {...member.groupChatRules, mentionKeywords: Array.from(new Set([`@${member.id}`, `@${mapping.name}`, ...(member.groupChatRules.mentionKeywords || [])]))} }
  })
}
''',encoding='utf-8')

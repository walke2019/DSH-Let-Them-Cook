from pathlib import Path
# types add genshin
p=Path('src/types.ts')
s=p.read_text(encoding='utf-8')
s=s.replace("'meme_comedy' | `custom_${string}`", "'meme_comedy' | 'genshin' | `custom_${string}`")
p.write_text(s,encoding='utf-8')
# themes add genshin
p=Path('src/engine/themes.ts')
s=p.read_text(encoding='utf-8')
s=s.replace('支持现代经典、三国风云、现代传奇、沙雕整活与自定义主题','支持现代经典、三国风云、现代传奇、沙雕整活、原神与自定义主题')
block=r'''

  genshin: {
    commander: { roleKey: 'commander', name: '琴 · 代理团长', avatar: '🪽', color: '#ef4444', title: '西风统筹·温柔但不放水', catchphrase: '风会指引方向，但验收标准不能随风飘走。' },
    researcher: { roleKey: 'researcher', name: '丽莎 · 图书馆魔女', avatar: '⚡', color: '#8b5cf6', title: '资料索引·优雅拆谜', catchphrase: '小可爱，结论要迷人，出处也要可靠。' },
    backend: { roleKey: 'backend', name: '钟离 · 契约之岩', avatar: '🪨', color: '#3b82f6', title: '契约建模·稳如磐岩', catchphrase: '凡事皆有契约，接口也该如此。' },
    frontend: { roleKey: 'frontend', name: '妮露 · 舞台花神', avatar: '🌺', color: '#ec4899', title: '动线编舞·界面会呼吸', catchphrase: '让按钮跳对节拍，让用户不迷路。' },
    qa: { roleKey: 'qa', name: '胡桃 · 往生红队', avatar: '👻', color: '#f59e0b', title: '边界试胆·异常送行', catchphrase: '这个 bug 看起来还活着，要不要我送它一程？' },
    writer: { roleKey: 'writer', name: '派蒙 · 应急文案', avatar: '⭐', color: '#10b981', title: '人话导航·别让旅行者迷路', catchphrase: '派蒙懂了！也就是说，要写得简单又有用！' },
  },
'''
# insert before final } after meme block already before closing. safer replace last \n}
s=s.rstrip()
if 'genshin:' not in s:
    s=s[:-1]+block+'\n}'
p.write_text(s,encoding='utf-8')
# theme factory add workflow
p=Path('src/engine/theme-factory.ts')
s=p.read_text(encoding='utf-8')
s=s.replace("import type {AgentProfile, RoleThemeMapping} from '../types.js'", "import type {AgentProfile, RoleThemeMapping, WorkflowDefinition} from '../types.js'")
append=r'''

function stageTitle(brief: string, fallback: string): string {
  const compact = brief.replace(/[\s\n\r]+/g, '').slice(0, 10)
  return compact ? `${fallback}：${compact}` : fallback
}

export function createWorkflowDraft(projectBrief: string): WorkflowDefinition {
  const brief = projectBrief.trim() || '当前项目任务'
  const now = Date.now()
  const productLike = /产品|应用|网站|插件|系统|平台|小程序|app|web|扩展|工具/i.test(brief)
  const contentLike = /文案|文章|视频|脚本|故事|角色|世界观|运营|营销/i.test(brief)
  const auditName = productLike ? '边界爆破与体验验收' : contentLike ? '人话校对与风格验收' : '质量挑刺与交付验收'
  return {
    id: `wf_custom_${now}`,
    title: `${stageTitle(brief, 'AI 定制工作流')} · 沙雕但靠谱版`,
    currentStageIndex: 0,
    isCompleted: false,
    stages: [
      {id:'custom_stage_1_brief',name:'先把话说人话',description:`围绕「${brief}」澄清目标、受众、边界、成功标准和不该做的坑。`,assignedRoleIds:['commander','researcher'],status:'in_progress',requiresApproval:false},
      {id:'custom_stage_2_plan',name:'拆活别拆家',description:'把任务拆成可执行清单，明确前后依赖、角色分工和最小可交付版本。',assignedRoleIds:['commander','backend','frontend'],status:'pending',requiresApproval:true},
      {id:'custom_stage_3_make',name: productLike ? '原型开整' : contentLike ? '内容开炖' : '方案开工',description:'按分工产出第一版结果，保留关键取舍，少空话，多可验证产物。',assignedRoleIds:['backend','frontend','writer'],status:'pending',requiresApproval:true},
      {id:'custom_stage_4_audit',name:auditName,description:'从用户视角和反常识路径挑刺，列出必须改、建议改、可以先不改。',assignedRoleIds:['qa','commander'],status:'pending',requiresApproval:true},
      {id:'custom_stage_5_ship',name:'收口交付别烂尾',description:'整理最终说明、使用方式、变更记录和下一步建议，给用户一个能接着用的交付结果。',assignedRoleIds:['writer','commander'],status:'pending',requiresApproval:true},
    ],
  }
}
'''
if 'createWorkflowDraft' not in s:
    s += append
p.write_text(s,encoding='utf-8')

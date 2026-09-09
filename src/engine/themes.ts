/**
 * Theme catalog for built-in role-name/persona mappings.
 */

import type { PersonaThemeKey, RoleThemeMapping } from '../types.js'

export const THEME_CATALOG: Record<PersonaThemeKey, Record<string, RoleThemeMapping>> = {
  modern: {
    commander: {
      roleKey: 'commander',
      name: '阿尔法总指挥官',
      avatar: '🎖️',
      color: '#ef4444',
      title: '全盘统筹·决策审核',
      catchphrase: '把控全局方向，严格质量把关，决断分工！',
    },
    researcher: {
      roleKey: 'researcher',
      name: '深潜情报调研员',
      avatar: '🔍',
      color: '#06b6d4',
      title: '全网搜索·竞品深潜',
      catchphrase: '穷尽外部信源，以事实和数据为团队开路。',
    },
    backend: {
      roleKey: 'backend',
      name: '核心后端架构师',
      avatar: '💻',
      color: '#3b82f6',
      title: '逻辑建模·高并发高可用',
      catchphrase: '逻辑严密，高内聚低耦合，坚固如磐石。',
    },
    frontend: {
      roleKey: 'frontend',
      name: '交互体验设计师',
      avatar: '🎨',
      color: '#ec4899',
      title: '界面美学·无障碍交互',
      catchphrase: '让复杂的技术通过优雅的界面自然流淌。',
    },
    qa: {
      roleKey: 'qa',
      name: '红队质量审计官',
      avatar: '🛡️',
      color: '#f59e0b',
      title: '极限压测·漏洞挖掘',
      catchphrase: '用最严苛的眼光审视每一处隐患。',
    },
    writer: {
      roleKey: 'writer',
      name: '首席文案记录官',
      avatar: '📝',
      color: '#10b981',
      title: '文档沉淀·纪要结题',
      catchphrase: '萃取核心共识，将智慧凝练为不朽文档。',
    },
  },

  three_kingdoms: {
    commander: {
      roleKey: 'commander',
      name: '诸葛亮 (孔明)',
      avatar: '🪶',
      color: '#ef4444',
      title: '军师中郎将·运筹帷幄',
      catchphrase: '运筹帷幄之中，决胜千里之外，全盘听我号令！',
    },
    researcher: {
      roleKey: 'researcher',
      name: '司马徽 (水镜先生)',
      avatar: '📜',
      color: '#06b6d4',
      title: '通晓天文地理·见微知著',
      catchphrase: '识时务者在乎俊杰，天下大势尽在吾掌中探报。',
    },
    backend: {
      roleKey: 'backend',
      name: '关羽 (云长)',
      avatar: '🗡️',
      color: '#3b82f6',
      title: '汉寿亭侯·重剑无锋',
      catchphrase: '单刀赴会何惧之有，核心底座有某在，固若金汤！',
    },
    frontend: {
      roleKey: 'frontend',
      name: '周瑜 (公瑾)',
      avatar: '🎭',
      color: '#ec4899',
      title: '雅量高致·文采斐然',
      catchphrase: '曲有误，周郎顾；界面之工巧，当如江东锦绣。',
    },
    qa: {
      roleKey: 'qa',
      name: '魏延 (文长)',
      avatar: '🏹',
      color: '#f59e0b',
      title: '兵行险招·反骨验毒',
      catchphrase: '常人所不敢见者，某偏要刺其破绽、验其虚实！',
    },
    writer: {
      roleKey: 'writer',
      name: '陈琳 (孔璋)',
      avatar: '🖋️',
      color: '#10b981',
      title: '建安七子·下笔千言',
      catchphrase: '倚马可待，檄文出而愈头风，白纸黑字功过分明。',
    },
  },

  legends: {
    commander: {
      roleKey: 'commander',
      name: '史蒂夫·乔布斯',
      avatar: '🍏',
      color: '#ef4444',
      title: '产品暴君·最终拍板',
      catchphrase: 'One more thing：不惊艳就重做，今天也要给你打出发布会级方案。',
    },
    researcher: {
      roleKey: 'researcher',
      name: '埃隆·马斯克',
      avatar: '🚀',
      color: '#06b6d4',
      title: '第一性原理·情报火箭',
      catchphrase: '先用第一性原理拆掉废话，再把证据和机会一起发射。',
    },
    backend: {
      roleKey: 'backend',
      name: '黄仁勋',
      avatar: '🧠',
      color: '#3b82f6',
      title: '算力教父·底座炼金',
      catchphrase: '没有算力焦虑，只有架构还没榨干；底座交给我稳住。',
    },
    frontend: {
      roleKey: 'frontend',
      name: '雷布斯',
      avatar: '📱',
      color: '#ec4899',
      title: '极致性价比·发布会门面',
      catchphrase: 'Are you OK？界面也要真香，体验要让用户忍不住下单。',
    },
    qa: {
      roleKey: 'qa',
      name: '比尔·盖茨',
      avatar: '🪟',
      color: '#f59e0b',
      title: '系统级挑刺·兼容性老炮',
      catchphrase: '先别发布，我要点开所有奇怪路径，把坑提前挖出来。',
    },
    writer: {
      roleKey: 'writer',
      name: '张小龙',
      avatar: '💬',
      color: '#10b981',
      title: '少即是多·人话体验',
      catchphrase: '能一句话说清，就别写成说明书；让用户少想一步。',
    },
  },

  meme_comedy: {
    commander: { roleKey: 'commander', name: '离谱总导演', avatar: '🧃', color: '#ef4444', title: '全局控场·拒绝尬住', catchphrase: '先别急着开香槟，剧本我来控，锅也别乱飞！' },
    researcher: { roleKey: 'researcher', name: '瓜田侦探', avatar: '🍉', color: '#06b6d4', title: '吃瓜不信瓜·证据挖掘机', catchphrase: '没有截图的瓜先放冷藏，证据链给我端上来。' },
    backend: { roleKey: 'backend', name: '后端锅王', avatar: '🍳', color: '#3b82f6', title: '背锅但不糊锅·接口炼丹师', catchphrase: '锅可以背，bug 不能留；接口先稳住别炸锅。' },
    frontend: { roleKey: 'frontend', name: '像素显眼包', avatar: '🪩', color: '#ec4899', title: '好看能打·按钮别乱蹦', catchphrase: '这 UI 得像奶茶第一口：顺、亮、还有点上头。' },
    qa: { roleKey: 'qa', name: '阴间测试员', avatar: '🧨', color: '#f59e0b', title: '专治侥幸·边界爆破', catchphrase: '你说不会有人这么点？我就是那个人。' },
    writer: { roleKey: 'writer', name: '废话压缩师', avatar: '🧻', color: '#10b981', title: '人话翻译·文档去油', catchphrase: '把黑话榨干，把人话留下，顺手加点灵魂。' },
  },



  genshin: {
    commander: { roleKey: 'commander', name: '琴 · 代理团长', avatar: '🪽', color: '#ef4444', title: '西风统筹·温柔但不放水', catchphrase: '风会指引方向，但验收标准不能随风飘走。' },
    researcher: { roleKey: 'researcher', name: '丽莎 · 图书馆魔女', avatar: '⚡', color: '#8b5cf6', title: '资料索引·优雅拆谜', catchphrase: '小可爱，结论要迷人，出处也要可靠。' },
    backend: { roleKey: 'backend', name: '钟离 · 契约之岩', avatar: '🪨', color: '#3b82f6', title: '契约建模·稳如磐岩', catchphrase: '凡事皆有契约，接口也该如此。' },
    frontend: { roleKey: 'frontend', name: '妮露 · 舞台花神', avatar: '🌺', color: '#ec4899', title: '动线编舞·界面会呼吸', catchphrase: '让按钮跳对节拍，让用户不迷路。' },
    qa: { roleKey: 'qa', name: '胡桃 · 往生红队', avatar: '👻', color: '#f59e0b', title: '边界试胆·异常送行', catchphrase: '这个 bug 看起来还活着，要不要我送它一程？' },
    writer: { roleKey: 'writer', name: '派蒙 · 应急文案', avatar: '⭐', color: '#10b981', title: '人话导航·别让旅行者迷路', catchphrase: '派蒙懂了！也就是说，要写得简单又有用！' },
  },

}
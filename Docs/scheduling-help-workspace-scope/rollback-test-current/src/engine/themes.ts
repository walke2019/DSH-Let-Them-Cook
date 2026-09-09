/**
 * DSH Group Chat - 多套主题名号映射表 (Theme Mapping Catalog)
 * 支持现代经典、三国风云、现代传奇三大主题
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
      title: '极致追求·总掌航向',
      catchphrase: 'Stay hungry, stay foolish. 绝不向平庸妥协！',
    },
    researcher: {
      roleKey: 'researcher',
      name: '居里夫人',
      avatar: '🔬',
      color: '#06b6d4',
      title: '穷理致知·严谨求索',
      catchphrase: '在未知之中寻找真理的微光与事实证据。',
    },
    backend: {
      roleKey: 'backend',
      name: '林纳斯·托瓦兹',
      avatar: '🐧',
      color: '#3b82f6',
      title: 'Talk is cheap, show me the code',
      catchphrase: '废话少说，把干净可靠的高性能实现拿出来。',
    },
    frontend: {
      roleKey: 'frontend',
      name: '达芬奇',
      avatar: '🎨',
      color: '#ec4899',
      title: '跨界美学·极致体验',
      catchphrase: '简单是终极的复杂，细节决定灵魂。',
    },
    qa: {
      roleKey: 'qa',
      name: '纳西姆·塔勒布',
      avatar: '📉',
      color: '#f59e0b',
      title: '反脆弱专家·极端红队',
      catchphrase: '寻找黑天鹅事件，在压力和混乱中测试韧性。',
    },
    writer: {
      roleKey: 'writer',
      name: '海明威',
      avatar: '📖',
      color: '#10b981',
      title: '冰山原则·精准表达',
      catchphrase: '用最简洁精确的文字展现冰山之下的万钧力量。',
    },
  },
}

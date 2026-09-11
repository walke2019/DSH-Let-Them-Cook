from pathlib import Path
p=Path('src/client/AvatarBadge.tsx')
p.write_text(r'''import React from 'react'

type AvatarBadgeProps = {
  avatar?: string
  alt?: string
  className?: string
  style?: React.CSSProperties
}

function FeatherSvg({className, style}: Pick<AvatarBadgeProps, 'className' | 'style'>) {
  return <span className={className} style={style} aria-hidden="true" data-avatar-svg="feather-fan">
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:'block'}}>
      <path d="M5 19c4.8-1.2 9-4 12.5-8.5 1.4-1.8 1.8-3.5 1-4.3-.8-.8-2.5-.4-4.3 1C9.8 10.7 7 14.9 5.8 19.6"/>
      <path d="M8.2 16.8 4 21"/>
      <path d="M10.1 14.2h4.6"/>
      <path d="M12.2 11.8h4.2"/>
      <path d="M14.3 9.3h3.2"/>
    </svg>
  </span>
}

export function AvatarBadge({avatar, alt='', className, style}: AvatarBadgeProps) {
  const value = avatar || '◉'
  if (/^(data:|https?:)/.test(value)) return <img className={className} style={style} src={value} alt={alt} />
  if (value === '🪶' || value === ':feather:' || value === 'feather') return <FeatherSvg className={className} style={style} />
  return <span className={className} style={style} aria-hidden="true">{value}</span>
}
''', encoding='utf-8')

for f in ['src/client/GroupChatSideDock.tsx','src/client/GroupChatPanel.tsx','src/client/GroupChatComposer.tsx']:
    p=Path(f); s=p.read_text(encoding='utf-8')
    if "import {AvatarBadge}" not in s:
        s=s.replace("import React", "import {AvatarBadge} from './AvatarBadge.js'\nimport React",1)
    p.write_text(s,encoding='utf-8')

p=Path('src/client/GroupChatSideDock.tsx')
s=p.read_text(encoding='utf-8')
s=s.replace("<span style={{ fontSize: '14px' }}>{member.avatar}</span>", "<AvatarBadge avatar={member.avatar} className=\"gc-roster-avatar\" />")
# add CSS style injection in component return via existing top fragment? Use style block after modal? Simpler inline class with global style near return.
s=s.replace("return (\n    <>", "return (\n    <>\n      <style>{`.gc-roster-avatar{width:22px;height:22px;border-radius:7px;display:inline-grid;place-items:center;flex-shrink:0;font-size:14px;color:var(--dsw-alias-state-business-primary,#4d6bfe);background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,0.06));}`}</style>")
p.write_text(s,encoding='utf-8')

p=Path('src/client/GroupChatPanel.tsx')
s=p.read_text(encoding='utf-8')
s=s.replace("<span aria-hidden=\"true\">{item.avatar||'◉'}</span>", "<AvatarBadge avatar={item.avatar} />")
s=s.replace("{/^(data:|https?:)/.test(message.sender.avatar||'')?<img className=\"gc-message-avatar\" src={message.sender.avatar} alt=\"\"/>:<span className=\"gc-message-avatar\" aria-hidden=\"true\">{message.sender.avatar||'◉'}</span>}", "<AvatarBadge avatar={message.sender.avatar} className=\"gc-message-avatar\" />")
p.write_text(s,encoding='utf-8')

p=Path('src/client/GroupChatComposer.tsx')
s=p.read_text(encoding='utf-8')
s=s.replace("{m.avatar.startsWith('data:') || /^https?:/.test(m.avatar) ? <img src={m.avatar} alt=\"\" /> : <span className=\"gc-member-avatar\" aria-hidden=\"true\">{m.avatar}</span>}", "<AvatarBadge avatar={m.avatar} className=\"gc-member-avatar\" />")
p.write_text(s,encoding='utf-8')

import React from 'react'

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

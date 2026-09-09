import type {CSSProperties} from 'react'

export const hudTokens = {
  bgLayer1: 'var(--dsw-alias-bg-layer-1,#151518)',
  bgLayer2: 'var(--dsw-alias-bg-layer-2,#202025)',
  bgLayer3: 'var(--dsw-alias-bg-layer-3,#2a2a30)',
  borderL1: 'var(--dsw-alias-border-l1,rgba(255,255,255,0.08))',
  borderL2: 'var(--dsw-alias-border-l2,rgba(255,255,255,0.14))',
  labelPrimary: 'var(--dsw-alias-label-primary,#f8fafc)',
  labelSecondary: 'var(--dsw-alias-label-secondary,#cbd5e1)',
  labelTertiary: 'var(--dsw-alias-label-tertiary,#94a3b8)',
  primary: 'var(--dsw-alias-state-business-primary,#4d6bfe)',
}

export const hudPanelStackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minWidth: 0,
  maxWidth: '100%',
}

export const hudCardStyle: CSSProperties = {
  background: hudTokens.bgLayer2,
  border: `1px solid ${hudTokens.borderL1}`,
  borderRadius: '10px',
  padding: '10px',
  minWidth: 0,
  maxWidth: '100%',
}

export const hudGhostButtonStyle: CSSProperties = {
  background: 'transparent',
  border: `1px solid ${hudTokens.borderL2}`,
  color: hudTokens.labelPrimary,
  fontSize: '10px',
  borderRadius: '6px',
  padding: '2px 7px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

export const hudPrimaryButtonStyle: CSSProperties = {
  backgroundColor: hudTokens.primary,
  color: '#fff',
  border: 'none',
  fontSize: '10px',
  borderRadius: '6px',
  padding: '2px 8px',
  cursor: 'pointer',
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

export const hudTextAreaStyle: CSSProperties = {
  width: '100%',
  background: hudTokens.bgLayer2,
  border: `1px solid ${hudTokens.borderL2}`,
  borderRadius: '8px',
  color: hudTokens.labelPrimary,
  fontFamily: 'monospace',
  fontSize: '11px',
  lineHeight: 1.5,
  padding: '8px',
  resize: 'none',
  minWidth: 0,
}

export function hudScrollableTextStyle(extra: CSSProperties = {}): CSSProperties {
  return {
    ...hudCardStyle,
    color: hudTokens.labelPrimary,
    whiteSpace: 'pre-wrap',
    overflowY: 'auto',
    overflowX: 'hidden',
    lineHeight: '1.5',
    ...extra,
  }
}

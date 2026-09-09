import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

type Member = { id: string; name: string; avatar: string; title?: string }
interface Props {
  members: Member[]
  value: string
  onChange(value: string): void
  onSend(): void
  sending: boolean
}

/** Compact group composer; the member roster stays inside a searchable picker. */
export function GroupChatComposer({ members, value, onChange, onSend, sending }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const selection = useRef({ start: value.length, end: value.length })
  const id = useId()
  const options = [...members, { id: 'all', name: '全员争鸣', avatar: '◎', title: '邀请所有角色参与' }]
    .filter(m => `${m.name} ${m.id} ${m.title ?? ''}`.toLowerCase().includes(query.toLowerCase().trim()))

  useLayoutEffect(() => {
    const el = textarea.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(160, Math.max(76, el.scrollHeight))}px`
  }, [value])
  useEffect(() => {
    if (!open) return
    search.current?.focus()
    const dismiss = (e: PointerEvent) => {
      if (e.target instanceof Node && !root.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])
  const choose = (member: Member) => {
    const start = Math.min(selection.current.start, value.length)
    const end = Math.min(selection.current.end, value.length)
    const before = value.slice(0, start)
    const mention = `${before && !/\s$/.test(before) ? ' ' : ''}@${member.name} `
    onChange(before + mention + value.slice(end))
    setOpen(false)
    requestAnimationFrame(() => {
      textarea.current?.focus()
      textarea.current?.setSelectionRange(start + mention.length, start + mention.length)
    })
  }
  const close = () => { setOpen(false); trigger.current?.focus() }

  return <div className="gc-composer" ref={root} onBlur={e => {
    if (e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) setOpen(false)
  }}>
    <style>{`
      .gc-composer { flex-shrink:0; padding:12px 20px 16px; color:var(--dsw-alias-label-primary,#f8fafc); }
      .gc-composer-card { position:relative; max-width:960px; margin:0 auto; padding:12px; border:1px solid var(--dsw-alias-border-l2,#34343a); border-radius:22px; background:var(--dsw-alias-bg-layer-1,#18181c); box-shadow:0 2px 10px #00000010; }
      .gc-composer-card:focus-within { border-color:var(--dsw-alias-label-tertiary,#757580); }
      .gc-composer textarea { display:block; box-sizing:border-box; width:100%; min-height:76px; max-height:160px; resize:none; border:0; padding:3px 5px 8px; outline:none; background:transparent; color:inherit; font-size:14px; font-family:inherit; line-height:1.6; overflow-y:auto; }
      .gc-composer textarea::placeholder { color:var(--dsw-alias-label-tertiary,#9696a3); }
      .gc-composer-tools { display:flex; align-items:center; justify-content:space-between; gap:8px; }
      .gc-mention-trigger { display:flex; align-items:center; gap:6px; padding:6px 9px; border:0; border-radius:9px; background:transparent; color:var(--dsw-alias-label-secondary,#cbd5e1); font:inherit; font-size:12px; cursor:pointer; }
      .gc-mention-trigger:hover,.gc-mention-trigger[aria-expanded=true] { background:var(--dsw-alias-bg-layer-2,#303036); }
      .gc-composer button:focus-visible,.gc-member-search:focus-visible { outline:2px solid #7b91ff; outline-offset:2px; }
      .gc-send { display:grid; place-items:center; flex-shrink:0; width:32px; height:32px; border:0; border-radius:50%; color:#fff; background:#4d6bfe; cursor:pointer; }
      .gc-send:disabled { background:var(--dsw-alias-bg-layer-2,#303036); color:#777782; cursor:default; }
      .gc-composer-help { color:var(--dsw-alias-label-tertiary,#9999a5); font-size:11px; margin-left:auto; }
      .gc-member-picker { position:absolute; left:10px; bottom:54px; z-index:30; width:min(300px,calc(100% - 20px)); padding:8px; box-sizing:border-box; border:1px solid var(--dsw-alias-border-l2,#42424b); border-radius:14px; background:var(--dsw-alias-bg-layer-1,#202025); box-shadow:0 8px 28px #0005; }
      .gc-picker-title { font-size:12px; color:var(--dsw-alias-label-secondary,#cbd5e1); padding:3px 4px 8px; }
      .gc-member-search { box-sizing:border-box; width:100%; border:1px solid var(--dsw-alias-border-l2,#42424b); border-radius:8px; padding:8px; color:inherit; background:var(--dsw-alias-bg-base,#151519); font:inherit; font-size:12px; }
      .gc-member-options { max-height:210px; overflow-y:auto; margin-top:6px; }
      .gc-member-option { display:flex; gap:10px; align-items:center; text-align:left; width:100%; border:0; border-radius:8px; padding:8px; color:inherit; background:transparent; cursor:pointer; }
      .gc-member-option:hover,.gc-member-option:focus-visible { background:var(--dsw-alias-bg-layer-2,#303036); }
      .gc-member-option img,.gc-member-avatar { width:26px; height:26px; display:grid; place-items:center; object-fit:cover; border-radius:7px; flex-shrink:0; }
      .gc-member-copy { min-width:0; display:flex; flex-direction:column; gap:2px; }
      .gc-member-copy strong { font-size:12px; font-weight:500; }
      .gc-member-copy small { font-size:11px; color:var(--dsw-alias-label-tertiary,#9999a5); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      @media(max-width:600px) { .gc-composer{padding:8px;} .gc-composer-help{display:none;} }
    `}</style>
    <div className="gc-composer-card">
      <textarea ref={textarea} aria-label="群聊消息" placeholder="发送消息，或选择 @ 角色…" value={value} disabled={sending}
        onChange={e => onChange(e.target.value)}
        onSelect={e => { selection.current = { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd } }}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
            e.preventDefault()
            if (value.trim() && !sending) onSend()
          }
        }} />
      {open && <div id={id} className="gc-member-picker" role="dialog" aria-label="选择角色" onKeyDown={e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('.gc-member-option'))
          const current = items.indexOf(document.activeElement as HTMLButtonElement)
          const next = current < 0 ? (e.key === 'ArrowDown' ? 0 : items.length - 1) : (current + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
          items[next]?.focus()
        }
        if (e.key === 'Enter' && e.target === search.current && options.length) { e.preventDefault(); choose(options[0]) }
      }}>
        <div className="gc-picker-title">选择要 @ 的角色</div>
        <input className="gc-member-search" ref={search} aria-label="搜索角色" placeholder="搜索角色…" value={query} onChange={e => setQuery(e.target.value)} />
        <div className="gc-member-options">
          {options.map(m => <button type="button" className="gc-member-option" key={m.id} onClick={() => choose(m)}>
            {m.avatar.startsWith('data:') || /^https?:/.test(m.avatar) ? <img src={m.avatar} alt="" /> : <span className="gc-member-avatar" aria-hidden="true">{m.avatar}</span>}
            <span className="gc-member-copy"><strong>{m.name}</strong><small>{m.title || m.id}</small></span>
          </button>)}
          {!options.length && <div role="status" style={{ padding:12, fontSize:12 }}>没有匹配的角色</div>}
        </div>
      </div>}
      <div className="gc-composer-tools">
        <button type="button" ref={trigger} className="gc-mention-trigger" aria-label="选择要提及的角色" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} disabled={sending}
          onClick={() => { setQuery(''); setOpen(v => !v) }}><span aria-hidden="true" style={{ fontSize:17 }}>@</span>角色<span aria-hidden="true">⌄</span></button>
        <span className="gc-composer-help">Enter 发送 · Shift+Enter 换行</span>
        <button type="button" className="gc-send" aria-label={sending ? '正在发送' : '发送消息'} title="发送消息" disabled={sending || !value.trim()} onClick={onSend}>
          {sending ? '…' : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" /></svg>}
        </button>
      </div>
    </div>
  </div>
}

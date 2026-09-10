import {AvatarBadge} from './AvatarBadge.js'
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import {tx, type GroupChatLocale} from './i18n.js'

type Member = { id: string; name: string; avatar: string; title?: string }
interface Props {
  members: Member[]
  value: string
  onChange(value: string): void
  onSend(): void
  sending: boolean
  taskTier?: 'quick' | 'long'
  onTaskTierChange?(tier: 'quick' | 'long'): void
  locale?: GroupChatLocale
}

/** Compact group composer; the member roster stays inside a searchable picker. */
export function GroupChatComposer({ members, value, onChange, onSend, sending, taskTier = 'quick', onTaskTierChange, locale = 'zh-CN' }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const selection = useRef({ start: value.length, end: value.length })
  const id = useId()
  const allLabel = tx(locale, '全员争鸣', 'All agents')
  const allTitle = tx(locale, '邀请所有角色参与', 'Invite every role to respond')
  const options = [...members, { id: 'all', name: allLabel, avatar: '◎', title: allTitle }]
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
      body[data-dsh-group-chat-tab-active="true"][data-dsh-group-chat-hud-docked-open="true"] .gc-composer{padding-left:24px;padding-right:24px;}
      .gc-composer-card { position:relative; max-width:960px; margin:0 auto; padding:12px; border:1px solid var(--dsw-alias-border-l2,#34343a); border-radius:22px; background:var(--dsw-alias-bg-layer-1,#18181c); box-shadow:0 2px 10px #00000010; }
      .gc-composer-card:focus-within { border-color:var(--dsw-alias-label-tertiary,#757580); }
      .gc-composer textarea { display:block; box-sizing:border-box; width:100%; min-height:76px; max-height:160px; resize:none; border:0; padding:3px 5px 8px; outline:none; background:transparent; color:inherit; font-size:14px; font-family:inherit; line-height:1.6; overflow-y:auto; }
      .gc-composer textarea::placeholder { color:var(--dsw-alias-label-tertiary,#9696a3); }
      .gc-composer-tools { display:grid; grid-template-columns:auto auto minmax(0,1fr) auto; grid-template-areas:"mention tier help send" "hint hint hint send"; align-items:center; gap:8px; }
      .gc-tier-toggle{grid-area:tier;display:inline-flex;align-items:center;gap:3px;padding:3px;border:1px solid var(--dsw-alias-border-l1,#ffffff17);border-radius:999px;background:var(--dsw-alias-bg-base,#121216);}
      .gc-tier-toggle button{border:0;border-radius:999px;padding:5px 8px;background:transparent;color:var(--dsw-alias-label-tertiary,#999);font:inherit;font-size:11px;cursor:pointer;}
      .gc-tier-toggle button[data-active=true]{background:var(--dsw-alias-state-business-primary,#4d6bfe);color:white;box-shadow:0 2px 8px #4d6bfe44;}
      .gc-tier-hint{grid-area:hint;font-size:10px;color:var(--dsw-alias-label-tertiary,#999);min-width:0;padding-left:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .gc-mention-trigger { grid-area:mention; display:flex; align-items:center; gap:6px; padding:6px 9px; border:0; border-radius:9px; background:transparent; color:var(--dsw-alias-label-secondary,#cbd5e1); font:inherit; font-size:12px; cursor:pointer; }
      .gc-mention-chevron{width:14px;height:14px;display:block;transition:transform .15s ease;opacity:.8;}
      .gc-mention-trigger[aria-expanded=true] .gc-mention-chevron{transform:rotate(180deg);}
      .gc-mention-trigger:hover,.gc-mention-trigger[aria-expanded=true] { background:var(--dsw-alias-bg-layer-2,#303036); }
      .gc-composer button:focus-visible,.gc-member-search:focus-visible { outline:2px solid #7b91ff; outline-offset:2px; }
      .gc-send { grid-area:send; align-self:end; justify-self:end; display:grid; place-items:center; flex-shrink:0; width:32px; height:32px; border:0; border-radius:50%; color:#fff; background:#4d6bfe; cursor:pointer; }
      .gc-send:disabled { background:var(--dsw-alias-bg-layer-2,#303036); color:#777782; cursor:default; }
      .gc-composer-help { grid-area:help; min-width:0; color:var(--dsw-alias-label-tertiary,#9999a5); font-size:11px; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
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
      @media(max-width:600px) { .gc-composer{padding:8px;} .gc-composer-tools{grid-template-columns:auto 1fr auto;grid-template-areas:"mention tier send" "hint hint send";} .gc-composer-help{display:none;} }
    `}</style>
    <div className="gc-composer-card">
      <textarea ref={textarea} aria-label={tx(locale,'群聊消息','Group chat message')} placeholder={tx(locale,'发送消息，或选择 @ 角色…','Send a message, or choose an @ role…')} value={value} disabled={sending}
        onChange={e => onChange(e.target.value)}
        onSelect={e => { selection.current = { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd } }}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
            e.preventDefault()
            if (value.trim() && !sending) onSend()
          }
        }} />
      {open && <div id={id} className="gc-member-picker" role="dialog" aria-label={tx(locale,'选择角色','Choose role')} onKeyDown={e => {
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
        <div className="gc-picker-title">{tx(locale,'选择要 @ 的角色','Choose a role to @')}</div>
        <input className="gc-member-search" ref={search} aria-label={tx(locale,'搜索角色','Search roles')} placeholder={tx(locale,'搜索角色…','Search roles…')} value={query} onChange={e => setQuery(e.target.value)} />
        <div className="gc-member-options">
          {options.map(m => <button type="button" className="gc-member-option" key={m.id} onClick={() => choose(m)}>
            <AvatarBadge avatar={m.avatar} className="gc-member-avatar" />
            <span className="gc-member-copy"><strong>{m.name}</strong><small>{m.title || m.id}</small></span>
          </button>)}
          {!options.length && <div role="status" style={{ padding:12, fontSize:12 }}>{tx(locale,'没有匹配的角色','No matching roles')}</div>}
        </div>
      </div>}
      <div className="gc-composer-tools">
        <button type="button" ref={trigger} className="gc-mention-trigger" aria-label={tx(locale,'选择要提及的角色','Choose role to mention')} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} disabled={sending}
          onClick={() => { setQuery(''); setOpen(v => !v) }}><span aria-hidden="true" style={{ fontSize:17 }}>@</span>{tx(locale,'角色','Role')}<svg className="gc-mention-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg></button>
        <div className="gc-tier-toggle" role="group" aria-label={tx(locale,'任务类型','Task type')}><button type="button" data-active={taskTier==='quick'} onClick={()=>onTaskTierChange?.('quick')} title={tx(locale,'少 Agent、短链路，适合问答/小修改/快速确认','Fewer agents, shorter path for Q&A, tiny changes, quick checks')}>{tx(locale,'快活','Quick')}</button><button type="button" data-active={taskTier==='long'} onClick={()=>onTaskTierChange?.('long')} title={tx(locale,'保留工作流和多 Agent 协作，适合完整项目任务','Full workflow and multi-agent collaboration for project tasks')}>{tx(locale,'长活','Long')}</button></div>
        <span className="gc-composer-help">{tx(locale,'Enter 发送 · Shift+Enter 换行','Enter to send · Shift+Enter for newline')}</span>
        <div className="gc-tier-hint">{taskTier==='quick'?tx(locale,'快速：有 @ 只叫被点名角色；没 @ 只叫主 Agent。','Quick: @ mentions only selected roles; no @ calls only Master Agent.'):tx(locale,'长任务：按工作流分派，多 Agent 可并行并上报主 Agent。','Long: workflow dispatch, SubAgents may run in parallel and report back.')}</div>
        <button type="button" className="gc-send" aria-label={sending ? tx(locale,'正在发送','Sending') : tx(locale,'发送消息','Send message')} title={tx(locale,'发送消息','Send message')} disabled={sending || !value.trim()} onClick={onSend}>
          {sending ? '…' : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" /></svg>}
        </button>
      </div>
    </div>
  </div>
}


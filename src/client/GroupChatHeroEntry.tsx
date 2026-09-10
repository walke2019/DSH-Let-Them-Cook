import React, {useEffect, useState} from 'react'
import {GroupChatPanel} from './GroupChatPanel.js'
import {detectGroupChatLocale, tx, type GroupChatLocale} from './i18n.js'

const HERO_STYLE_ID = 'dsh-group-chat-hero-entry-style'
const HERO_OPEN_EVENT = 'dsh-group-chat:open-hero-main'
const HERO_STYLE = `
.gc-hero-entry{position:fixed;right:0;top:118px;z-index:48;display:flex;align-items:flex-end;gap:8px;min-width:0;pointer-events:none;flex-direction:column;}
.gc-hero-button{pointer-events:auto;display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2,#ffffff26);border-top-left-radius:999px;border-bottom-left-radius:999px;border-top-right-radius:0;border-bottom-right-radius:0;background:var(--dsw-alias-bg-layer-1,#202025);color:var(--dsw-alias-label-primary,#f8fafc);font:inherit;font-size:13px;cursor:pointer;box-shadow:0 2px 10px #0000001f;}
.gc-hero-button:hover{background:var(--dsw-alias-bg-layer-2,#2b2b31);border-color:var(--dsw-alias-state-business-primary,#4d6bfe99);}
.gc-hero-main{pointer-events:auto;position:fixed;z-index:47;left:var(--dsh-group-chat-hero-left,280px);right:0;top:0;bottom:0;display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--dsw-alias-bg-base,#101014);color:var(--dsw-alias-label-primary,#f8fafc);box-shadow:-1px 0 0 var(--dsw-alias-border-l1,#ffffff12),0 16px 44px #0008;}
.gc-hero-main-head{height:48px;min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 18px;border-bottom:1px solid var(--dsw-alias-border-l1,#ffffff12);background:var(--dsw-alias-bg-layer-1,#151518);}
.gc-hero-main-title{display:flex;align-items:center;gap:8px;min-width:0;font-size:14px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gc-hero-main-subtitle{font-size:12px;font-weight:400;color:var(--dsw-alias-label-tertiary,#94a3b8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gc-hero-main-actions{display:inline-flex;align-items:center;gap:8px;flex-shrink:0;}
.gc-hero-main-actions button{height:28px;padding:0 10px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,#ffffff26);background:transparent;color:var(--dsw-alias-label-secondary,#cbd5e1);font:inherit;font-size:12px;cursor:pointer;}
.gc-hero-main-actions button:hover{background:var(--dsw-alias-bg-layer-2,#2b2b31);color:var(--dsw-alias-label-primary,#fff);border-color:var(--dsw-alias-state-business-primary,#4d6bfe99);}
.gc-hero-main-body{flex:1;min-width:0;min-height:0;display:flex;overflow:hidden;}
.gc-hero-main-body [data-dsh-group-chat-panel]{width:100%;height:100%;min-width:0;min-height:0;}
.gc-input-entry-button{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,#ffffff24);background:transparent;color:var(--dsw-alias-label-secondary,#cbd5e1);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap;}
.gc-input-entry-button:hover{background:var(--dsw-alias-bg-layer-2,#2b2b31);color:var(--dsw-alias-label-primary,#fff);border-color:var(--dsw-alias-state-business-primary,#4d6bfe99);}
@media(max-width:900px){.gc-hero-main{left:0;}.gc-hero-main-head{padding:0 12px;}.gc-hero-main-subtitle{display:none;}}
`

function installHeroStyle(): void {
  if (typeof document === 'undefined' || document.getElementById(HERO_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = HERO_STYLE_ID
  style.textContent = HERO_STYLE
  document.head.appendChild(style)
}


function resolveHeroLeftOffset(): number {
  if (typeof document === 'undefined' || typeof window === 'undefined') return 280
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
  const root = document.getElementById('root')
  const nodes = Array.from((root || document.body).querySelectorAll('div')) as HTMLElement[]
  const candidates = nodes
    .filter(el => {
      if (el.closest('[data-dsh-group-chat-hero-entry],.gc-hero-main,.dsh-gc-sidebar-host')) return false
      const rect = el.getBoundingClientRect()
      const text = (el.textContent || '').replace(/\s+/g, ' ')
      return rect.height >= Math.max(320, window.innerHeight * 0.6)
        && rect.width >= 320
        && rect.left >= 40
        && rect.left <= Math.min(360, viewportWidth - 320)
        && (text.includes('探索未至之境')
          || text.includes('Describe what')
          || text.includes('描述你想要构建')
          || text.includes('Agent 群聊')
          || text.includes('Agent group chat'))
    })
    .map(el => Math.round(el.getBoundingClientRect().left))
    .filter(left => Number.isFinite(left) && left >= 0)
    .sort((a, b) => a - b)
  if (candidates.length) return candidates[0]
  const collapsedRail = Array.from((root || document.body).querySelectorAll('*'))
    .map(el => (el as HTMLElement).getBoundingClientRect())
    .filter(rect => rect.left === 0 && rect.width > 40 && rect.width < 120 && rect.height >= window.innerHeight * 0.8)
    .map(rect => Math.round(rect.right))
    .sort((a, b) => b - a)[0]
  return collapsedRail || 280
}

function applyHeroLeftOffset(): void {
  if (typeof document === 'undefined') return
  const value = `${resolveHeroLeftOffset()}px`
  if (document.body.style.getPropertyValue('--dsh-group-chat-hero-left') !== value) {
    document.body.style.setProperty('--dsh-group-chat-hero-left', value)
  }
}

function clickVisibleGroupChatTab(): boolean {
  if (typeof document === 'undefined') return false
  const candidates = Array.from(document.querySelectorAll('button,[role="tab"]')) as HTMLElement[]
  const target = candidates.find(el => (el.textContent || '').replace(/\s+/g, ' ').trim() === 'Agent 群聊')
  if (!target) return false
  target.click()
  return true
}

function openHeroMain(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(HERO_OPEN_EVENT))
}

/** New-session launcher: opens the original middle group-chat surface when DSH has not exposed the real tab yet. */
export function GroupChatHeroEntry() {
  const [mainOpen, setMainOpen] = useState(false)
  const [locale, setLocale] = useState<GroupChatLocale>(() => detectGroupChatLocale())

  useEffect(() => {
    installHeroStyle()
    const onLocale = (event: Event) => {
      const detail = (event as CustomEvent<GroupChatLocale>).detail
      if (detail === 'zh-CN' || detail === 'en-US') setLocale(detail)
    }
    const onOpen = () => setMainOpen(true)
    window.addEventListener('dsh-group-chat:locale-changed', onLocale as EventListener)
    window.addEventListener(HERO_OPEN_EVENT, onOpen)
    return () => {
      window.removeEventListener('dsh-group-chat:locale-changed', onLocale as EventListener)
      window.removeEventListener(HERO_OPEN_EVENT, onOpen)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined' || !mainOpen) return
    document.body.setAttribute('data-dsh-group-chat-hero-open', 'true')
    applyHeroLeftOffset()
    const onReflow = () => applyHeroLeftOffset()
    const observer = new MutationObserver(onReflow)
    observer.observe(document.body, {attributes: true, childList: true, subtree: true})
    window.addEventListener('resize', onReflow)
    window.setTimeout(onReflow, 50)
    window.setTimeout(onReflow, 250)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', onReflow)
      document.body.removeAttribute('data-dsh-group-chat-hero-open')
      document.body.style.removeProperty('--dsh-group-chat-hero-left')
    }
  }, [mainOpen])

  const activate = () => {
    if (clickVisibleGroupChatTab()) return
    setMainOpen(true)
  }

  return <div className="gc-hero-entry" data-dsh-group-chat-hero-entry>
    {!mainOpen && <button type="button" className="gc-hero-button" onClick={activate} aria-expanded={mainOpen}>
      <span aria-hidden="true">💬</span>
      <span>{tx(locale, '进入 Agent 群聊', 'Open Agent group chat')}</span>
    </button>}
    {mainOpen && <div className="gc-hero-main" id="dsh-group-chat-hero-main" data-dsh-group-chat-hero-open>
      <div className="gc-hero-main-head">
        <div className="gc-hero-main-title">
          <span aria-hidden="true">💬</span>
          <span>{tx(locale, 'Agent 群聊', 'Agent group chat')}</span>
          <span className="gc-hero-main-subtitle">{tx(locale, '先在这里开整；会话建立后可切到顶部同名标签', 'Start here; after the session is created you can use the top tab')}</span>
        </div>
        <div className="gc-hero-main-actions">
          <button type="button" onClick={() => setMainOpen(false)}>{tx(locale, '回到源对话', 'Back to source chat')}</button>
        </div>
      </div>
      <div className="gc-hero-main-body">
        <GroupChatPanel mode="dock" />
      </div>
    </div>}
  </div>
}

/** Official-composer entry: a small in-row shortcut once the DSH session chrome is available. */
export function GroupChatInputEntry() {
  const [locale, setLocale] = useState<GroupChatLocale>(() => detectGroupChatLocale())
  useEffect(() => {
    installHeroStyle()
    const onLocale = (event: Event) => {
      const detail = (event as CustomEvent<GroupChatLocale>).detail
      if (detail === 'zh-CN' || detail === 'en-US') setLocale(detail)
    }
    window.addEventListener('dsh-group-chat:locale-changed', onLocale as EventListener)
    return () => window.removeEventListener('dsh-group-chat:locale-changed', onLocale as EventListener)
  }, [])
  const activate = () => {
    if (clickVisibleGroupChatTab()) return
    openHeroMain()
  }
  return <button type="button" className="gc-input-entry-button" onClick={activate} title={tx(locale, '打开 Agent 群聊主界面', 'Open Agent group chat main panel')}>
    <span aria-hidden="true">💬</span><span>{tx(locale, 'Agent 群聊', 'Agent chat')}</span>
  </button>
}

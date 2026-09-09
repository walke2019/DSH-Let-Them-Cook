import {subscribeGroupChat} from './group-chat-events.js'
import React, { useState, useEffect, useRef } from 'react'
import {GroupChatRoleEditor} from './GroupChatRoleEditor.js'
import {GroupChatHudTopControls} from './GroupChatHudTopControls.js'
import {GroupChatHudWorkflowPanel} from './GroupChatHudWorkflowPanel.js'
import {GroupChatHudRosterPanel} from './GroupChatHudRosterPanel.js'
import {GroupChatHudScratchpadPanel} from './GroupChatHudScratchpadPanel.js'
import type {AssignmentEnvelope, AgentMailboxMessage, GroupMessageData, LedgerData, WorkflowTask} from './group-chat-hud-types.js'
import type {AgentProfile} from './group-chat-view-types.js'
import {detectGroupChatLocale, onGroupChatLocaleChange, tx, type GroupChatLocale} from './i18n.js'

const SIDEBAR_DEFAULT_WIDTH = 360
const SIDEBAR_MIN_WIDTH = 300
const SIDEBAR_MAX_WIDTH = 520


/**
 * Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
 */
export function GroupChatSideDock() {
  const [isOpen, setIsOpen] = useState(false)
  const [editingAgent,setEditingAgent] = useState<AgentProfile|null>(null)
  const [managementError,setManagementError] = useState('')
  const [room, setRoom] = useState<RoomData | null>(null)
  const [ledger, setLedger] = useState<LedgerData | null>(null)
  const [messages, setMessages] = useState<GroupMessageData[]>([])
  const [scratchpadDraft, setScratchpadDraft] = useState('')
  const [isEditingScratchpad, setIsEditingScratchpad] = useState(false)
  const [activeTab, setActiveTab] = useState<'team' | 'workflow' | 'scratchpad' | 'ledger'>('team')
  const [locale,setLocale] = useState<GroupChatLocale>(()=>detectGroupChatLocale())
  const [themeBrief,setThemeBrief] = useState(()=>tx(detectGroupChatLocale(),'沙雕但靠谱的互联网项目小队，说人话、有梗、能交付；顺手按任务生成工作流','A chaotic-but-reliable internet project squad: human tone, fun, deliverable; generate workflow with the task.'))
  const [themeBusy,setThemeBusy] = useState(false)
  const [themeDraft,setThemeDraft] = useState<AgentProfile[]>([])
  const [workflowDraft,setWorkflowDraft] = useState<any>(null)
  const [dockFloating, setDockFloating] = useState(false)
  const [dockPos, setDockPos] = useState({ x: 0, y: 24 })
  const [hudWidth, setHudWidth] = useState(() => {
    if (typeof localStorage === 'undefined') return SIDEBAR_DEFAULT_WIDTH
    const stored = Number(localStorage.getItem('dsh-group-chat.hud-width'))
    return Number.isFinite(stored) ? Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, stored)) : SIDEBAR_DEFAULT_WIDTH
  })
  const dragRef = useRef<{ startX:number; startY:number; originX:number; originY:number } | null>(null)
  const resizeRef = useRef<{ startX:number; startWidth:number; originX:number; floating:boolean; pointerId?:number } | null>(null)
  const [isResizingHud, setIsResizingHud] = useState(false)
  const [extensionTabActive, setExtensionTabActive] = useState(false)
  const selectedTheme = room?.activeTheme === 'meme_comedy' ? 'default' : (room?.activeTheme || 'default')
  const selectedMode = room?.dispatchMode === 'workflow_driven' ? 'default' : (room?.dispatchMode || 'default')
  const displayRoomTitle = room?.title?.includes('特遣') ? tx(locale,'AI 小队工作台','AI squad workspace') : (room?.title || tx(locale,'群聊设置','Group chat settings'))
  useEffect(()=>onGroupChatLocaleChange(setLocale),[])
  useEffect(() => {
    if (typeof document === 'undefined') return
    const refresh = () => setExtensionTabActive(document.body.getAttribute('data-dsh-group-chat-tab-active') === 'true')
    refresh()
    const observer = new MutationObserver(refresh)
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-dsh-group-chat-tab-active'] })
    window.addEventListener('focus', refresh)
    return () => { observer.disconnect(); window.removeEventListener('focus', refresh) }
  }, []) // dsh-group-chat: observe active conversation tab

  const fetchRoomData = async () => {
    try {
      const res = await fetch('/dsh-group-chat/api/room?id=dev-team-alpha')
      if (!res.ok) return
      const data = await res.json()
      if (data.room) {
        setRoom(data.room)
        setScratchpadDraft(data.room.scratchpad || '')
      }
      if (data.ledger) setLedger(data.ledger)
      if (Array.isArray(data.messages)) setMessages(data.messages)
    } catch (err) {
      console.error('[GroupChatDock] fetch error:', err)
    }
  }

  useEffect(() => {
    fetchRoomData()

    const unsubscribe=subscribeGroupChat(e=>{
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'room:updated' || data.type === 'stage:advanced' || data.type === 'stage:rejected') {
            setRoom(data.payload)
          } else if (data.type === 'scratchpad:updated') {
            setScratchpadDraft(data.payload.scratchpad)
          } else if (data.type === 'message:new' || data.type === 'assignment:updated' || data.type === 'mailbox:new' || data.type === 'mailbox:updated') {
            fetchRoomData()
          }
        } catch {}
    })
    return unsubscribe
  }, [])

  // Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
  useEffect(()=>onGroupChatLocaleChange(setLocale),[])
  useEffect(() => {
    if (typeof document === 'undefined') return
    const body = document.body
    if (extensionTabActive && isOpen && !dockFloating) {
      body.setAttribute('data-dsh-group-chat-hud-docked-open', 'true')
      body.style.setProperty('--dsh-group-chat-hud-overlay-width', `${Math.max(0, hudWidth - 16)}px`)
    } else {
      body.removeAttribute('data-dsh-group-chat-hud-docked-open')
      body.style.removeProperty('--dsh-group-chat-hud-overlay-width')
    }
    return () => {
      body.removeAttribute('data-dsh-group-chat-hud-docked-open')
      body.style.removeProperty('--dsh-group-chat-hud-overlay-width')
    }
  }, [extensionTabActive, isOpen, dockFloating, hudWidth])

  useEffect(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('dsh-group-chat.hud-width', String(hudWidth))
  }, [])

  // Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen])

  // Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const width = hudWidth
      const height = Math.min(720, Math.max(420, window.innerHeight - 24))
      const x = Math.max(8, Math.min(window.innerWidth - width - 8, drag.originX + e.clientX - drag.startX))
      const y = Math.max(8, Math.min(window.innerHeight - height - 8, drag.originY + e.clientY - drag.startY))
      setDockFloating(true)
      setDockPos({ x, y })
    }
    const onUp = () => { dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [hudWidth])

  const startDockDrag = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button,select,a,input,textarea')) return
    const rect = (e.currentTarget.closest('.dsh-gc-sidebar-host') as HTMLElement | null)?.getBoundingClientRect()
    const originX = rect?.left ?? Math.max(8, window.innerWidth - hudWidth - 8)
    const originY = rect?.top ?? 24
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX, originY }
  }

  const resetDockPosition = () => {
    dragRef.current = null
    setDockFloating(false)
    setDockPos({ x: 0, y: 24 })
  }

  // Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
  useEffect(() => {
    const clearResize = () => {
      resizeRef.current = null
      setIsResizingHud(false)
      document.body.style.removeProperty('cursor')
      document.body.style.removeProperty('user-select')
      document.documentElement.style.removeProperty('cursor')
    }
    const onMove = (e: PointerEvent) => {
      const resize = resizeRef.current
      if (!resize) return
      if (resize.pointerId !== undefined && e.pointerId !== resize.pointerId) return
      e.preventDefault()
      const max = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, window.innerWidth - 72))
      const nextWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(max, resize.startWidth + resize.startX - e.clientX))
      setHudWidth(Math.round(nextWidth))
      if (resize.floating) {
        const fixedRight = resize.originX + resize.startWidth
        setDockPos(pos => ({ ...pos, x: Math.max(8, fixedRight - nextWidth) }))
      }
    }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', clearResize)
    window.addEventListener('pointercancel', clearResize)
    window.addEventListener('blur', clearResize)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', clearResize)
      window.removeEventListener('pointercancel', clearResize)
      window.removeEventListener('blur', clearResize)
      clearResize()
    }
  }, [])

  const startDockResize = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    document.body.style.setProperty('cursor', 'col-resize')
    document.body.style.setProperty('user-select', 'none')
    document.documentElement.style.setProperty('cursor', 'col-resize')
    setIsResizingHud(true)
    const rect = (e.currentTarget.closest('.dsh-gc-sidebar-host') as HTMLElement | null)?.getBoundingClientRect()
    resizeRef.current = { startX: e.clientX, startWidth: rect?.width || hudWidth, originX: rect?.left || window.innerWidth - hudWidth, floating: dockFloating, pointerId: e.pointerId }
  }
  // Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
  const handleSaveScratchpad = async () => {
    try {
      await fetch('/dsh-group-chat/api/scratchpad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room?.roomId || 'dev-team-alpha',
          scratchpad: scratchpadDraft,
          operatorRoleId: 'commander',
        }),
      })
      setIsEditingScratchpad(false)
    } catch (err) {
      console.error('Save scratchpad error:', err)
    }
  }

  // Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
  const handleApproveStage = async () => {
    try {
      await fetch('/dsh-group-chat/api/workflow/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room?.roomId || 'dev-team-alpha',
          action: 'advance',
          approverRoleId: 'commander',
          summary: '指挥官审核通过，批准进入下一阶段',
        }),
      })
      fetchRoomData()
    } catch (err) {
      console.error('Approve error:', err)
    }
  }

  const updateRoom = async (path:string, data:Record<string,unknown>) => {
    setManagementError('')
    try {
      const response=await fetch('/dsh-group-chat/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomId:room?.roomId||'dev-team-alpha',...data})})
      const result=await response.json()
      if(!response.ok||result.success===false)throw Error(result.error||result.message||tx(locale,'更新失败','Update failed'))
      await fetchRoomData()
    } catch(e){setManagementError(e instanceof Error?e.message:String(e))}
  }


  const updateWorkflowTask = async (stageId:string, taskId:string, status:WorkflowTask['status']) => {
    setManagementError('')
    try {
      const response = await fetch('/dsh-group-chat/api/workflow/task', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({roomId:room?.roomId||'dev-team-alpha', stageId, taskId, status, verifiedByRoleId:'commander', verificationOutput:`HUD 手动修正为 ${status}`}),
      })
      const result = await response.json()
      if(!response.ok||result.success===false)throw Error(result.error||result.message||'任务状态修正失败')
      await fetchRoomData()
    } catch(e){setManagementError(e instanceof Error?e.message:String(e))}
  }

  const applyWorkflowTaskAction = async (stageId:string, taskId:string, action:'retry'|'request_human'|'skip', reason:string) => {
    setManagementError('')
    try {
      const response = await fetch('/dsh-group-chat/api/workflow/task-action', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({roomId:room?.roomId||'dev-team-alpha', stageId, taskId, action, actorRoleId:'commander', reason}),
      })
      const result = await response.json()
      if(!response.ok||result.success===false)throw Error(result.error||result.message||'任务动作执行失败')
      await fetchRoomData()
    } catch(e){setManagementError(e instanceof Error?e.message:String(e))}
  }

  const markMailboxRead = async (mailboxMessageId:string) => {
    setManagementError('')
    try {
      const response = await fetch('/dsh-group-chat/api/mailbox/read', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({roomId:room?.roomId||'dev-team-alpha', mailboxMessageId, readerRoleId:'commander'}),
      })
      const result = await response.json()
      if(!response.ok||result.success===false)throw Error(result.error||result.message||'Mailbox 标记已读失败')
      await fetchRoomData()
    } catch(e){setManagementError(e instanceof Error?e.message:String(e))}
  }

  const generateThemeDraft = async (apply=false) => {
    setManagementError('')
    setThemeBusy(true)
    try {
      const response = await fetch(`/dsh-group-chat/api/theme/${apply ? 'apply-draft' : 'draft'}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({roomId:room?.roomId||'dev-team-alpha', brief:themeBrief, members:themeDraft, workflow:workflowDraft, locale})})
      const result = await response.json()
      if(!response.ok||result.success===false)throw Error(result.error||result.message||tx(locale,'主题生成失败','Theme generation failed'))
      if(apply){ setThemeDraft([]); setWorkflowDraft(null); await fetchRoomData() }
      else { setThemeDraft(result.members || []); setWorkflowDraft(result.workflow || null) }
    } catch(e){setManagementError(e instanceof Error?e.message:String(e))}
    finally { setThemeBusy(false) }
  }

  if (!extensionTabActive) return null

  return (
    <>
      <style>{`.gc-roster-avatar{width:22px;height:22px;border-radius:7px;display:inline-grid;place-items:center;flex-shrink:0;font-size:14px;color:var(--dsw-alias-state-business-primary,#4d6bfe);background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,0.06));}`}</style>
      {editingAgent&&<GroupChatRoleEditor editingAgent={editingAgent} roomId={room?.roomId||'dev-team-alpha'} onClose={()=>setEditingAgent(null)} onSaved={()=>void fetchRoomData()}/>}
      {/**
 * Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
 */}
      {!isOpen && (
        <div
          onClick={() => { setIsOpen(true); if (!dockFloating) setDockPos({ x: Math.max(8, window.innerWidth - SIDEBAR_DEFAULT_WIDTH - 8), y: 24 }) }}
          title={tx(locale,'展开群聊控制台 (HUD)','Open group chat console (HUD)')}
          style={{
            position: 'fixed',
            top: '72px',
            right: '0px',
            zIndex: 49,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            backgroundColor: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
            border: '1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12))',
            borderRight: 'none',
            borderTopLeftRadius: '16px',
            borderBottomLeftRadius: '16px',
            boxShadow: 'var(--dsw-shadow-lv2, 0 4px 12px rgba(0,0,0,0.3))',
            cursor: 'pointer',
            userSelect: 'none',
            color: 'var(--dsw-alias-label-primary, #f8fafc)',
            fontSize: '11px',
            fontWeight: 500,
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
        >
          <span style={{ fontSize: '13px' }}>🧭</span>
          <span>{tx(locale,'群聊副屏','Squad HUD')}</span>
          {room?.workflow && !room.workflow.isCompleted && (
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--dsw-alias-state-business-primary, #4d6bfe)',
            }} />
          )}
        </div>
      )}

      {/**
 * Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
 */}
      <div
        className="dsh-gc-sidebar-host"
        aria-label={tx(locale,'群聊管理侧栏','Group chat management sidebar')}
        aria-hidden={!isOpen}
        inert={!isOpen}
        data-collapsed={!isOpen}
        data-floating={dockFloating}
        data-resizing={isResizingHud}
        style={{
          pointerEvents: isOpen ? 'auto' : 'none',
          left: dockFloating ? dockPos.x : undefined,
          top: dockFloating ? dockPos.y : undefined,
          right: dockFloating ? 'auto' : undefined,
          bottom: dockFloating ? 'auto' : undefined,
          width: `min(${hudWidth}px, calc(100vw - 72px))`,
          height: dockFloating ? 'min(720px, calc(100vh - 24px))' : undefined,
          borderRadius: dockFloating ? 14 : undefined,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--dsw-alias-bg-layer-1, #151518)',
        }}
      >
        <style>{`
          .dsh-gc-sidebar-host,.dsh-gc-sidebar-host *{box-sizing:border-box;min-width:0;}
          .dsh-gc-sidebar-host{overflow:hidden;}
          .dsh-gc-sidebar-host :is(div,span,button,summary,details,p,small,b){max-width:100%;overflow-wrap:anywhere;}
          .dsh-gc-sidebar-host [style*="white-space:nowrap"]{overflow:hidden!important;text-overflow:ellipsis!important;}
          .dsh-gc-sidebar-host details{width:auto!important;max-width:100%!important;overflow:hidden!important;}
          .dsh-gc-sidebar-host summary{max-width:100%!important;overflow:hidden!important;}
          .dsh-gc-sidebar-host select{min-width:0;max-width:100%;}
        `}</style>
        <div
          className="dsh-gc-resize-handle pI_x6G_handle"
          aria-label={tx(locale,'拖动调整群聊右栏宽度','Drag to resize group chat sidebar')}
          title={tx(locale,'拖动调整宽度','Drag to resize')}
          onPointerDown={startDockResize}
          style={{position:'absolute',left:-6,top:0,bottom:0,width:12,cursor:'col-resize',zIndex:3,touchAction:'none',background:'transparent',transition:'none',userSelect:'none'}}
        />
        {/**
 * Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
 */}
        <div onMouseDown={startDockDrag} title={tx(locale,'拖动 HUD','Drag HUD')} style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: dockFloating ? 'grab' : 'move',
          userSelect: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🧭</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dsw-alias-label-primary, #f8fafc)' }}>
                {tx(locale,'群聊控制台 (HUD)','Group chat console (HUD)')}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)' }}>
                {displayRoomTitle}
              </div>
            </div>
          </div>
          <div style={{display:'inline-flex',alignItems:'center',gap:4}} onMouseDown={e=>e.stopPropagation()}>
            <button
              type="button"
              onClick={() => dockFloating ? resetDockPosition() : setDockFloating(true)}
              title={dockFloating ? tx(locale,'贴回右侧','Dock to right') : tx(locale,'切到浮窗','Switch to floating')}
              style={{
                background: 'transparent',
                border: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.08))',
                color: 'var(--dsw-alias-label-secondary, #94a3b8)',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '3px 6px',
                borderRadius: '7px',
              }}
            >
              {dockFloating ? tx(locale,'停靠','Dock') : tx(locale,'浮动','Float')}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--dsw-alias-label-secondary, #94a3b8)',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '4px',
                borderRadius: '4px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <GroupChatHudTopControls
          selectedTheme={selectedTheme}
          selectedMode={selectedMode}
          locale={locale}
          onLocaleChange={setLocale}
          managementError={managementError}
          onThemeChange={theme=>updateRoom('theme',{theme})}
          onModeChange={mode=>updateRoom('mode',{mode})}
        />

        {/**
 * Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
 */}
        <div style={{
          display: 'flex',
          padding: '6px 12px',
          gap: '6px',
          background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
          borderBottom: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.06))',
        }}>
          {[
            { id: 'team', label: tx(locale,'团队','Team') },
            { id: 'workflow', label: tx(locale,'工作流','Workflow') },
            { id: 'scratchpad', label: tx(locale,'黑板','Blackboard') },
            { id: 'ledger', label: tx(locale,'账本','Ledger') },
          ].map(tab => (
            <button
              key={tab.id}
              className="dsh-gc-hud-tab"
              data-dsh-gc-hud-tab={tab.id}
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                padding: '4px 6px',
                fontSize: '11px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab.id ? 'var(--dsw-alias-bg-layer-3, #2a2a30)' : 'transparent',
                color: activeTab === tab.id ? 'var(--dsw-alias-label-primary, #fff)' : 'var(--dsw-alias-label-tertiary, #94a3b8)',
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/**
 * Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
 */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '12px', fontSize: '12px' }}>
          {/**
 * Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
 */}
          {activeTab === 'workflow' && (
            <GroupChatHudWorkflowPanel
              room={room}
              messages={messages}
              onApproveStage={handleApproveStage}
              onUpdateWorkflowTask={updateWorkflowTask}
              onApplyWorkflowTaskAction={applyWorkflowTaskAction}
              onMarkMailboxRead={markMailboxRead}
              locale={locale}
            />
          )}

          {/**
 * Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
 */}
          {activeTab === 'scratchpad' && (
            <GroupChatHudScratchpadPanel
              scratchpadDraft={scratchpadDraft}
              isEditingScratchpad={isEditingScratchpad}
              onScratchpadDraftChange={setScratchpadDraft}
              onEditScratchpad={() => setIsEditingScratchpad(true)}
              onSaveScratchpad={handleSaveScratchpad}
              locale={locale}
            />
          )}

          {/**
 * Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
 */}
          {activeTab === 'team' && (
            <GroupChatHudRosterPanel
              room={room}
              ledger={ledger}
              themeBrief={themeBrief}
              themeBusy={themeBusy}
              themeDraft={themeDraft}
              workflowDraft={workflowDraft}
              onThemeBriefChange={setThemeBrief}
              onApplyTheme={theme=>updateRoom('theme',{theme})}
              onGenerateThemeDraft={generateThemeDraft}
              onEditAgent={setEditingAgent}
              onMarkMailboxRead={markMailboxRead}
              panel="team"
              locale={locale}
            />
          )}

          {/**
 * Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
 */}
          {activeTab === 'ledger' && (
            <GroupChatHudRosterPanel
              room={room}
              ledger={ledger}
              themeBrief={themeBrief}
              themeBusy={themeBusy}
              themeDraft={themeDraft}
              workflowDraft={workflowDraft}
              onThemeBriefChange={setThemeBrief}
              onApplyTheme={theme=>updateRoom('theme',{theme})}
              onGenerateThemeDraft={generateThemeDraft}
              onEditAgent={setEditingAgent}
              onMarkMailboxRead={markMailboxRead}
              panel="ledger"
              locale={locale}
            />
          )}
        </div>

      </div>
    </>
  )
}






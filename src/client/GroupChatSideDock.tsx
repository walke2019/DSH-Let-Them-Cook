import {subscribeGroupChat} from './group-chat-events.js'
import React, { useState, useEffect, useRef } from 'react'
import {GroupChatRoleEditor} from './GroupChatRoleEditor.js'
import {GroupChatHudTopControls} from './GroupChatHudTopControls.js'
import {GroupChatHudWorkflowPanel} from './GroupChatHudWorkflowPanel.js'
import {GroupChatHudRosterPanel} from './GroupChatHudRosterPanel.js'
import {GroupChatHudScratchpadPanel} from './GroupChatHudScratchpadPanel.js'
import {GroupChatHudDiagnosticsPanel} from './GroupChatHudDiagnosticsPanel.js'
import type {AssignmentEnvelope, AgentMailboxMessage, CompatReport, GroupMessageData, LedgerData, WorkflowTask} from './group-chat-hud-types.js'
import type {AgentProfile} from './group-chat-view-types.js'
import {detectGroupChatLocale, onGroupChatLocaleChange, setGroupChatLocale, tx, type GroupChatLocale} from './i18n.js'
import {GroupChatHeroEntry} from './GroupChatHeroEntry.js'
import {DEFAULT_GROUP_CHAT_ROOM_ID, setCurrentGroupChatRoomId, useCurrentGroupChatRoomId} from './current-room.js'

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
  const [compat, setCompat] = useState<CompatReport | null>(null)
  const [scratchpadDraft, setScratchpadDraft] = useState('')
  const [isEditingScratchpad, setIsEditingScratchpad] = useState(false)
  const [activeTab, setActiveTab] = useState<'team' | 'workflow' | 'scratchpad' | 'ledger' | 'diagnostics'>('team')
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
  const [heroMainActive, setHeroMainActive] = useState(false)
  const roomId = useCurrentGroupChatRoomId()
  const selectedTheme = room?.activeTheme === 'meme_comedy' ? 'default' : (room?.activeTheme || 'default')
  const selectedMode = room?.dispatchMode === 'workflow_driven' ? 'default' : (room?.dispatchMode || 'default')
  const displayRoomTitle = (room?.title?.includes('特遣') || room?.title?.includes('AI 小队')) ? tx(locale,'DSH 开整天团工作台','DSH Let Them Cook Workspace') : (room?.title || tx(locale,'DSH 开整天团','DSH Let Them Cook'))
  const [roomPickerOpen, setRoomPickerOpen] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const openRoomPicker = async () => {
    try {
      const res = await fetch('/dsh-group-chat/api/rooms')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.rooms)) setAvailableRooms(data.rooms)
      }
    } catch {}
    setRoomPickerOpen(prev => !prev)
  }
  const switchRoom = (targetId: string | null) => {
    setCurrentGroupChatRoomId(targetId)
    setRoomPickerOpen(false)
  }
  const toggleLocale = () => setGroupChatLocale(locale === 'zh-CN' ? 'en-US' : 'zh-CN')
  useEffect(()=>onGroupChatLocaleChange(setLocale),[])
  useEffect(() => {
    if (heroMainActive) setIsOpen(true)
  }, [heroMainActive])
  useEffect(() => {
    if (typeof document === 'undefined') return
    const refresh = () => {
      setExtensionTabActive(document.body.getAttribute('data-dsh-group-chat-tab-active') === 'true')
      setHeroMainActive(document.body.getAttribute('data-dsh-group-chat-hero-open') === 'true')
    }
    refresh()
    const observer = new MutationObserver(refresh)
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-dsh-group-chat-tab-active', 'data-dsh-group-chat-hero-open'] })
    window.addEventListener('focus', refresh)
    return () => { observer.disconnect(); window.removeEventListener('focus', refresh) }
  }, []) // dsh-group-chat: observe active conversation tab and temporary hero surface

  const fetchCompatData = async () => {
    try {
      const res = await fetch('/dsh-group-chat/api/compat')
      if (!res.ok) return
      const data = await res.json()
      setCompat(data)
    } catch (err) {
      console.error('[GroupChatDock] compat fetch error:', err)
    }
  }

  const fetchRoomData = async () => {
    try {
      const res = await fetch(`/dsh-group-chat/api/room?id=${encodeURIComponent(roomId)}&ensure=1`)
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
    fetchCompatData()

    const pollTimer = window.setInterval(fetchRoomData, 2500)

    const unsubscribe=subscribeGroupChat(e=>{
        try {
          const data = JSON.parse(e.data)
          if (data.roomId && data.roomId !== roomId) return
          if (data.type === 'room:updated' || data.type === 'stage:advanced' || data.type === 'stage:rejected') {
            setRoom(data.payload)
          } else if (data.type === 'scratchpad:updated') {
            setScratchpadDraft(data.payload.scratchpad)
          } else if (data.type === 'message:new' || data.type === 'assignment:updated' || data.type === 'mailbox:new' || data.type === 'mailbox:updated') {
            fetchRoomData()
          }
        } catch {}
    })
    return () => {
      window.clearInterval(pollTimer)
      unsubscribe()
    }
  }, [roomId])

  // Companion HUD: status, configuration, scratchpad, team, workflow, and ledger without duplicating the central chat input.
  useEffect(()=>onGroupChatLocaleChange(setLocale),[])
  useEffect(() => {
    if (typeof document === 'undefined') return
    const body = document.body
    if ((extensionTabActive || heroMainActive) && isOpen && !dockFloating) {
      body.setAttribute('data-dsh-group-chat-hud-docked-open', 'true')
      body.style.setProperty('--dsh-group-chat-hud-overlay-width', `${Math.max(0, hudWidth + 8)}px`)
    } else {
      body.removeAttribute('data-dsh-group-chat-hud-docked-open')
      body.style.removeProperty('--dsh-group-chat-hud-overlay-width')
    }
    return () => {
      body.removeAttribute('data-dsh-group-chat-hud-docked-open')
      body.style.removeProperty('--dsh-group-chat-hud-overlay-width')
    }
  }, [extensionTabActive, heroMainActive, isOpen, dockFloating, hudWidth])

  useEffect(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('dsh-group-chat.hud-width', String(hudWidth))
  }, [roomId])

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
          roomId: room?.roomId || roomId || DEFAULT_GROUP_CHAT_ROOM_ID,
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
          roomId: room?.roomId || roomId || DEFAULT_GROUP_CHAT_ROOM_ID,
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
      const response=await fetch('/dsh-group-chat/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomId:room?.roomId || roomId || DEFAULT_GROUP_CHAT_ROOM_ID,...data})})
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
        body:JSON.stringify({roomId:room?.roomId || roomId || DEFAULT_GROUP_CHAT_ROOM_ID, stageId, taskId, status, verifiedByRoleId:'commander', verificationOutput:`HUD 手动修正为 ${status}`}),
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
        body:JSON.stringify({roomId:room?.roomId || roomId || DEFAULT_GROUP_CHAT_ROOM_ID, stageId, taskId, action, actorRoleId:'commander', reason}),
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
        body:JSON.stringify({roomId:room?.roomId || roomId || DEFAULT_GROUP_CHAT_ROOM_ID, mailboxMessageId, readerRoleId:'commander'}),
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
      const response = await fetch(`/dsh-group-chat/api/theme/${apply ? 'apply-draft' : 'draft'}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({roomId:room?.roomId || roomId || DEFAULT_GROUP_CHAT_ROOM_ID, brief:themeBrief, members:themeDraft, workflow:workflowDraft, locale})})
      const result = await response.json()
      if(!response.ok||result.success===false)throw Error(result.error||result.message||tx(locale,'主题生成失败','Theme generation failed'))
      if(apply){ setThemeDraft([]); setWorkflowDraft(null); await fetchRoomData() }
      else { setThemeDraft(result.members || []); setWorkflowDraft(result.workflow || null) }
    } catch(e){setManagementError(e instanceof Error?e.message:String(e))}
    finally { setThemeBusy(false) }
  }

  const hudSurfaceActive = extensionTabActive || heroMainActive

  return (
    <div data-dsh-group-chat-overlay-root style={{display:'contents'}}>
      {!extensionTabActive && <GroupChatHeroEntry />}
      {hudSurfaceActive && <>
      <style>{`.gc-roster-avatar{width:22px;height:22px;border-radius:7px;display:inline-grid;place-items:center;flex-shrink:0;font-size:14px;color:var(--dsw-alias-state-business-primary,#4d6bfe);background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,0.06));}`}</style>
      {editingAgent&&<GroupChatRoleEditor editingAgent={editingAgent} roomId={room?.roomId || roomId || DEFAULT_GROUP_CHAT_ROOM_ID} onClose={()=>setEditingAgent(null)} onSaved={()=>void fetchRoomData()}/>}
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
          .dsh-gc-hud-head{padding:10px 12px;height:48px;min-height:48px;max-height:48px;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.08));display:flex;align-items:center;justify-content:space-between;gap:8px;user-select:none;box-sizing:border-box;flex-wrap:nowrap!important;}
          .dsh-gc-hud-head, .dsh-gc-hud-head *{overflow-wrap:normal!important;}
          .dsh-gc-hud-head-left{display:flex;align-items:center;gap:8px;min-width:0;flex:1 1 auto;overflow:hidden;}
          .dsh-gc-hud-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary,#f8fafc);white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;line-height:1.2;}
          .dsh-gc-hud-subtitle{font-size:10px;color:var(--dsw-alias-label-tertiary,#94a3b8);white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;line-height:1.2;}
          .dsh-gc-hud-actions{display:inline-flex;align-items:center;gap:4px;flex-shrink:0;white-space:nowrap!important;}
          .dsh-gc-locale-toggle{width:56px;min-width:56px;height:24px;padding:0;border-radius:999px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.12));background:var(--dsw-alias-bg-layer-2,#202025);color:var(--dsw-alias-label-primary,#f8fafc);cursor:pointer;font-size:11px;font-weight:650;line-height:22px;white-space:nowrap!important;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;text-align:center;letter-spacing:-0.2px;}
          .dsh-gc-hud-dock-btn{min-width:44px;height:24px;background:transparent;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.08));color:var(--dsw-alias-label-secondary,#94a3b8);cursor:pointer;font-size:11px;padding:0 6px;border-radius:7px;white-space:nowrap!important;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;text-align:center;}
          .dsh-gc-hud-close-btn{width:24px;height:24px;background:transparent;border:none;color:var(--dsw-alias-label-secondary,#94a3b8);cursor:pointer;font-size:14px;padding:0;border-radius:6px;white-space:nowrap!important;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;}
          .dsh-gc-sidebar-host details{width:auto!important;max-width:100%!important;overflow:hidden!important;}
          .dsh-gc-sidebar-host summary{max-width:100%!important;overflow:hidden!important;}
          .dsh-gc-sidebar-host select{min-width:0;max-width:100%;}
          @media(max-width:760px){.dsh-gc-sidebar-host[data-floating="false"][data-collapsed="false"]{width:min(320px,calc(100vw - 72px))!important;transform:translateX(calc(100% - 44px));box-shadow:var(--dsw-shadow-lv2,-2px 0 12px rgba(0,0,0,.25));}.dsh-gc-sidebar-host[data-floating="false"][data-collapsed="false"]:hover,.dsh-gc-sidebar-host[data-floating="false"][data-collapsed="false"]:focus-within,.dsh-gc-sidebar-host[data-floating="false"][data-collapsed="false"][data-resizing="true"]{transform:translateX(0);}}
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
        <div onMouseDown={startDockDrag} title={tx(locale,'拖动 HUD','Drag HUD')} className="dsh-gc-hud-head" style={{cursor: dockFloating ? 'grab' : 'move'}}>
          <div className="dsh-gc-hud-head-left">
            <span style={{ fontSize: '16px', flexShrink: 0 }}>🧭</span>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="dsh-gc-hud-title" title={tx(locale,'群聊控制台 (HUD)','Group chat console (HUD)')}>
                {tx(locale,'群聊控制台 (HUD)','Group chat console (HUD)')}
              </div>
              <div
                className="dsh-gc-hud-subtitle"
                title={tx(locale, '点击切换作战室', 'Click to switch room') + ': ' + displayRoomTitle}
                onClick={openRoomPicker}
                style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'underline dotted'}}
              >
                <span>{displayRoomTitle}</span>
                <span style={{fontSize: '10px', opacity: 0.7}}>▾</span>
              </div>
            </div>
          </div>
          <div className="dsh-gc-hud-actions" onMouseDown={e=>e.stopPropagation()}>
            <button
              type="button"
              className="dsh-gc-locale-toggle"
              onClick={toggleLocale}
              aria-label={tx(locale,'切换为英文界面','Switch to Chinese UI')}
              title={tx(locale,'中英切换','Language toggle')}
            >
              {locale === 'zh-CN' ? '中 / EN' : 'EN / 中'}
            </button>
            <button
              type="button"
              className="dsh-gc-hud-dock-btn"
              onClick={() => dockFloating ? resetDockPosition() : setDockFloating(true)}
              title={dockFloating ? tx(locale,'贴回右侧','Dock to right') : tx(locale,'切到浮窗','Switch to floating')}
            >
              {dockFloating ? tx(locale,'停靠','Dock') : tx(locale,'浮动','Float')}
            </button>
            <button
              type="button"
              className="dsh-gc-hud-close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>
        {roomPickerOpen && (
          <div
            className="dsh-gc-room-picker"
            style={{
              position: 'absolute',
              top: '46px',
              left: '8px',
              right: '8px',
              background: 'var(--dsh-surface, #1e1e24)',
              border: '1px solid var(--dsh-border, #3b3b44)',
              borderRadius: '8px',
              padding: '8px',
              zIndex: 100,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              maxHeight: '280px',
              overflowY: 'auto'
            }}
          >
            <div style={{fontSize:'12px', fontWeight:600, padding:'4px 6px', color:'var(--dsh-text-muted, #888)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span>{tx(locale, '切换作战室 / 找回任务', 'Switch Room / Recover Tasks')}</span>
              <button type="button" onClick={() => setRoomPickerOpen(false)} style={{background:'none', border:'none', cursor:'pointer', color:'inherit', fontSize:'14px'}}>✕</button>
            </div>
            <div
              onClick={() => switchRoom(null)}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                background: !localStorage.getItem('dsh-group-chat.selected-room-id') ? 'rgba(59,130,246,0.2)' : 'transparent',
                marginTop: '4px'
              }}
            >
              <div style={{fontWeight: 500}}>🔄 {tx(locale, '自动跟随当前会话', 'Auto: Follow Current Session')}</div>
              <div style={{fontSize: '10px', color: 'var(--dsh-text-muted, #888)'}}>{tx(locale, '随 DSH 左栏会话切换而自动切换', 'Switches with DSH session selection')}</div>
            </div>
            {availableRooms.map((r: any) => {
              const isCur = roomId === r.roomId
              const taskCount = r.assignments?.length || 0
              return (
                <div
                  key={r.roomId}
                  onClick={() => switchRoom(r.roomId)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    background: isCur ? 'rgba(59,130,246,0.2)' : 'transparent',
                    marginTop: '4px',
                    borderTop: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <div style={{fontWeight: 500, display: 'flex', justifyContent: 'space-between'}}>
                    <span>{r.roomId === 'dev-team-alpha' ? '🏠 默认小队 (dev-team-alpha)' : `💬 ${r.title || '作战室'} (${r.roomId.replace(/^dsh-session-/, '').slice(0, 8)}…)`}</span>
                    {taskCount > 0 && <span style={{color: '#10b981', fontSize: '11px'}}>{taskCount} {tx(locale, '任务', 'tasks')}</span>}
                  </div>
                  {r.pinnedGoal && <div style={{fontSize: '11px', color: 'var(--dsh-text-muted, #888)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px'}}>{r.pinnedGoal}</div>}
                </div>
              )
            })}
          </div>
        )}

        <GroupChatHudTopControls
          selectedTheme={selectedTheme}
          selectedMode={selectedMode}
          locale={locale}
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
            { id: 'diagnostics', label: tx(locale,'诊断','Diagnostics') },
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
              messages={messages}
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
              messages={messages}
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

          {activeTab === 'diagnostics' && (
            <GroupChatHudDiagnosticsPanel
              compat={compat}
              ledgerSource={compat?.features?.sessionProjectionStateOf ? 'dsh-session-projections' : 'event-stream-usage'}
              watchdogSource="dsh-runtime-liveness"
              toolEventSource="dsh-tool-event-adapter"
              locale={locale}
            />
          )}
        </div>

      </div>
      </>}
    </div>
  )
}


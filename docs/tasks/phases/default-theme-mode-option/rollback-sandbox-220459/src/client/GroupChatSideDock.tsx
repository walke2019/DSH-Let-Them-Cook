import {subscribeGroupChat} from './group-chat-events.js'
import {AvatarBadge} from './AvatarBadge.js'
import React, { useState, useEffect } from 'react'
import { updateLayoutPushWidth } from './layout-push.js'
import {GroupChatRoleEditor} from './GroupChatRoleEditor.js'
import type {AgentProfile} from './group-chat-view-types.js'

const SIDEBAR_DEFAULT_WIDTH = 380

interface RoomData {
  roomId: string
  title: string
  id?: string
  name?: string
  activeTheme: 'modern' | 'three_kingdoms' | 'legends' | 'meme_comedy' | 'genshin' | string
  dispatchMode: 'mention_only' | 'moderator_led' | 'workflow_driven' | 'free_discussion'
  scratchpad: string
  workflow: {
    stages: Array<{
      id: string
      name: string
      description: string
      assignedRoleIds: string[]
      status: 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'rejected'
      deliverableSummary?: string
      requiresApproval: boolean
    }>
    currentStageIndex: number
    isCompleted: boolean
  }
  members: AgentProfile[]
}

interface RuntimeMetrics {
  turnCount: number
  stepCount: number
  llmMs: number
  toolMs: number
  firstTokenMsTotal: number
  firstTokenCount: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

interface ModelLedgerData {
  provider: string
  model: string
  callCount: number
  totalTokens: number
  metrics: RuntimeMetrics
}

interface LedgerData {
  totalCalls: number
  totalTokens: number
  metrics?: RuntimeMetrics
  agentStats: Record<string, {
    agentName: string
    callCount: number
    totalTokens: number
    metrics?: RuntimeMetrics
    modelStats?: Record<string, ModelLedgerData>
  }>
}


function formatDuration(ms=0): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return minutes ? `${minutes}m${rest}s` : `${rest}s`
}

function formatTokens(n=0): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 1 : 2)}K`
  return `${Math.round(n)}`
}

function metricLine(calls=0, m?: RuntimeMetrics): string {
  const input = (m?.inputTokens || 0) + (m?.cacheReadTokens || 0) + (m?.cacheWriteTokens || 0)
  const output = m?.outputTokens || 0
  const totalInputForCache = (m?.inputTokens || 0) + (m?.cacheReadTokens || 0)
  const cacheHit = totalInputForCache ? Math.round(((m?.cacheReadTokens || 0) / totalInputForCache) * 100) : 0
  const first = m?.firstTokenCount ? `${((m.firstTokenMsTotal / m.firstTokenCount) / 1000).toFixed(1)}s` : '—'
  const llmSeconds = (m?.llmMs || 0) / 1000
  const tokPerSec = llmSeconds > 0 ? Math.round(output / llmSeconds) : 0
  return `${calls} 轮 · ${m?.stepCount || 0} 步  LLM ${formatDuration(m?.llmMs)} · 工具调用 ${formatDuration(m?.toolMs)}  首 token 平均 ${first} · ${tokPerSec} tok/s  缓存命中 ${cacheHit}%  输入 ${formatTokens(input)} tok · 输出 ${formatTokens(output)} tok`
}

function mergeMetrics(items: Array<RuntimeMetrics | undefined>): RuntimeMetrics {
  return items.reduce((acc,m)=>({
    turnCount: acc.turnCount + (m?.turnCount || 0), stepCount: acc.stepCount + (m?.stepCount || 0), llmMs: acc.llmMs + (m?.llmMs || 0), toolMs: acc.toolMs + (m?.toolMs || 0),
    firstTokenMsTotal: acc.firstTokenMsTotal + (m?.firstTokenMsTotal || 0), firstTokenCount: acc.firstTokenCount + (m?.firstTokenCount || 0),
    inputTokens: acc.inputTokens + (m?.inputTokens || 0), outputTokens: acc.outputTokens + (m?.outputTokens || 0), cacheReadTokens: acc.cacheReadTokens + (m?.cacheReadTokens || 0), cacheWriteTokens: acc.cacheWriteTokens + (m?.cacheWriteTokens || 0),
  }), {turnCount:0,stepCount:0,llmMs:0,toolMs:0,firstTokenMsTotal:0,firstTokenCount:0,inputTokens:0,outputTokens:0,cacheReadTokens:0,cacheWriteTokens:0})
}

/**
 * 侧边栏辅助副屏 (Companion HUD)
 * 定位：区别于全屏主对话输入区，侧栏仅提供轻量、高密度的【拓扑监控 + 共享黑板 + 成员账本】，不再重复聊天发送入口。
 */
export function GroupChatSideDock() {
  const [isOpen, setIsOpen] = useState(false)
  const [editingAgent,setEditingAgent] = useState<AgentProfile|null>(null)
  const [managementError,setManagementError] = useState('')
  const [room, setRoom] = useState<RoomData | null>(null)
  const [ledger, setLedger] = useState<LedgerData | null>(null)
  const [scratchpadDraft, setScratchpadDraft] = useState('')
  const [isEditingScratchpad, setIsEditingScratchpad] = useState(false)
  const [activeTab, setActiveTab] = useState<'workflow' | 'scratchpad' | 'roster'>('workflow')
  const [modeHelpOpen, setModeHelpOpen] = useState(false)
  const [themeBrief,setThemeBrief] = useState('沙雕但靠谱的互联网项目小队，说人话、有梗、能交付；顺手按任务生成工作流')
  const [themeBusy,setThemeBusy] = useState(false)
  const [themeDraft,setThemeDraft] = useState<AgentProfile[]>([])
  const [workflowDraft,setWorkflowDraft] = useState<any>(null)

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
          } else if (data.type === 'message:new') {
            fetchRoomData()
          }
        } catch {}
    })
    return unsubscribe
  }, [])

  // 监听打开/收起状态，推挤 DSH 页面
  useEffect(() => {
    if (isOpen) {
      updateLayoutPushWidth(SIDEBAR_DEFAULT_WIDTH)
    } else {
      updateLayoutPushWidth(0)
    }
  }, [isOpen])

  // Esc 收起
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen])

  // 保存共享黑板
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

  // 审批放行
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
      if(!response.ok||result.success===false)throw Error(result.error||result.message||'更新失败')
      await fetchRoomData()
    } catch(e){setManagementError(e instanceof Error?e.message:String(e))}
  }


  const generateThemeDraft = async (apply=false) => {
    setManagementError('')
    setThemeBusy(true)
    try {
      const response = await fetch(`/dsh-group-chat/api/theme/${apply ? 'apply-draft' : 'draft'}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({roomId:room?.roomId||'dev-team-alpha', brief:themeBrief, members:themeDraft, workflow:workflowDraft})})
      const result = await response.json()
      if(!response.ok||result.success===false)throw Error(result.error||result.message||'主题生成失败')
      if(apply){ setThemeDraft([]); setWorkflowDraft(null); await fetchRoomData() }
      else { setThemeDraft(result.members || []); setWorkflowDraft(result.workflow || null) }
    } catch(e){setManagementError(e instanceof Error?e.message:String(e))}
    finally { setThemeBusy(false) }
  }

  return (
    <>
      <style>{`.gc-roster-avatar{width:22px;height:22px;border-radius:7px;display:inline-grid;place-items:center;flex-shrink:0;font-size:14px;color:var(--dsw-alias-state-business-primary,#4d6bfe);background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,0.06));}`}</style>
      {editingAgent&&<GroupChatRoleEditor editingAgent={editingAgent} roomId={room?.roomId||'dev-team-alpha'} onClose={()=>setEditingAgent(null)} onSaved={()=>void fetchRoomData()}/>}
      {modeHelpOpen && (
        <div role="dialog" aria-modal="true" aria-label="调度模式 QA 说明" onClick={()=>setModeHelpOpen(false)} style={{position:'fixed',inset:0,zIndex:1000,display:'grid',placeItems:'center',background:'rgba(0,0,0,0.52)',pointerEvents:'auto'}}>
          <div onClick={e=>e.stopPropagation()} style={{width:'min(560px, calc(100vw - 32px))',maxHeight:'calc(100vh - 80px)',overflowY:'auto',border:'1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.14))',borderRadius:16,background:'var(--dsw-alias-bg-layer-1, #1f1f23)',boxShadow:'var(--dsw-shadow-lv3, 0 20px 60px rgba(0,0,0,0.45))',color:'var(--dsw-alias-label-primary,#f8fafc)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.08))'}}>
              <div>
                <div style={{fontSize:14,fontWeight:700}}>调度模式 QA 速查</div>
                <div style={{fontSize:11,color:'var(--dsw-alias-label-tertiary,#94a3b8)',marginTop:2}}>不知道怎么用时，直接按场景选下面四种。</div>
              </div>
              <button type="button" onClick={()=>setModeHelpOpen(false)} aria-label="关闭调度模式说明" style={{width:28,height:28,borderRadius:8,border:'1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.14))',background:'var(--dsw-alias-bg-layer-2,#202025)',color:'inherit',cursor:'pointer'}}>×</button>
            </div>
            <div style={{display:'grid',gap:10,padding:'14px 16px',fontSize:12,lineHeight:1.55}}>
              {[
                ['仅 @ 角色','你明确 @ 谁，谁才发言；不 @ 就只入库。适合精准点名单问，例如：@前端工程师 优化这个下拉。'],
                ['工作流','按右侧五阶段推进当前任务；当前阶段责任人先执行，阶段产物需要总指挥审核后进入下一阶段。适合完整项目、需求→实现→审计→文档。'],
                ['主持人调度','每次人类消息先交给总指挥拆解，再由总指挥安排后续角色。适合你不想自己点名、但仍希望有人把控节奏。'],
                ['自由讨论','所有角色都收到主题并自行判断是否相关；无关角色返回 NO_REPLY 被静默。适合头脑风暴，但调用量会更多。'],
              ].map(([title,body])=>(
                <div key={title} style={{padding:'10px 12px',borderRadius:12,background:'var(--dsw-alias-bg-layer-2,#242428)',border:'1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.08))'}}>
                  <div style={{fontWeight:700,marginBottom:4}}>{title}</div>
                  <div style={{color:'var(--dsw-alias-label-secondary,#cbd5e1)'}}>{body}</div>
                </div>
              ))}
              <div style={{padding:'10px 12px',borderRadius:12,background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.24)',color:'var(--dsw-alias-label-secondary,#cbd5e1)'}}>
                <b style={{color:'var(--dsw-alias-label-primary,#f8fafc)'}}>工作区隔离：</b>角色编辑、模型/回退模型与调度状态保存在当前 DSH 工作区的 <code>.pm-workflow/dsh-group-chat/</code>，不是全局配置；换工作区不会串配置。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. 贴边收起把手 */}
      {!isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          title="展开特遣协同副屏 (实时监控 HUD)"
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
          <span>特遣副屏</span>
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

      {/* 2. 侧栏副屏容器 (Layout-Push 推挤宿主) */}
      <div
        className="dsh-gc-sidebar-host"
        aria-label="群聊管理侧栏"
        aria-hidden={!isOpen}
        inert={!isOpen}
        data-collapsed={!isOpen}
        style={{
          pointerEvents: isOpen ? 'auto' : 'none',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--dsw-alias-bg-layer-1, #151518)',
        }}
      >
        {/* 副屏头部 */}
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🧭</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dsw-alias-label-primary, #f8fafc)' }}>
                特遣监控室 (HUD)
              </div>
              <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)' }}>
                {room?.title || '群聊设置'}
              </div>
            </div>
          </div>
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

        <div style={{padding:'10px 14px',display:'grid',gridTemplateColumns:'auto minmax(74px,1fr) auto minmax(78px,1fr) 28px',columnGap:8,rowGap:6,fontSize:11,alignItems:'center',whiteSpace:'nowrap'}}>
          <span style={{color:'var(--dsw-alias-label-secondary, #cbd5e1)',height:30,display:'inline-flex',alignItems:'center'}}>角色主题</span>
          <span style={{position:'relative',display:'block',minWidth:0}}>
            <select aria-label="角色主题" value={room?.activeTheme||'modern'} onChange={e=>void updateRoom('theme',{theme:e.target.value})} style={{width:'100%',height:30,boxSizing:'border-box',appearance:'none',WebkitAppearance:'none',border:'1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.14))',borderRadius:10,background:'var(--dsw-alias-bg-layer-2, #202025)',color:'var(--dsw-alias-label-primary, #f8fafc)',font:'inherit',fontSize:12,padding:'0 28px 0 10px',outline:'none'}}>
              <option value="meme_comedy">沙雕整活</option><option value="genshin">原神提瓦特</option><option value="modern">现代精英</option><option value="three_kingdoms">三国风云</option><option value="legends">现代传奇</option>
            </select>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{position:'absolute',right:9,top:'50%',width:14,height:14,transform:'translateY(-50%)',pointerEvents:'none',color:'var(--dsw-alias-label-tertiary,#9ca3af)'}}><path d="M4 6l4 4 4-4"/></svg>
          </span>
          <span style={{color:'var(--dsw-alias-label-secondary, #cbd5e1)',height:30,display:'inline-flex',alignItems:'center'}}>调度模式</span>
          <span style={{position:'relative',display:'block',minWidth:0}}>
            <select aria-label="调度模式" value={room?.dispatchMode||'mention_only'} onChange={e=>void updateRoom('mode',{mode:e.target.value})} style={{width:'100%',height:30,boxSizing:'border-box',appearance:'none',WebkitAppearance:'none',border:'1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.14))',borderRadius:10,background:'var(--dsw-alias-bg-layer-2, #202025)',color:'var(--dsw-alias-label-primary, #f8fafc)',font:'inherit',fontSize:12,padding:'0 28px 0 10px',outline:'none'}}>
              <option value="mention_only">仅 @ 角色</option><option value="workflow_driven">工作流</option><option value="moderator_led">主持人调度</option><option value="free_discussion">自由讨论</option>
            </select>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{position:'absolute',right:9,top:'50%',width:14,height:14,transform:'translateY(-50%)',pointerEvents:'none',color:'var(--dsw-alias-label-tertiary,#9ca3af)'}}><path d="M4 6l4 4 4-4"/></svg>
          </span>
          <button type="button" aria-label="查看调度模式 QA 说明" title="调度模式 QA" onClick={()=>setModeHelpOpen(true)} style={{width:28,height:28,borderRadius:9,border:'1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.14))',background:'var(--dsw-alias-bg-layer-2,#202025)',color:'var(--dsw-alias-label-secondary,#cbd5e1)',fontSize:13,fontWeight:700,cursor:'pointer'}}>?</button>
          {managementError&&<div role="alert" style={{gridColumn:'1 / -1',color:'#fca5a5'}}>{managementError}</div>}
        </div>

        {/* 导航微标签 */}
        <div style={{
          display: 'flex',
          padding: '6px 12px',
          gap: '6px',
          background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
          borderBottom: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.06))',
        }}>
          {[
            { id: 'workflow', label: '工作流拓扑' },
            { id: 'scratchpad', label: '共享黑板' },
            { id: 'roster', label: '角色与账本' },
          ].map(tab => (
            <button
              key={tab.id}
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

        {/* 副屏内容区 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', fontSize: '12px' }}>
          {/* A. 工作流实时拓扑 */}
          {activeTab === 'workflow' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--dsw-alias-label-secondary, #94a3b8)',
                marginBottom: '4px',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>阶段流程（共 {room?.workflow?.stages?.length || 0} 步）</span>
                <span style={{ color: 'var(--dsw-alias-state-business-primary, #4d6bfe)' }}>
                  {room?.workflow?.isCompleted ? '已全部验收完成 ✓' : `进行中: 第 ${(room?.workflow?.currentStageIndex || 0) + 1} 步`}
                </span>
              </div>

              {room?.workflow?.stages.map((st, idx) => {
                const isCurrent = idx === room.workflow.currentStageIndex && !room.workflow.isCompleted
                const isPast = idx < room.workflow.currentStageIndex || room.workflow.isCompleted
                const isWaitingApproval = st.status === 'awaiting_approval'

                return (
                  <div
                    key={st.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: isCurrent
                        ? 'rgba(77, 107, 254, 0.08)'
                        : 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
                      border: isCurrent
                        ? '1px solid var(--dsw-alias-state-business-primary, #4d6bfe)'
                        : '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: isPast ? '#10b981' : isCurrent ? '#4d6bfe' : '#475569',
                          color: '#fff',
                        }}>
                          {isPast ? '✓' : idx + 1}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--dsw-alias-label-primary, #f8fafc)' }}>
                          {st.name}
                        </span>
                      </div>

                      <span style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        backgroundColor: isWaitingApproval
                          ? 'rgba(234, 179, 8, 0.15)'
                          : isCurrent
                          ? 'rgba(77, 107, 254, 0.15)'
                          : 'transparent',
                        color: isWaitingApproval
                          ? '#eab308'
                          : isCurrent
                          ? '#60a5fa'
                          : 'var(--dsw-alias-label-caption, #64748b)',
                      }}>
                        {st.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', marginTop: '4px' }}>
                      {st.description}
                    </div>

                    {/* 待指挥官审批门控提示 */}
                    {isWaitingApproval && (
                      <div style={{
                        marginTop: '8px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: 'rgba(234, 179, 8, 0.1)',
                        border: '1px dashed rgba(234, 179, 8, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <span style={{ color: '#eab308', fontSize: '11px' }}>⚠️ 产物就绪，等待指挥官放行</span>
                        <button
                          onClick={handleApproveStage}
                          style={{
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          批准放行
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* B. 共享黑板 */}
          {activeTab === 'scratchpad' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--dsw-alias-label-secondary, #94a3b8)', fontSize: '11px' }}>
                  团队共识备忘录 (Markdown)
                </span>
                {!isEditingScratchpad ? (
                  <button
                    onClick={() => setIsEditingScratchpad(true)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.1))',
                      color: 'var(--dsw-alias-label-primary, #fff)',
                      fontSize: '10px',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      cursor: 'pointer',
                    }}
                  >
                    ✏️ 编辑
                  </button>
                ) : (
                  <button
                    onClick={handleSaveScratchpad}
                    style={{
                      backgroundColor: 'var(--dsw-alias-state-business-primary, #4d6bfe)',
                      color: '#fff',
                      border: 'none',
                      fontSize: '10px',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    保存
                  </button>
                )}
              </div>

              {isEditingScratchpad ? (
                <textarea
                  value={scratchpadDraft}
                  onChange={e => setScratchpadDraft(e.target.value)}
                  style={{
                    flex: 1,
                    minHeight: '260px',
                    width: '100%',
                    background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
                    border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.1))',
                    borderRadius: '8px',
                    color: 'var(--dsw-alias-label-primary, #f8fafc)',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    padding: '8px',
                    resize: 'none',
                  }}
                />
              ) : (
                <div style={{
                  flex: 1,
                  minHeight: '260px',
                  background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
                  border: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))',
                  borderRadius: '8px',
                  padding: '10px',
                  color: 'var(--dsw-alias-label-primary, #f8fafc)',
                  whiteSpace: 'pre-wrap',
                  overflowY: 'auto',
                  lineHeight: '1.5',
                }}>
                  {scratchpadDraft || '（暂无黑板内容，指挥官与文案写手可随时写入技术决策）'}
                </div>
              )}
            </div>
          )}

          {/* C. 特遣账本与成员花名册 */}
          {activeTab === 'roster' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

              <div style={{
                background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(77,107,254,0.10))',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(236,72,153,0.22)',
                display: 'grid',
                gap: '8px',
              }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--dsw-alias-label-primary,#f8fafc)'}}>AI 造主题角色 + 工作流</div>
                  <button type="button" onClick={()=>void updateRoom('theme',{theme:'meme_comedy'})} style={{fontSize:10,padding:'3px 8px',borderRadius:999,border:'1px solid rgba(255,255,255,0.14)',background:'var(--dsw-alias-bg-layer-2,#202025)',color:'var(--dsw-alias-label-primary,#fff)',cursor:'pointer'}}>套用沙雕整活</button>
                  <button type="button" onClick={()=>void updateRoom('theme',{theme:'genshin'})} style={{fontSize:10,padding:'3px 8px',borderRadius:999,border:'1px solid rgba(255,255,255,0.14)',background:'var(--dsw-alias-bg-layer-2,#202025)',color:'var(--dsw-alias-label-primary,#fff)',cursor:'pointer'}}>套用原神</button>
                </div>
                <textarea value={themeBrief} onChange={e=>setThemeBrief(e.target.value)} placeholder="例如：赛博修仙创业公司做知识库、猫猫宇宙产品战队改插件、东北烧烤摊式研发部做运营页……" style={{minHeight:54,resize:'vertical',borderRadius:9,border:'1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.12))',background:'var(--dsw-alias-bg-layer-1,#151518)',color:'var(--dsw-alias-label-primary,#f8fafc)',fontSize:11,lineHeight:1.45,padding:'8px'}} />
                <div style={{display:'flex',gap:8}}>
                  <button type="button" disabled={themeBusy} onClick={()=>void generateThemeDraft(false)} style={{flex:1,fontSize:11,padding:'6px 8px',borderRadius:9,border:'1px solid rgba(255,255,255,0.14)',background:'var(--dsw-alias-bg-layer-2,#202025)',color:'var(--dsw-alias-label-primary,#fff)',cursor:'pointer'}}>{themeBusy?'生成中…':'生成草案'}</button>
                  <button type="button" disabled={themeBusy} onClick={()=>void generateThemeDraft(true)} style={{flex:1,fontSize:11,padding:'6px 8px',borderRadius:9,border:'none',background:'var(--dsw-alias-state-business-primary,#4d6bfe)',color:'#fff',cursor:'pointer',fontWeight:700}}>生成并套用</button>
                </div>
                {themeDraft.length>0 && <div style={{display:'grid',gap:6}}>
                  <div style={{fontSize:10,color:'var(--dsw-alias-label-tertiary,#94a3b8)'}}>草案预览：会同时生成工作流；可先套用，再用每个角色右侧「编辑」细调。</div>
                  {workflowDraft&&<div style={{fontSize:10,color:'var(--dsw-alias-label-secondary,#cbd5e1)',padding:'6px 7px',borderRadius:8,background:'rgba(77,107,254,0.10)'}}>工作流：{workflowDraft.title} · {workflowDraft.stages?.length||0} 步</div>}
                  {themeDraft.map(item=><div key={item.id} style={{display:'flex',alignItems:'center',gap:7,fontSize:11,color:'var(--dsw-alias-label-secondary,#cbd5e1)',minWidth:0}}><AvatarBadge avatar={item.avatar} className="gc-roster-avatar"/><span style={{fontWeight:700,color:'var(--dsw-alias-label-primary,#fff)'}}>{item.name}</span><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</span></div>)}
                  <button type="button" disabled={themeBusy} onClick={()=>void generateThemeDraft(true)} style={{fontSize:11,padding:'6px 8px',borderRadius:9,border:'none',background:'#10b981',color:'#fff',cursor:'pointer',fontWeight:700}}>套用这个草案</button>
                </div>}
              </div>

              <div style={{
                background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))',
                display: 'grid',
                gap: '8px',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                  <div style={{ fontSize: '11px', color: 'var(--dsw-alias-label-secondary, #94a3b8)', fontWeight: 600 }}>总体运行统计</div>
                  <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-caption, #64748b)' }}>官方摘要风格</div>
                </div>
                <div style={{ fontSize:'11px', lineHeight:1.55, color:'var(--dsw-alias-label-primary,#f8fafc)', whiteSpace:'normal' }}>
                  {metricLine(ledger?.totalCalls || 0, ledger?.metrics || mergeMetrics(Object.values(ledger?.agentStats || {}).map(s=>s.metrics)))}
                </div>
                <details style={{borderTop:'1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))',paddingTop:8}}>
                  <summary style={{cursor:'pointer',fontSize:11,color:'var(--dsw-alias-label-secondary,#cbd5e1)',userSelect:'none'}}>按 Agent / 模型展开</summary>
                  <div style={{display:'grid',gap:8,marginTop:8}}>
                    {Object.entries(ledger?.agentStats || {}).map(([agentId,stat])=>(
                      <div key={agentId} style={{padding:'8px 9px',borderRadius:8,background:'var(--dsw-alias-bg-layer-1,#151518)',border:'1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))'}}>
                        <div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:11,fontWeight:700,color:'var(--dsw-alias-label-primary,#f8fafc)'}}><span>{stat.agentName}</span><span>{stat.totalTokens || 0} T</span></div>
                        <div style={{fontSize:10,color:'var(--dsw-alias-label-tertiary,#94a3b8)',marginTop:4}}>{metricLine(stat.callCount || 0, stat.metrics)}</div>
                        {Object.values(stat.modelStats || {}).map(ms=>(
                          <div key={`${ms.provider}/${ms.model}`} style={{marginTop:6,paddingTop:6,borderTop:'1px dashed var(--dsw-alias-border-l1, rgba(255,255,255,0.08))',fontSize:10,color:'var(--dsw-alias-label-secondary,#cbd5e1)'}}>
                            <div style={{fontWeight:600,color:'var(--dsw-alias-label-primary,#f8fafc)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ms.provider} / {ms.model}</div>
                            <div style={{marginTop:2,color:'var(--dsw-alias-label-tertiary,#94a3b8)'}}>{metricLine(ms.callCount || 0, ms.metrics)}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                    {Object.keys(ledger?.agentStats || {}).length===0 && <div style={{fontSize:11,color:'var(--dsw-alias-label-tertiary,#94a3b8)'}}>暂无 Agent 调用记录；首次角色发言后会显示分项。</div>}
                  </div>
                </details>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--dsw-alias-label-secondary, #94a3b8)', marginTop: '4px' }}>
                成员列表（{room?.members.length || 0} 人）
              </div>

              {room?.members.map(member => {
                const stat = ledger?.agentStats[member.id]
                return (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AvatarBadge avatar={member.avatar} className="gc-roster-avatar" />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--dsw-alias-label-primary, #f8fafc)', fontSize: '11px' }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-caption, #64748b)' }}>
                          {member.title || member.id}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap' }}>
                      <span>{stat?.callCount || 0} 轮</span>
                      <span>{stat?.totalTokens || 0} T</span>
                      <button type="button" onClick={()=>setEditingAgent(member)} aria-label={`编辑${member.name}`}>编辑</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </>
  )
}



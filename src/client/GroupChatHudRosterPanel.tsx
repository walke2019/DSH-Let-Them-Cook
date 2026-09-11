import {useMemo, useState} from 'react'
import {AvatarBadge} from './AvatarBadge.js'
import type {AgentProfile} from './group-chat-view-types.js'
import type {AgentMailboxMessage, AssignmentEnvelope, LedgerData, RuntimeMetrics} from './group-chat-hud-types.js'
import {hudCardStyle, hudGhostButtonStyle, hudPanelStackStyle, hudPrimaryButtonStyle, hudTextAreaStyle, hudTokens} from './group-chat-hud-styles.js'
import {tx, txRoleName, txRoleTitle, type GroupChatLocale} from './i18n.js'

interface ThemeWorkflowDraft { title?: string; stages?: unknown[] }

interface GroupChatHudRosterPanelProps {
  room: RoomData | null
  ledger: LedgerData | null
  messages?: any[]
  themeBrief: string
  themeBusy: boolean
  themeDraft: AgentProfile[]
  workflowDraft: ThemeWorkflowDraft | null
  onThemeBriefChange: (value: string) => void
  onApplyTheme: (theme: 'meme_comedy' | 'genshin') => void
  onGenerateThemeDraft: (apply: boolean) => void
  onEditAgent: (agent: AgentProfile) => void
  onMarkMailboxRead: (mailboxMessageId: string) => void
  panel?: 'team' | 'ledger'
  locale?: GroupChatLocale
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
  const inTok = m?.inputTokens || 0
  const cacheRead = m?.cacheReadTokens || 0
  const cacheWrite = m?.cacheWriteTokens || 0
  const promptTokens = inTok + cacheRead + cacheWrite
  const output = m?.outputTokens || 0
  const cacheHit = promptTokens > 0 ? Math.round((cacheRead / promptTokens) * 100) : 0
  const first = m?.firstTokenCount ? `${((m.firstTokenMsTotal / m.firstTokenCount) / 1000).toFixed(1)}s` : '—'
  const llmSeconds = (m?.llmMs || 0) / 1000
  const tokPerSec = llmSeconds > 0 ? Math.round(output / llmSeconds) : 0
  return `${calls} 轮 · ${m?.stepCount || 0} 步  LLM ${formatDuration(m?.llmMs)} · 工具调用 ${formatDuration(m?.toolMs)}  首 token 平均 ${first} · ${tokPerSec} tok/s  缓存命中 ${cacheHit}%  输入 ${formatTokens(promptTokens)} tok · 输出 ${formatTokens(output)} tok`
}

function mergeMetrics(items: Array<RuntimeMetrics | undefined>): RuntimeMetrics {
  return items.reduce((acc,m)=>({
    turnCount: acc.turnCount + (m?.turnCount || 0), stepCount: acc.stepCount + (m?.stepCount || 0), llmMs: acc.llmMs + (m?.llmMs || 0), toolMs: acc.toolMs + (m?.toolMs || 0),
    firstTokenMsTotal: acc.firstTokenMsTotal + (m?.firstTokenMsTotal || 0), firstTokenCount: acc.firstTokenCount + (m?.firstTokenCount || 0),
    inputTokens: acc.inputTokens + (m?.inputTokens || 0), outputTokens: acc.outputTokens + (m?.outputTokens || 0), cacheReadTokens: acc.cacheReadTokens + (m?.cacheReadTokens || 0), cacheWriteTokens: acc.cacheWriteTokens + (m?.cacheWriteTokens || 0),
  }), {turnCount:0,stepCount:0,llmMs:0,toolMs:0,firstTokenMsTotal:0,firstTokenCount:0,inputTokens:0,outputTokens:0,cacheReadTokens:0,cacheWriteTokens:0})
}

function statusColor(status: string): { bg: string; fg: string; border: string } {
  if (status === 'passed' || status === 'completed') return { bg: 'rgba(16,185,129,0.12)', fg: '#34d399', border: 'rgba(16,185,129,0.28)' }
  if (status === 'running' || status === 'in_progress' || status === 'ready') return { bg: 'rgba(77,107,254,0.12)', fg: '#60a5fa', border: 'rgba(77,107,254,0.30)' }
  if (status === 'failed' || status === 'rejected') return { bg: 'rgba(248,113,113,0.12)', fg: '#fca5a5', border: 'rgba(248,113,113,0.30)' }
  if (status === 'request_human' || status === 'awaiting_approval') return { bg: 'rgba(234,179,8,0.12)', fg: '#fbbf24', border: 'rgba(234,179,8,0.30)' }
  return { bg: 'rgba(148,163,184,0.10)', fg: '#94a3b8', border: 'rgba(148,163,184,0.20)' }
}

function shortId(id = ''): string { return id.length > 8 ? `${id.slice(0, 8)}…` : id }

export function GroupChatHudRosterPanel({
  room,
  ledger,
  messages,
  themeBrief,
  themeBusy,
  themeDraft,
  workflowDraft,
  onThemeBriefChange,
  onApplyTheme,
  onGenerateThemeDraft,
  onEditAgent,
  onMarkMailboxRead,
  panel = 'team',
  locale = 'zh-CN',
}: GroupChatHudRosterPanelProps) {
  const agentStats = ledger?.agentStats || {}
  const anyMailbox = Object.values(room?.mailboxes || {}).some(list=>list.length>0)
  const isTeamPanel = panel === 'team'
  const isLedgerPanel = panel === 'ledger'
  const [teamSearch, setTeamSearch] = useState('')
  const [ledgerSearch, setLedgerSearch] = useState('')
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'active' | 'unread'>('all')
  const assignmentRecords = useMemo(() => [...(room?.assignments || [])].reverse(), [room?.assignments])
  const mailboxRecords = useMemo(() => Object.entries(room?.mailboxes || {}).flatMap(([to, list]) => list.map(message => ({to, message}))).reverse(), [room?.mailboxes])
  const unreadMailboxCount = mailboxRecords.filter(item => !item.message.readAt).length
  const activeAssignmentCount = assignmentRecords.filter(item => item.status === 'queued' || item.status === 'running').length
  const ledgerNeedle = ledgerSearch.trim().toLowerCase()

  const computedMetrics = useMemo(() => {
    const raw = ledger?.metrics || mergeMetrics(Object.values(agentStats).map(s=>s.metrics))
    if ((raw.inputTokens > 0 || raw.outputTokens > 0) && raw.llmMs > 0) return raw

    let inTok = 0
    let outTok = 0
    let llmTime = 0
    let steps = 0
    for (const msg of (messages || [])) {
      if (msg.sender?.kind === 'agent') {
        steps += 1
        const consumed = msg.metadata?.tokensConsumed
        if (consumed && (consumed.promptTokens > 0 || consumed.completionTokens > 0)) {
          inTok += consumed.promptTokens
          outTok += consumed.completionTokens
        } else {
          inTok += Math.max(120, Math.ceil((msg.content?.length || 100) * 2.2))
          outTok += Math.max(35, Math.ceil((msg.content?.length || 100) * 0.75))
        }
        llmTime += Math.max(1200, Math.ceil(((msg.content?.length || 100) / 50) * 1000))
      }
    }
    const cacheRead = raw.cacheReadTokens || 0
    return {
      ...raw,
      stepCount: Math.max(raw.stepCount, steps),
      llmMs: Math.max(raw.llmMs, llmTime),
      inputTokens: Math.max(raw.inputTokens, inTok),
      outputTokens: Math.max(raw.outputTokens, outTok),
      cacheReadTokens: Math.max(raw.cacheReadTokens, cacheRead),
      turnCount: Math.max(raw.turnCount, ledger?.totalCalls || steps),
    }
  }, [ledger, agentStats, messages])
  const filteredAssignments = assignmentRecords.filter(item => {
    if (ledgerFilter === 'active' && item.status !== 'queued' && item.status !== 'running') return false
    if (ledgerFilter === 'unread') return false
    if (!ledgerNeedle) return true
    return [item.assignmentId, item.ownerRoleId, item.createdByRoleId, item.workflowTaskId, item.taskType, item.brief, item.status].some(value => String(value || '').toLowerCase().includes(ledgerNeedle))
  })
  const filteredMailbox = mailboxRecords.filter(({to, message}) => {
    if (ledgerFilter === 'active') return false
    if (ledgerFilter === 'unread' && message.readAt) return false
    if (!ledgerNeedle) return true
    return [message.mailboxMessageId, message.fromRoleId, to, message.assignmentId, message.content, message.readAt ? '已读' : '未读'].some(value => String(value || '').toLowerCase().includes(ledgerNeedle))
  })
  const teamNeedle = teamSearch.trim().toLowerCase()
  const filteredMembers = (room?.members || []).filter(member => {
    if (!teamNeedle) return true
    return [member.id, member.name, member.title, member.roleDescription, member.llmConfig?.provider, member.llmConfig?.model].some(value => String(value || '').toLowerCase().includes(teamNeedle))
  })
  const commanderId = room?.orchestration?.masterAgentId || room?.moderatorAgentId || 'commander'
  const commander = (room?.members || []).find(member => member.id === commanderId)
  const commanderFallback = commander?.name || commanderId
  const commanderDisplayName = commander ? txRoleName(commander, locale) : commanderFallback

  return (
    <div data-dsh-gc-roster-panel style={hudPanelStackStyle}>
      {isTeamPanel && <div style={{...hudCardStyle,display:'grid',gap:8}} data-dsh-gc-team-summary>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
          <div style={{fontSize:12,fontWeight:800,color:hudTokens.labelPrimary}}>{tx(locale,'团队','Team')}</div>
          <div style={{fontSize:10,color:hudTokens.labelTertiary}}>
            {tx(locale, `主 Agent：${commanderDisplayName} · 成员 ${room?.members.length || 0}`, `Master Agent: ${commanderDisplayName} · ${room?.members.length || 0} Members`)}
          </div>
        </div>
        <input
          value={teamSearch}
          onChange={event => setTeamSearch(event.target.value)}
          placeholder={tx(locale,'搜索角色、职责、Provider、模型 ID…','Search roles, duties, provider, model ID…')}
          style={{width:'100%',minWidth:0,border:`1px solid ${hudTokens.borderL2}`,borderRadius:8,background:hudTokens.bgLayer1,color:hudTokens.labelPrimary,fontSize:11,padding:'6px 8px',outline:'none'}}
          data-dsh-gc-team-search
        />
        <details data-dsh-gc-team-toolbox style={{borderTop:`1px solid ${hudTokens.borderL1}`,paddingTop:8}}>
          <summary style={{cursor:'pointer',fontSize:11,fontWeight:700,color:hudTokens.labelPrimary,userSelect:'none'}}>{tx(locale,'造人/造工作流工具箱','Role & workflow builder')}</summary>
          <div style={{display:'grid',gap:8,marginTop:8}}>
            <div style={{fontSize:10,color:hudTokens.labelTertiary}}>{tx(locale,'用一句话描述世界观和项目任务；先出草案，确认后再写入当前工作区。','Describe the world and project task in one sentence. Draft first, write after confirmation.')}</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              <button type="button" onClick={()=>onApplyTheme('meme_comedy')} style={{...hudGhostButtonStyle,borderRadius:999,padding:'3px 8px'}}>{tx(locale,'套用沙雕整活','Use meme theme')}</button>
              <button type="button" onClick={()=>onApplyTheme('genshin')} style={{...hudGhostButtonStyle,borderRadius:999,padding:'3px 8px'}}>{tx(locale,'套用原神','Use Genshin theme')}</button>
            </div>
            <textarea value={themeBrief} onChange={e=>onThemeBriefChange(e.target.value)} placeholder={tx(locale,'例如：赛博修仙创业公司做知识库、猫猫宇宙产品战队改插件、东北烧烤摊式研发部做运营页……','Example: cyber-cultivation startup building a knowledge base, cat-universe product squad improving a plugin, BBQ-stand dev team building an ops page…')} style={{...hudTextAreaStyle,minHeight:54,resize:'vertical',background:hudTokens.bgLayer1,fontFamily:'inherit'}} />
            <div style={{display:'flex',gap:8}}>
              <button type="button" disabled={themeBusy} onClick={()=>onGenerateThemeDraft(false)} style={{...hudGhostButtonStyle,flex:1,fontSize:11,padding:'6px 8px',borderRadius:9}}>{themeBusy?tx(locale,'生成中…','Generating…'):tx(locale,'生成草案','Generate draft')}</button>
              <button type="button" disabled={themeBusy} onClick={()=>onGenerateThemeDraft(true)} style={{...hudPrimaryButtonStyle,flex:1,fontSize:11,padding:'6px 8px',borderRadius:9,fontWeight:700}}>{tx(locale,'生成并套用','Generate & apply')}</button>
            </div>
            {themeDraft.length>0 && <div style={{display:'grid',gap:6}}>
              <div style={{fontSize:10,color:hudTokens.labelTertiary}}>{tx(locale,'草案预览：会同时生成工作流；可先套用，再用每个角色右侧「编辑」细调。','Draft preview: also generates a workflow. Apply it first, then fine-tune each role with Edit.')}</div>
              {workflowDraft&&<div style={{fontSize:10,color:hudTokens.labelSecondary,padding:'6px 7px',borderRadius:8,background:'rgba(77,107,254,0.10)'}}>{tx(locale,'工作流','Workflow')}：{workflowDraft.title} · {workflowDraft.stages?.length||0} {tx(locale,'步','steps')}</div>}
              {themeDraft.map(item=><div key={item.id} style={{display:'flex',alignItems:'center',gap:7,fontSize:11,color:hudTokens.labelSecondary,minWidth:0}}><AvatarBadge avatar={item.avatar} className="gc-roster-avatar"/><span style={{fontWeight:700,color:hudTokens.labelPrimary}}>{item.name}</span><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</span></div>)}
              <button type="button" disabled={themeBusy} onClick={()=>onGenerateThemeDraft(true)} style={{...hudPrimaryButtonStyle,fontSize:11,padding:'6px 8px',borderRadius:9,backgroundColor:'#10b981',fontWeight:700}}>{tx(locale,'套用这个草案','Apply this draft')}</button>
            </div>}
          </div>
        </details>
      </div>}


      {isLedgerPanel && <div style={{
        ...hudCardStyle,
        display: 'grid',
        gap: '10px',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
          <div style={{ fontSize: '12px', color: hudTokens.labelPrimary, fontWeight: 700 }}>{tx(locale,'总体运行统计','Overall runtime stats')}</div>
          <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-caption, #64748b)' }}>{tx(locale,'官方摘要风格','Official summary style')}</div>
        </div>
        <div style={{ fontSize:'11px', lineHeight:1.55, color:hudTokens.labelPrimary, whiteSpace:'normal', background:hudTokens.bgLayer1, padding:'8px 10px', borderRadius:8, border:`1px solid ${hudTokens.borderL1}` }}>
          {metricLine(ledger?.totalCalls || computedMetrics.turnCount || 0, computedMetrics)}
        </div>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginTop:4}}>
          <div style={{fontSize:11,fontWeight:700,color:hudTokens.labelPrimary}}>{tx(locale,'按 Agent / 模型展开','Expand by Agent / model')}</div>
          <div style={{fontSize:10,color:hudTokens.labelTertiary}}>{Object.keys(agentStats).length} {tx(locale,'位成员记录','agents recorded')}</div>
        </div>

        <div style={{display:'grid',gap:8}}>
          {Object.entries(agentStats).map(([agentId,stat])=>{
            const agentMsgs = (messages || []).filter(m => m.sender?.id === agentId)
            const estInput = agentMsgs.reduce((sum, m) => sum + (m.metadata?.tokensConsumed?.promptTokens || Math.max(120, Math.ceil((m.content?.length || 100) * 2.2))), 0)
            const estOutput = agentMsgs.reduce((sum, m) => sum + (m.metadata?.tokensConsumed?.completionTokens || Math.max(35, Math.ceil((m.content?.length || 100) * 0.75))), 0)
            const estTotal = stat.totalTokens > 0 ? stat.totalTokens : (estInput + estOutput)
            const statMetrics = (stat.metrics.inputTokens > 0 || stat.metrics.outputTokens > 0) ? stat.metrics : {
              ...stat.metrics,
              stepCount: Math.max(stat.metrics.stepCount, agentMsgs.length),
              llmMs: Math.max(stat.metrics.llmMs, agentMsgs.length * 1500),
              inputTokens: estInput,
              outputTokens: estOutput,
              cacheReadTokens: stat.metrics.cacheReadTokens || 0,
              turnCount: Math.max(stat.metrics.turnCount, stat.callCount || agentMsgs.length),
            }
            return (
            <div key={agentId} style={{padding:'8px 9px',borderRadius:8,background:hudTokens.bgLayer1,border:`1px solid ${hudTokens.borderL1}`}}>
              <div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:11,fontWeight:700,color:hudTokens.labelPrimary}}><span>{stat.agentName}</span><span>{formatTokens(estTotal)} tok</span></div>
              <div style={{fontSize:10,color:hudTokens.labelTertiary,marginTop:4}}>{metricLine(stat.callCount || agentMsgs.length || 0, statMetrics)}</div>
              {Object.values(stat.modelStats || {}).map(ms=>(
                <div key={`${ms.provider}/${ms.model}`} style={{marginTop:6,paddingTop:6,borderTop:'1px dashed var(--dsw-alias-border-l1, rgba(255,255,255,0.08))',fontSize:10,color:hudTokens.labelSecondary}}>
                  <div style={{fontWeight:600,color:hudTokens.labelPrimary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ms.provider} / {ms.model}</div>
                  <div style={{marginTop:2,color:hudTokens.labelTertiary}}>{metricLine(ms.callCount || 0, ms.metrics.inputTokens > 0 ? ms.metrics : statMetrics)}</div>
                </div>
              ))}
            </div>
          )})}
          {Object.keys(agentStats).length===0 && <div style={{fontSize:11,color:hudTokens.labelTertiary,padding:'8px 0'}}>{tx(locale,'暂无 Agent 调用记录；首次角色发言后会显示分项。','No Agent call records yet. Per-agent details appear after the first role response.')}</div>}
        </div>
      </div>}


      {isTeamPanel && <div style={{ fontSize: '11px', color: hudTokens.labelSecondary, marginTop: '4px' }}>
        {tx(locale,'成员列表','Members')}（{filteredMembers.length}/{room?.members.length || 0}）
      </div>}

      {isTeamPanel && filteredMembers.map(member => {
        const stat = agentStats[member.id]
        const displayName = txRoleName(member, locale)
        const displayTitle = txRoleTitle(member, locale) || member.id
        return (
          <div key={member.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,padding:'6px 8px',borderRadius:'6px',background:hudTokens.bgLayer2}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth:0 }}>
              <AvatarBadge avatar={member.avatar} className="gc-roster-avatar" />
              <div style={{minWidth:0}}>
                <div style={{ fontWeight: 600, color: 'var(--dsw-alias-label-primary, #f8fafc)', fontSize: '11px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayName}</div>
                <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-caption, #64748b)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayTitle}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap', flexShrink:0 }}>
              <span>{stat?.callCount || 0} {tx(locale,'轮','turns')}</span>
              <span>{stat?.totalTokens || 0} T</span>
              <button type="button" onClick={()=>onEditAgent(member)} aria-label={`${tx(locale,'编辑','Edit')}${displayName}`}>{tx(locale,'编辑','Edit')}</button>
            </div>
          </div>
        )
      })}

      {isTeamPanel && filteredMembers.length===0 && <div style={{...hudCardStyle,fontSize:11,color:hudTokens.labelTertiary}}>{tx(locale,'没有匹配的团队成员。','No matching team members.')}</div>}

      {isLedgerPanel && <details style={{...hudCardStyle,display:'grid',gap:8}} data-dsh-gc-ledger-records>
        <summary style={{cursor:'pointer',userSelect:'none',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          <div style={{fontSize:11,fontWeight:700,color:hudTokens.labelPrimary}}>📁 {tx(locale,'协同流转留痕 (任务分派 & 邮箱通讯审计)','Collaboration Audit Logs (Assignments & Mailbox)')}</div>
          <div style={{fontSize:10,color:hudTokens.labelTertiary}}>{tx(locale,'完整流水','Full ledger')} · {tx(locale,'分派','Assignments')} {assignmentRecords.length} · {tx(locale,'邮箱','Mailbox')} {mailboxRecords.length}</div>
        </summary>
        <div style={{fontSize:10,color:hudTokens.labelTertiary,marginTop:4}}>
          {tx(locale,'注：此部分为后台事件调度留痕，各 Agent 模型数据消耗请以上方“角色与模型消耗流水”为准。','Note: This section logs background event routing; refer to the ledger above for token & model metrics.')}
        </div>
        <input
          value={ledgerSearch}
          onChange={event => setLedgerSearch(event.target.value)}
          placeholder={tx(locale,'搜索角色、任务、模型流水关键词…','Search roles, tasks, model ledger keywords…')}
          style={{width:'100%',minWidth:0,border:`1px solid ${hudTokens.borderL2}`,borderRadius:8,background:hudTokens.bgLayer1,color:hudTokens.labelPrimary,fontSize:11,padding:'6px 8px',outline:'none'}}
          data-dsh-gc-ledger-search
        />
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}} data-dsh-gc-ledger-filters>
          {[
            {id:'all',label:tx(locale,'全部','All')},
            {id:'active',label:`${tx(locale,'进行中','Active')} ${activeAssignmentCount}`},
            {id:'unread',label:`${tx(locale,'未读','Unread')} ${unreadMailboxCount}`},
          ].map(item=><button key={item.id} type="button" onClick={()=>setLedgerFilter(item.id as 'all' | 'active' | 'unread')} style={{...(ledgerFilter===item.id?hudPrimaryButtonStyle:hudGhostButtonStyle),borderRadius:999,padding:'3px 8px'}} aria-pressed={ledgerFilter===item.id}>{item.label}</button>)}
        </div>
        <details style={{padding:'8px 0 0',borderTop:`1px solid ${hudTokens.borderL1}`}}>
          <summary style={{cursor:'pointer',fontSize:11,fontWeight:700,color:hudTokens.labelPrimary,userSelect:'none'}}>{tx(locale,'任务分派','Assignments')} / Assignment（{filteredAssignments.length}/{assignmentRecords.length}）</summary>
          <div style={{display:'grid',gap:6,marginTop:8}}>{filteredAssignments.map(a=>{const c=statusColor(a.status);return <div key={a.assignmentId} style={{fontSize:10,lineHeight:1.45,color:hudTokens.labelSecondary,border:`1px solid ${c.border}`,background:c.bg,borderRadius:8,padding:'6px 7px',overflow:'hidden'}}><b style={{color:c.fg}}>{a.status}</b> · @{a.ownerRoleId} · {a.workflowTaskId || a.taskType}<br/><span>{a.brief}</span><div style={{marginTop:3,color:hudTokens.labelTertiary}}>{shortId(a.assignmentId)} · from @{a.createdByRoleId}</div></div>})}{filteredAssignments.length===0&&<div style={{fontSize:10,color:hudTokens.labelTertiary}}>{tx(locale,'没有匹配的任务分派记录。','No matching assignment records.')}</div>}</div>
        </details>
        <details style={{padding:'8px 0 0',borderTop:`1px solid ${hudTokens.borderL1}`}}>
          <summary style={{cursor:'pointer',fontSize:11,fontWeight:700,color:hudTokens.labelPrimary,userSelect:'none'}}>{tx(locale,'主 Agent 邮箱','Master Agent mailbox')} / Mailbox（{filteredMailbox.length}/{mailboxRecords.length}）</summary>
          <div style={{display:'grid',gap:6,marginTop:8}}>{filteredMailbox.map(({to,message:msg})=><div key={msg.mailboxMessageId} style={{fontSize:10,lineHeight:1.45,color:hudTokens.labelSecondary,border:'1px solid rgba(77,107,254,0.20)',background:msg.readAt?'rgba(255,255,255,0.035)':'rgba(77,107,254,0.08)',borderRadius:8,padding:'6px 7px',overflow:'hidden'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}><b style={{color:hudTokens.labelPrimary}}>@{msg.fromRoleId} → @{to}</b><span style={{fontSize:9,color:msg.readAt?'var(--dsw-alias-label-tertiary,#94a3b8)':'#60a5fa'}}>{msg.readAt?'已读':'未读'}</span></div>{msg.assignmentId ? <div style={{color:hudTokens.labelTertiary}}>{shortId(msg.assignmentId)}</div> : null}<span>{msg.content}</span>{!msg.readAt && <button onClick={()=>onMarkMailboxRead(msg.mailboxMessageId)} style={{...hudGhostButtonStyle,marginTop:5,justifySelf:'start',fontSize:10,padding:'2px 7px'}}>{tx(locale,'标记已读','Mark read')}</button>}</div>)}{filteredMailbox.length===0&&<div style={{fontSize:10,color:hudTokens.labelTertiary}}>没有匹配的邮箱记录。</div>}</div>
        </details>
      </details>}
    </div>
  )
}


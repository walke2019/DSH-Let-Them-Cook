import React, {useEffect, useState} from 'react'
import {AvatarBadge} from './AvatarBadge.js'
import type {ApprovalTransaction, CaptainTaskNode, GroupMessageData, StructuredAgentResult, WorkflowTask} from './group-chat-hud-types.js'
import {hudCardStyle, hudGhostButtonStyle, hudPanelStackStyle, hudPrimaryButtonStyle, hudTokens} from './group-chat-hud-styles.js'
import {tx, txRoleName, type GroupChatLocale} from './i18n.js'

type RoomData = any

interface Props {
  room: RoomData | null
  messages: GroupMessageData[]
  onApproveStage(): void | Promise<void>
  onUpdateWorkflowTask(stageId:string, taskId:string, status:WorkflowTask['status']): void | Promise<void>
  onApplyWorkflowTaskAction(stageId:string, taskId:string, action:'retry'|'request_human'|'skip', reason:string): void | Promise<void>
  onMarkMailboxRead(mailboxMessageId:string): void | Promise<void>
  locale?: GroupChatLocale
}

function statusColor(status: string): { bg: string; fg: string; border: string } {
  if (status === 'passed' || status === 'completed') return { bg: 'rgba(16,185,129,0.12)', fg: '#34d399', border: 'rgba(16,185,129,0.28)' }
  if (status === 'running' || status === 'in_progress' || status === 'ready') return { bg: 'rgba(77,107,254,0.12)', fg: '#60a5fa', border: 'rgba(77,107,254,0.30)' }
  if (status === 'failed' || status === 'rejected') return { bg: 'rgba(248,113,113,0.12)', fg: '#fca5a5', border: 'rgba(248,113,113,0.30)' }
  if (status === 'request_human' || status === 'awaiting_approval') return { bg: 'rgba(234,179,8,0.12)', fg: '#fbbf24', border: 'rgba(234,179,8,0.30)' }
  return { bg: 'rgba(148,163,184,0.10)', fg: '#94a3b8', border: 'rgba(148,163,184,0.20)' }
}

function shortId(id = ''): string { return id.length > 8 ? `${id.slice(0, 8)}…` : id }

function MiniStat({label,value}:{label:string;value:number|string}) {
  return <div style={{...hudCardStyle,padding:'7px 8px',borderRadius:9}}><div style={{fontSize:10,color:hudTokens.labelTertiary}}>{label}</div><div style={{fontSize:15,fontWeight:800,color:hudTokens.labelPrimary}}>{value}</div></div>
}

export function GroupChatHudWorkflowPanel({room, messages, onApproveStage, onUpdateWorkflowTask, onApplyWorkflowTaskAction, onMarkMailboxRead, locale = 'zh-CN'}: Props) {
  const structuredByAssignment = new Map<string, StructuredAgentResult>()
  for (const msg of messages) {
    const assignmentId = msg.metadata?.assignmentId
    const structuredResult = msg.metadata?.structuredResult
    if (assignmentId && structuredResult) structuredByAssignment.set(assignmentId, structuredResult)
  }
  const stages = room?.workflow?.stages || []
  const currentIndex = room?.workflow?.currentStageIndex || 0
  const currentStage = stages[currentIndex]
  const runningAssignments = room?.assignments?.filter((a:any) => a.status === 'running') || []
  const queuedAssignments = room?.assignments?.filter((a:any) => a.status === 'queued') || []
  const focusAssignment = runningAssignments[0] || queuedAssignments[0] || room?.assignments?.slice(-1)[0]
  const focusMember = focusAssignment ? room?.members.find((m:any) => m.id === focusAssignment.ownerRoleId) : room?.members.find((m:any) => m.id === room?.orchestration?.masterAgentId || room?.moderatorAgentId)
  const focusTask = currentStage?.tasks?.find((t:any) => t.assignmentId && t.assignmentId === focusAssignment?.assignmentId) || currentStage?.tasks?.find((t:any) => t.status === 'running' || t.status === 'ready') || currentStage?.tasks?.find((t:any) => t.status === 'pending')
  const nextTask = currentStage?.tasks?.find((t:any) => t.status === 'ready' || t.status === 'pending')
  const pendingMailboxCount = Object.values(room?.mailboxes || {}).reduce((sum:number, list:any) => sum + list.filter((item:any) => !item.readAt).length, 0)
  const allMailboxCount = Object.values(room?.mailboxes || {}).reduce((sum:number,list:any)=>sum+list.length,0)
  const isWaitingApproval = currentStage?.status === 'awaiting_approval'
  const [openAdvancedItem, setOpenAdvancedItem] = useState('')
  useEffect(() => {
    if (!openAdvancedItem && currentStage?.id) setOpenAdvancedItem(`stage:${currentStage.id}`)
  }, [currentStage?.id, openAdvancedItem])
  const toggleAdvancedItem = (id: string) => setOpenAdvancedItem(current => current === id ? '' : id)
  const routePolicy = room?.orchestration?.toolRoutingPolicy
  const routeChips = routePolicy ? [
    ['搜索/爬取', routePolicy.webSearchOwner],
    ['后端', routePolicy.backendCodeOwner],
    ['前端/UI', routePolicy.frontendCodeOwner],
    ['QA', routePolicy.qaOwner],
    ['文档', routePolicy.docsOwner],
  ] : []
  const completedAssignments = room?.assignments?.filter((a:any) => a.status === 'completed') || []
  const failedAssignments = room?.assignments?.filter((a:any) => a.status === 'failed') || []
  const commanderId = room?.orchestration?.masterAgentId || room?.moderatorAgentId || 'commander'
  const commanderInbox = room?.mailboxes?.[commanderId] || []
  const unreadCommanderReports = commanderInbox.filter((item:any) => !item.readAt).length
  const subagentReportCount = commanderInbox.filter((item:any) => item.fromRoleId !== commanderId).length
  const protocol = room?.captainTaskProtocol
  const pendingTransactions: ApprovalTransaction[] = (room?.approvalTransactions || []).filter((item:ApprovalTransaction) => item.status === 'pending')
  const protocolTasks: CaptainTaskNode[] = protocol?.tasks || []
  const protocolDone = protocolTasks.filter(task => task.status === 'passed').length
  const protocolActive = protocolTasks.find(task => task.status === 'running' || task.status === 'ready')
  const qualityState = failedAssignments.length
    ? {label: tx(locale,'未完成','Incomplete'), tone:'#fca5a5', detail: tx(locale,'存在模型/任务失败，主 Agent 需要重试或换模型。','Model/task failures exist. Master Agent should retry or switch models.')}
    : completedAssignments.length && subagentReportCount
      ? {label: unreadCommanderReports ? tx(locale,'待收口','Needs review') : tx(locale,'闭环通过','Loop closed'), tone: unreadCommanderReports ? '#fbbf24' : '#34d399', detail: unreadCommanderReports ? tx(locale,'SubAgent 已上报，等待主 Agent 读取汇总。','SubAgents reported; waiting for Master Agent review.') : tx(locale,'分派、执行、上报、主 Agent 读取链路已打通。','Assignment, execution, reporting and Master review are connected.')}
      : {label: tx(locale,'待验证','Unverified'), tone:'#94a3b8', detail: tx(locale,'还没有形成完整的 SubAgent 上报闭环。','No complete SubAgent report loop yet.')}

  const activeAgentName = focusMember ? txRoleName(focusMember, locale) : (focusAssignment?.ownerRoleId || room?.orchestration?.masterAgentId || 'commander')
  const statusLabel = focusAssignment
    ? (locale === 'en-US'
        ? `${activeAgentName} ${focusAssignment.status === 'running' ? 'is working' : focusAssignment.status === 'queued' ? 'is queued' : focusAssignment.status === 'failed' ? 'needs retry' : 'completed'}`
        : `${activeAgentName} ${focusAssignment.status === 'running' ? '在开整' : focusAssignment.status === 'queued' ? '在排队' : focusAssignment.status === 'failed' ? '执行受阻待复核' : '完工待命'}`)
    : (locale === 'en-US'
        ? `${activeAgentName} standing by`
        : `${activeAgentName} 待命控场`)

  return <div className="dsh-gc-workflow-panel" style={{...hudPanelStackStyle,gap:10}}>
    <style>{`.dsh-gc-workflow-panel,.dsh-gc-workflow-panel *{box-sizing:border-box;min-width:0}.dsh-gc-stage-dot{width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0}.dsh-gc-advanced-details>summary{list-style:none}.dsh-gc-advanced-details>summary::-webkit-details-marker{display:none}`}</style>

    <div data-dsh-gc-director-card style={{boxSizing:'border-box',width:'100%',maxWidth:'100%',minWidth:0,overflow:'hidden',padding:'10px 12px',borderRadius:12,background:'linear-gradient(135deg, rgba(77,107,254,0.14), rgba(16,185,129,0.08))',border:'1px solid rgba(77,107,254,0.28)',display:'grid',gap:8}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,minWidth:0}}>
        <div style={{fontSize:12,fontWeight:800,color:hudTokens.labelPrimary}}>{tx(locale,'执行导演台','Execution director')}</div>
        {unreadCommanderReports > 0 && !runningAssignments.length ? (
          <span style={{fontSize:10,color:'#fbbf24',fontWeight:700}}>{tx(locale,'待收口 · 唤醒中','Needs review · Resuming')}</span>
        ) : (
          <span style={{fontSize:10,color:hudTokens.labelTertiary,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx(locale,'主 Agent 控场 · SubAgent 干活','Master Agent coordinates · SubAgents execute')}</span>
        )}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'24px minmax(0,1fr)',gap:8,alignItems:'center',minWidth:0}}><AvatarBadge avatar={focusMember?.avatar || '🎬'} className="gc-roster-avatar" /><div style={{minWidth:0}}><div style={{fontSize:11,fontWeight:700,color:hudTokens.labelPrimary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx(locale,'当前：','Current: ')}{statusLabel}</div><div style={{fontSize:10,color:hudTokens.labelSecondary,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{focusAssignment?.brief || focusTask?.description || tx(locale,'还没有执行任务；中间 Agent 群聊里一句话丢任务即可。','No active task yet. Drop one sentence into the Agent chat in the center.')}</div></div></div>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}><MiniStat label={tx(locale,'执行中','Running')} value={runningAssignments.length}/><MiniStat label={tx(locale,'待处理','Queued')} value={queuedAssignments.length}/><MiniStat label={tx(locale,'邮箱','Mailbox')} value={allMailboxCount}/></div>

    <div data-dsh-gc-loop-quality style={{...hudCardStyle,display:'grid',gap:6,padding:'8px 10px',border:`1px solid ${failedAssignments.length?'rgba(248,113,113,0.32)':unreadCommanderReports?'rgba(234,179,8,0.30)':'rgba(16,185,129,0.18)'}`}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
        <span style={{fontSize:11,fontWeight:800,color:hudTokens.labelPrimary}}>{tx(locale,'闭环质量','Loop quality')}</span>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          {unreadCommanderReports > 0 && !runningAssignments.length && (
            <button
              onClick={async () => {
                try {
                  await fetch('/dsh-group-chat/api/workflow/resume', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomId: room?.roomId || 'dev-team-alpha' }),
                  })
                } catch (e) {
                  console.error(e)
                }
              }}
              style={{
                ...hudPrimaryButtonStyle,
                backgroundColor: '#3b82f6',
                borderRadius: '6px',
                padding: '2px 7px',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tx(locale, '唤醒主控收口', 'Review Now')}
            </button>
          )}
          <span style={{fontSize:10,fontWeight:800,color:qualityState.tone}}>{qualityState.label}</span>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:6}}><MiniStat label={tx(locale,'已完成','Done')} value={completedAssignments.length}/><MiniStat label={tx(locale,'失败','Failed')} value={failedAssignments.length}/><MiniStat label={tx(locale,'上报','Reports')} value={subagentReportCount}/></div>
      <div style={{fontSize:10,lineHeight:1.45,color:hudTokens.labelSecondary}}>{qualityState.detail}</div>
    </div>

    {protocol && <div data-dsh-gc-captain-protocol style={{...hudCardStyle,display:'grid',gap:6,padding:'8px 10px',border:'1px solid rgba(77,107,254,0.22)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}><span style={{fontSize:11,fontWeight:800,color:hudTokens.labelPrimary}}>{tx(locale,'队长路线图','Captain plan')}</span><span style={{fontSize:10,color:'#60a5fa'}}>{protocol.status}</span></div>
      <div style={{fontSize:10,color:hudTokens.labelSecondary}}>{protocol.title} · {protocolDone}/{protocolTasks.length} {tx(locale,'已收口','closed')}</div>
      {protocolActive && <div title={protocolActive.brief} style={{fontSize:11,color:hudTokens.labelPrimary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>@{protocolActive.ownerRoleId} · {protocolActive.title}</div>}
    </div>}

    {!!pendingTransactions.length && <div data-dsh-gc-approval-transactions style={{...hudCardStyle,display:'grid',gap:7,padding:'8px 10px',border:'1px solid rgba(234,179,8,0.30)',background:'rgba(234,179,8,0.08)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}><span style={{fontSize:11,fontWeight:800,color:hudTokens.labelPrimary}}>{tx(locale,'确认后执行','Approve & Run')}</span><span style={{fontSize:10,color:'#fbbf24'}}>{pendingTransactions.length}</span></div>
      {pendingTransactions.slice(-2).map(item => <div key={item.transactionId} style={{display:'grid',gap:3,fontSize:10,color:hudTokens.labelSecondary,borderTop:'1px solid rgba(255,255,255,0.08)',paddingTop:6}}>
        <b style={{fontSize:11,color:hudTokens.labelPrimary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</b>
        <span>{item.summary}</span>
        <span>{tx(locale,'将改动：','Will change: ')}{item.willChange.slice(0,3).join(' / ') || '—'}</span>
        <span>{tx(locale,'回滚：','Rollback: ')}{item.rollbackPlan.slice(0,2).join(' / ') || '—'}</span>
      </div>)}
    </div>}

    <div style={{...hudCardStyle,display:'grid',gap:7,padding:'9px 10px',border:isWaitingApproval?'1px solid rgba(234,179,8,0.34)':`1px solid ${hudTokens.borderL1}`}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}><span style={{fontSize:11,fontWeight:700,color:hudTokens.labelPrimary}}>{tx(locale,'当前阶段','Current stage')} · {currentIndex + 1}/{stages.length || 0}</span><span style={{fontSize:10,color:isWaitingApproval?'#fbbf24':room?.workflow?.isCompleted?'#34d399':'#60a5fa'}}>{room?.workflow?.isCompleted ? tx(locale,'已完成','Completed') : currentStage?.status || 'pending'}</span></div>
      <div style={{fontSize:12,fontWeight:800,color:hudTokens.labelPrimary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{currentStage?.name || tx(locale,'等待创建工作流','Waiting for workflow')}</div>
      <div style={{fontSize:10,lineHeight:1.45,color:hudTokens.labelSecondary}}>{currentStage?.description || tx(locale,'在中间 Agent 群聊输入任务后，我会先生成角色和工作流草案，确认后再开工。','Send a task in the Agent group chat. I will draft roles and workflow first, then start after confirmation.')}</div>
      {room?.workflow?.isCompleted ? (
        <div style={{padding:'7px 8px',borderRadius:8,background:'rgba(16,185,129,0.10)',border:'1px solid rgba(16,185,129,0.28)',display:'grid',gap:3}}>
          <div style={{fontSize:10,color:'#34d399',fontWeight:700}}>✓ {tx(locale,'本轮工作流全部结题验收完成','Workflow completed and accepted')}</div>
          <div style={{fontSize:10,color:hudTokens.labelSecondary}}>{tx(locale,'所有阶段产物已归档，指挥官结题完毕。可随时提出新需求开启下一轮。','All stage deliverables archived. You can ask new questions to begin a new round.')}</div>
        </div>
      ) : focusTask ? (
        <div style={{padding:'7px 8px',borderRadius:8,background:'rgba(77,107,254,0.10)',border:'1px solid rgba(77,107,254,0.24)',display:'grid',gap:3}}>
          <div style={{fontSize:10,color:hudTokens.labelTertiary}}>{tx(locale,'当前任务','Current task')}</div>
          <div style={{fontSize:11,fontWeight:700,color:hudTokens.labelPrimary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>@{focusTask.ownerRoleId} · {focusTask.title}</div>
          <div style={{fontSize:10,color:hudTokens.labelSecondary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{focusTask.description}</div>
        </div>
      ) : (
        <div style={{padding:'7px 8px',borderRadius:8,background:'rgba(255,255,255,0.035)',border:`1px solid ${hudTokens.borderL1}`,display:'grid',gap:3}}>
          <div style={{fontSize:10,color:hudTokens.labelTertiary}}>{tx(locale,'当前任务','Current task')}</div>
          <div style={{fontSize:11,fontWeight:700,color:hudTokens.labelPrimary}}>{currentStage ? tx(locale,'暂无待执行子任务','No pending subtasks') : tx(locale,'等待创建工作流','Waiting for workflow')}</div>
          <div style={{fontSize:10,color:hudTokens.labelSecondary}}>{currentStage ? tx(locale,'当前阶段责任人正在推进中。','Stage owners are currently progressing.') : tx(locale,'中间 Agent 群聊里一句话丢任务即可。','Drop one sentence into the center Agent chat.')}</div>
        </div>
      )}
      {isWaitingApproval && <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,padding:'6px 8px',borderRadius:8,background:'rgba(234,179,8,0.10)',border:'1px dashed rgba(234,179,8,0.30)'}}><span style={{fontSize:11,color:'#fbbf24'}}>{tx(locale,'产物就绪，等你放行','Deliverable ready, waiting for approval')}</span><button onClick={()=>void onApproveStage()} style={{...hudPrimaryButtonStyle,backgroundColor:'#10b981',borderRadius:'6px'}}>{tx(locale,'批准','Approve')}</button></div>}
    </div>

    <details className="dsh-gc-advanced-details" style={{...hudCardStyle,padding:'9px 10px'}}>
      <summary style={{cursor:'pointer',fontSize:11,fontWeight:700,color:hudTokens.labelPrimary,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}><span>{tx(locale,'高级详情','Advanced details')}</span><span style={{fontSize:10,color:hudTokens.labelTertiary}}>{tx(locale,'阶段 / 任务 / 回执','Stages / tasks / receipts')}</span></summary>
      <div style={{display:'grid',gap:8,marginTop:9}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:6,minWidth:0}}><div style={{...hudCardStyle,padding:'7px 8px',borderRadius:9}}><div style={{fontSize:10,color:hudTokens.labelTertiary}}>{tx(locale,'当前模型','Current model')}</div><div title={`${focusMember?.llmConfig?.provider || '—'} / ${focusMember?.llmConfig?.model || '—'}`} style={{fontSize:11,fontWeight:700,color:hudTokens.labelPrimary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{focusMember?.llmConfig?.model || tx(locale,'跟随默认','Use default')}</div></div><div style={{...hudCardStyle,padding:'7px 8px',borderRadius:9}}><div style={{fontSize:10,color:hudTokens.labelTertiary}}>{tx(locale,'下一棒','Next up')}</div><div style={{fontSize:11,fontWeight:700,color:hudTokens.labelPrimary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nextTask ? `@${nextTask.ownerRoleId} · ${nextTask.title}` : pendingMailboxCount ? `${tx(locale,'主 Agent 读','Master Agent reads')} ${pendingMailboxCount} ${tx(locale,'条回执','receipts')}` : tx(locale,'等用户继续下令','Waiting for user')}</div></div></div>
        <div style={{fontSize:'11px',fontWeight:600,color:hudTokens.labelSecondary,display:'flex',justifyContent:'space-between'}}><span>{tx(locale,'阶段流程','Stage flow')}（{stages.length} {tx(locale,'步','steps')}）</span><span style={{ color: hudTokens.primary }}>{room?.workflow?.isCompleted ? `${tx(locale,'已全部验收完成','All accepted')} ✓` : `${tx(locale,'进行中: 第','In progress: step')} ${currentIndex + 1}`}</span></div>
        {stages.map((st:any, idx:number) => {
          const isCurrent = idx === currentIndex && !room?.workflow?.isCompleted
          const isPast = idx < currentIndex || room?.workflow?.isCompleted
          const sectionId = `stage:${st.id}`
          return <details key={st.id} open={openAdvancedItem === sectionId} style={{padding:'8px 10px',borderRadius:'8px',background:isCurrent?'rgba(77,107,254,0.08)':hudTokens.bgLayer2,border:isCurrent?`1px solid ${hudTokens.primary}`:`1px solid ${hudTokens.borderL1}`}}>
            <summary onClick={e=>{e.preventDefault(); toggleAdvancedItem(sectionId)}} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,cursor:'pointer',listStyle:'none'}}><span style={{display:'inline-flex',alignItems:'center',gap:6,minWidth:0}}><span className="dsh-gc-stage-dot" style={{backgroundColor:isPast?'#10b981':isCurrent?'#4d6bfe':'#475569'}}>{isPast?'✓':idx+1}</span><span style={{fontWeight:600,color:hudTokens.labelPrimary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{st.name}</span></span><span style={{fontSize:10,color:isCurrent?'#60a5fa':hudTokens.labelTertiary,flexShrink:0}}>{st.status}</span></summary>
            <div style={{fontSize:'11px',color:hudTokens.labelTertiary,marginTop:'5px'}}>{st.description}</div>
            {!!st.tasks?.length && <div style={{display:'grid',gap:6,marginTop:8}}>{st.tasks.map((task:any) => {
              const color = statusColor(task.status)
              const assignment = room?.assignments?.find((a:any)=>a.assignmentId===task.assignmentId)
              const structured = assignment?.assignmentId ? structuredByAssignment.get(assignment.assignmentId) : undefined
              return <details key={task.taskId} style={{border:`1px solid ${color.border}`,background:color.bg,borderRadius:8,padding:'6px 7px'}}><summary style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,cursor:'pointer',listStyle:'none',userSelect:'none'}}><span style={{minWidth:0,display:'inline-flex',alignItems:'center',gap:6}}><span style={{fontSize:10,color:color.fg,fontWeight:800}}>{task.status}</span><span style={{fontSize:11,fontWeight:700,color:hudTokens.labelPrimary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.title}</span></span><span style={{fontSize:10,color:hudTokens.labelTertiary,flexShrink:0}}>@{task.ownerRoleId}</span></summary><div style={{fontSize:10,lineHeight:1.45,color:hudTokens.labelSecondary,marginTop:6,display:'grid',gap:4}}><div>{task.description}</div>{!!task.dependsOn?.length && <div>{tx(locale,'依赖','Depends')}：{task.dependsOn.join(' / ')}</div>}{assignment && <div>Assignment：{shortId(assignment.assignmentId)} · {assignment.status}</div>}{task.verifyCommand && <code style={{fontSize:10,whiteSpace:'normal',wordBreak:'break-all',color:hudTokens.labelPrimary}}>verify: {task.verifyCommand}</code>}{!!task.qualityContract?.acceptanceCriteria?.length && <div>{tx(locale,'验收','Acceptance')}：{task.qualityContract.acceptanceCriteria.join('；')}</div>}{task.verification && <div>{tx(locale,'验证','Verification')}：exit {task.verification.exitCode ?? '—'} · {task.verification.verifiedByRoleId || 'qa'}</div>}{structured && <div style={{display:'grid',gap:3,borderTop:'1px solid rgba(255,255,255,0.08)',paddingTop:5,marginTop:2}}><b style={{color:hudTokens.labelPrimary}}>{tx(locale,'结构化结果','Structured result')}：{structured.status}</b>{structured.summary && <span>{tx(locale,'摘要','Summary')}：{structured.summary}</span>}{structured.next && <span>{tx(locale,'下一步','Next')}：{structured.next}</span>}{!!structured.evidence?.length && <span>{tx(locale,'证据','Evidence')}：{structured.evidence.join('；')}</span>}</div>}<div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:4}}>{(['ready','running','passed','failed','request_human'] as WorkflowTask['status'][]).map(nextStatus => <button key={nextStatus} onClick={()=>void onUpdateWorkflowTask(st.id, task.taskId, nextStatus)} style={{...hudGhostButtonStyle,background:task.status===nextStatus?'rgba(77,107,254,0.26)':'rgba(255,255,255,0.04)'}}>{nextStatus}</button>)}</div>{(task.status==='failed'||task.status==='request_human'||task.status==='rejected')&&<div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:5}} aria-label={tx(locale,'失败任务快捷处理','Failed task quick actions')}><button type="button" onClick={()=>void onApplyWorkflowTaskAction(st.id, task.taskId, 'retry', tx(locale,'主 Agent 从 HUD 发起重试','Master Agent retries from HUD'))} style={{...hudGhostButtonStyle,border:'1px solid rgba(96,165,250,0.30)',background:'rgba(77,107,254,0.10)',color:'#bfdbfe'}}>{tx(locale,'重试','Retry')}</button><button type="button" onClick={()=>void onApplyWorkflowTaskAction(st.id, task.taskId, 'request_human', '需要用户补充信息后继续')} style={{...hudGhostButtonStyle,border:'1px solid rgba(234,179,8,0.30)',background:'rgba(234,179,8,0.10)',color:'#fde68a'}}>{tx(locale,'让用户补充','Ask user')}</button><button type="button" onClick={()=>void onApplyWorkflowTaskAction(st.id, task.taskId, 'skip', tx(locale,'主 Agent 人工跳过该任务','Master Agent skips this task from HUD'))} style={{...hudGhostButtonStyle,border:'1px solid rgba(16,185,129,0.30)',background:'rgba(16,185,129,0.10)',color:'#bbf7d0'}}>{tx(locale,'跳过','Skip')}</button></div>}</div></details>
            })}</div>}
          </details>
        })}
        {!!routeChips.length && <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{routeChips.map(([label,owner]) => <span key={label} title={`${label} 归口 @${owner}`} style={{fontSize:10,padding:'3px 7px',borderRadius:999,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.09)',color:hudTokens.labelSecondary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label} → @{owner}</span>)}</div>}
        {!!room?.assignments?.length && <details open={openAdvancedItem === 'assignments'} style={{padding:'9px 10px',borderRadius:10,background:hudTokens.bgLayer2,border:`1px solid ${hudTokens.borderL1}`}}><summary onClick={e=>{e.preventDefault(); toggleAdvancedItem('assignments')}} style={{cursor:'pointer',fontSize:11,fontWeight:700,color:hudTokens.labelPrimary}}>{tx(locale,'最近任务分派','Recent assignments')} / Assignment</summary><div style={{display:'grid',gap:6,marginTop:8}}>{room.assignments.slice(-8).reverse().map((a:any)=>{const c=statusColor(a.status);return <div key={a.assignmentId} style={{fontSize:10,lineHeight:1.45,color:hudTokens.labelSecondary,border:`1px solid ${c.border}`,background:c.bg,borderRadius:8,padding:'6px 7px'}}><b style={{color:c.fg}}>{a.status}</b> · @{a.ownerRoleId} · {a.workflowTaskId || a.taskType}<br/><span>{a.brief}</span></div>})}</div></details>}
        {Object.values(room?.mailboxes || {}).some((list:any)=>list.length>0) && <details open={openAdvancedItem === 'mailbox'} style={{padding:'9px 10px',borderRadius:10,background:hudTokens.bgLayer2,border:`1px solid ${hudTokens.borderL1}`}}><summary onClick={e=>{e.preventDefault(); toggleAdvancedItem('mailbox')}} style={{cursor:'pointer',fontSize:11,fontWeight:700,color:hudTokens.labelPrimary}}>{tx(locale,'主 Agent 邮箱','Master Agent mailbox')} / Mailbox</summary><div style={{display:'grid',gap:6,marginTop:8}}>{Object.entries(room?.mailboxes || {}).flatMap(([to,list]:any)=>list.slice(-6).map((msg:any)=><div key={msg.mailboxMessageId} style={{fontSize:10,lineHeight:1.45,color:hudTokens.labelSecondary,border:'1px solid rgba(77,107,254,0.20)',background:msg.readAt?'rgba(255,255,255,0.035)':'rgba(77,107,254,0.08)',borderRadius:8,padding:'6px 7px'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}><b style={{color:hudTokens.labelPrimary}}>@{msg.fromRoleId} → @{to}</b><span style={{fontSize:9,color:msg.readAt?hudTokens.labelTertiary:'#60a5fa'}}>{msg.readAt?tx(locale,'已读','Read'):tx(locale,'未读','Unread')}</span></div>{msg.assignmentId ? <div>{shortId(msg.assignmentId)}</div> : null}<span>{msg.content.slice(0,160)}{msg.content.length>160?'…':''}</span>{!msg.readAt && <button onClick={()=>void onMarkMailboxRead(msg.mailboxMessageId)} style={{...hudGhostButtonStyle,marginTop:5,justifySelf:'start'}}>{tx(locale,'标记已读','Mark read')}</button>}</div>))}</div></details>}
      </div>
    </details>
  </div>
}




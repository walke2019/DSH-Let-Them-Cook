import {subscribeGroupChat} from './group-chat-events.js'
import {AvatarBadge} from './AvatarBadge.js'
import {GroupChatToolRow} from './GroupChatToolRow.js'
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react'
import {MarkdownText} from '@deepseek-ai/dsh-client-ui-primitives'
import {GroupChatComposer} from './GroupChatComposer.js'
import {getThemeVoice} from '../engine/theme-voice.js'
import {detectGroupChatLocale, onGroupChatLocaleChange, tx, txRoleName, type GroupChatLocale} from './i18n.js'
import type {AssignmentEnvelope} from './group-chat-hud-types.js'
import type {AgentProfile, AgentStatus, GroupMessage} from './group-chat-view-types.js'
import {useCurrentGroupChatRoomId} from './current-room.js'

type ClientThemeKey = 'meme_comedy' | 'three_kingdoms' | 'genshin' | 'modern' | 'legends' | string

function SafeMessageText({text, markdown}:{text:string; markdown:boolean}) {
  return markdown ? <MarkdownText text={text} /> : <span className="gc-plain-text">{text}</span>
}

function buildThemeQuickTemplates(theme: ClientThemeKey, locale: GroupChatLocale) {
  if (locale === 'en-US') {
    if (theme === 'modern') return [
      {label:'Define scope', text:'Project task: [goal]. Constraints: [time/risk/quality]. Acceptance criteria: [how we know it is done]. Ask the lead Agent to plan execution.'},
      {label:'Fix issue', text:'Resolve issue in [page/module]. Current behavior: [symptom]. Expected behavior: [target]. Include tests and rollback notes.'},
      {label:'Improve UX', text:'Improve UX for [page/component]. Audience: [users]. Success metric: [metric]. Keep implementation scoped and verifiable.'},
      {label:'Write spec', text:'Write or update docs for [feature/process]. Cover decisions, API/UI impact, tests, and open risks.'},
      {label:'Release review', text:'Run a release readiness review: build, tests, UI regressions, docs, risk list, and go/no-go recommendation.'},
    ]
    if (theme === 'legends') return [
      {label:'Launch mission', text:'Launch mission: [what to build]. Product taste bar: [quality]. Technical leverage: [approach]. Ask the tech legends to split and ship.'},
      {label:'Jobs review', text:'Review [feature/UI] like a product keynote: what feels magical, what feels clumsy, and what must be cut before launch.'},
      {label:'Build engine', text:'Build the engine for [capability]. Need architecture, implementation path, tests, and measurable performance criteria.'},
      {label:'Find leverage', text:'Research leverage for [problem]: market/technical references, shortcuts, risks, and the highest-impact next move.'},
      {label:'Board check', text:'Run a board-level launch check: product clarity, engineering risk, QA evidence, docs, and final launch call.'},
    ]
    if (theme === 'three_kingdoms') return [
      {label:'Fix defenses', text:'Campaign task: fix a bug. Symptom: [describe issue]. Expected: [expected result]. Ask the master Agent to assign generals first.'},
      {label:'Polish troops', text:'Improve UI for [page/component]. Problem: [what feels off]. Target style: [reference].'},
      {label:'Write orders', text:'Update project docs. Change: [description]. Let the scribe close it and sync TODO.'},
      {label:'Scout intel', text:'Research a solution: [topic]. Only the scout/research role should search or crawl; the master Agent summarizes.'},
      {label:'Pre-launch roll call', text:'Run release checks: tests, UI, docs, risks. For failures, suggest retry/skip/ask-user.'},
    ]
    if (theme === 'genshin') return [
      {label:'Fix commission', text:'Handle a bug commission. Symptom: [describe issue]. Expected: [expected result]. Please form the party first.'},
      {label:'Beautify realm', text:'Improve UI for [page/component]. Problem: [what feels off]. Target style: [reference].'},
      {label:'Adventure log', text:'Update project docs. Change: [description]. Let the recorder sync TODO.'},
      {label:'Open map', text:'Research a solution: [topic]. Only the research role searches/crawls; master Agent summarizes.'},
      {label:'Before departure', text:'Run release checks: tests, UI, docs, risks. For failures, suggest retry/skip/ask-user.'},
    ]
    return [
      {label:'Fix bug', text:'Fix a bug: symptom is [describe issue], expected result is [expected result]. First decide which Agents are needed.'},
      {label:'Improve UI', text:'Improve UI for [page/component]. Problem: [what feels off]. Target style: [reference].'},
      {label:'Write docs', text:'Update project docs. Change: [description]. Let writer close it and sync TODO.'},
      {label:'Research', text:'Research a solution: [topic]. Only researcher should search/crawl, then commander summarizes.'},
      {label:'Preflight', text:'Run release checks: tests, UI, docs, risks. For failures, suggest retry/skip/ask-user.'},
    ]
  }
  if (theme === 'modern') return [
    {label:'定范围', text:'项目任务：【目标】。约束：【时间/风险/质量】。验收标准：【怎样算完成】。请主 Agent 先拆执行方案。'},
    {label:'修问题', text:'修复【页面/模块】问题。当前现象：【描述】。期望结果：【目标】。请包含测试与回滚说明。'},
    {label:'提体验', text:'优化【页面/组件】体验。目标用户：【人群】。成功指标：【指标】。要求范围可控、结果可验收。'},
    {label:'写规范', text:'更新【功能/流程】文档，覆盖决策、API/UI 影响、测试记录和风险。'},
    {label:'发版评审', text:'做发布前评审：构建、测试、UI 回归、文档、风险清单和 go/no-go 建议。'},
  ]
  if (theme === 'legends') return [
    {label:'开发布会', text:'发布会任务：【要构建什么】。产品品味线：【质量标准】。技术杠杆：【方案方向】。请科技传奇分工交付。'},
    {label:'乔布斯评审', text:'像产品发布会一样评审【功能/UI】：哪里惊艳、哪里笨重、上线前必须砍掉什么。'},
    {label:'造引擎', text:'为【能力】打造技术引擎：需要架构、实现路径、测试和性能验收标准。'},
    {label:'找杠杆', text:'调研【问题】的高杠杆解法：市场/技术参考、捷径、风险和最高影响力下一步。'},
    {label:'董事会检查', text:'做发布会级检查：产品清晰度、工程风险、QA 证据、文档和最终上线判断。'},
  ]
  if (theme === 'three_kingdoms') return [
    {label:'修城防', text:'此役要修一个 Bug：现象是【描述问题】，期望是【期望结果】，请主 Agent 先点将分工。'},
    {label:'整军容', text:'帮我打磨一个 UI：页面/组件是【名称】，问题是【不够好看的地方】，目标风格是【参考风格】。'},
    {label:'写军令', text:'帮我更新项目文档：改动点是【说明】，请让文书收口并同步 TODO。'},
    {label:'探敌情', text:'帮我调研一个方案：【主题】，只让斥候/调研专员搜索爬取，最后交给主 Agent 汇总。'},
    {label:'出征前点卯', text:'帮我做发布前检查：跑测试、看 UI、查文档和风险，失败项请给重试/跳过/要我补充的建议。'},
  ]
  if (theme === 'genshin') return [
    {label:'修委托', text:'帮我处理一个 Bug 委托：现象是【描述问题】，期望是【期望结果】，请先安排队伍。'},
    {label:'美化尘歌壶', text:'帮我优化一个 UI：页面/组件是【名称】，问题是【不够好看的地方】，目标风格是【参考风格】。'},
    {label:'冒险手册', text:'帮我更新项目文档：改动点是【说明】，请让记录员收口并同步 TODO。'},
    {label:'开地图', text:'帮我调研一个方案：【主题】，只让调研角色负责搜索/爬取，最后交给主 Agent 汇总。'},
    {label:'出发前检查', text:'帮我做发布前检查：跑测试、看 UI、查文档和风险，失败项请给重试/跳过/要我补充的建议。'},
  ]
  return [
    {label:'修 Bug', text:'帮我修一个 Bug：现象是【描述问题】，期望是【期望结果】，请先判断该找哪些 Agent。'},
    {label:'做 UI', text:'帮我优化一个 UI：页面/组件是【名称】，问题是【不够好看的地方】，目标风格是【参考风格】。'},
    {label:'写文档', text:'帮我更新项目文档：改动点是【说明】，请让 writer 收口并同步 TODO。'},
    {label:'调研', text:'帮我调研一个方案：【主题】，只让 researcher 负责搜索/爬取，最后交给 commander 汇总。'},
    {label:'发布前检查', text:'帮我做发布前检查：跑测试、看 UI、查文档和风险，失败项请给重试/跳过/要我补充的建议。'},
  ]
}

function buildThemeOnboarding(theme: ClientThemeKey, locale: GroupChatLocale) {
  if (locale === 'en-US') {
    if (theme === 'modern') return [
      ['1. Define outcome', 'State the goal, constraints, owner expectations, and acceptance criteria.'],
      ['2. Build the plan', 'The lead Agent converts the brief into roles, workflow, risks, and verification steps.'],
      ['3. Execute with evidence', 'After confirmation, specialists work by responsibility and close with testable results.'],
    ]
    if (theme === 'legends') return [
      ['1. Pitch the mission', 'Describe the product moment, technical ambition, and why it matters.'],
      ['2. Assemble legends', 'Jobs frames taste, Musk seeks leverage, Jensen shapes the engine, and the team splits execution.'],
      ['3. Launch or cut', 'Confirm the route, then specialists report evidence and the commander makes the launch call.'],
    ]
    if (theme === 'three_kingdoms') return [
      ['1. Give orders', 'Say whether this campaign fixes bugs, polishes UI, writes docs, scouts intel, or prepares release.'],
      ['2. Assign generals', 'The master Agent reads the situation, asks follow-ups if needed, then drafts roles and route.'],
      ['3. Confirm march', 'Only after confirmation will it write into this workspace and let SubAgents report back.'],
    ]
    if (theme === 'genshin') return [
      ['1. Post commission', 'Say whether it is a bug, UI, docs, research map, or preflight check.'],
      ['2. Form party', 'The master Agent understands the commission, asks when unclear, then drafts party and route.'],
      ['3. Accept after review', 'Only after confirmation will it write into this workspace and let the party report back.'],
    ]
    return [
      ['1. State the goal', 'Say whether you want a bug fix, UI work, docs, research, or release check.'],
      ['2. I draft the squad', 'The master Agent understands intent, asks follow-ups if needed, then drafts roles/workflow.'],
      ['3. Confirm to start', 'Only after confirmation will it write into this workspace; SubAgents execute and report back.'],
    ]
  }
  if (theme === 'modern') return [
    ['1. 定目标', '说清业务目标、约束、负责人预期和验收标准。'],
    ['2. 出方案', '主 Agent 把 brief 变成角色分工、工作流、风险和验证步骤。'],
    ['3. 凭证据闭环', '确认后专员按职责执行，最后用可测试结果收口。'],
  ]
  if (theme === 'legends') return [
    ['1. 讲发布会', '说清产品时刻、技术野心，以及这件事为什么值得做。'],
    ['2. 召集传奇', '乔布斯定品味，马斯克找杠杆，黄仁勋搭引擎，小队分路推进。'],
    ['3. 上线或砍掉', '确认路线后专员交证据，主 Agent 做最终发布判断。'],
  ]
  if (theme === 'three_kingdoms') return [
    ['1. 下军令', '直接说此役要修 Bug、整 UI、写文书、探情报还是发版点卯。'],
    ['2. 先点将', '主 Agent 先判军情，必要时追问，再排将领和行军路线。'],
    ['3. 确认后出兵', '你确认后才写入当前工作区，SubAgent 分路推进并回报。'],
  ]
  if (theme === 'genshin') return [
    ['1. 写委托', '直接说要修 Bug、做 UI、写文档、开地图调研还是出发前检查。'],
    ['2. 先组队', '主 Agent 先理解委托，缺信息会追问，再生成队伍和路线草案。'],
    ['3. 确认后接取', '你确认后才写入当前工作区，小队按路线推进并回传。'],
  ]
  return [
    ['1. 说清目标', '直接说你想修 Bug、做 UI、写文档、调研还是发版检查。'],
    ['2. 我先排兵', '主 Agent 先理解意图，必要时追问，再生成角色/工作流草案。'],
    ['3. 你确认后开整', '确认创建后才写入当前工作区，SubAgent 分头干活并回传。'],
  ]
}

export interface GroupChatPanelProps { mode?: 'dock' | 'full'; onClose?: () => void }
export function GroupChatPanel({mode='full'}:GroupChatPanelProps) {
  const useMarkdown = mode === 'full'
  const [members,setMembers]=useState<AgentProfile[]>([])
  const [activeTheme,setActiveTheme]=useState<ClientThemeKey>('meme_comedy')
  const [locale,setLocale]=useState<GroupChatLocale>(()=>detectGroupChatLocale())
  const [messages,setMessages]=useState<GroupMessage[]>([])
  const [draft,setDraft]=useState('')
  const [sending,setSending]=useState(false)
  const [taskTier,setTaskTier]=useState<'quick'|'long'>(()=>(localStorage.getItem('dsh-group-chat.task-tier')==='long'?'long':'quick'))
  const [now,setNow]=useState(Date.now())
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [copied,setCopied]=useState('')
  const [retry,setRetry]=useState(0)
  const [expandOverrides,setExpandOverrides]=useState<Record<string,boolean>>({})
  const root=useRef<HTMLDivElement>(null)
  const scroll=useRef<HTMLDivElement>(null)
  const bottom=useRef<HTMLDivElement>(null)
  const follow=useRef(true)
  const [showLatest,setShowLatest]=useState(false)
  const [agentStatuses,setAgentStatuses]=useState<Record<string,AgentStatus>>({})
  const [liveAssignments,setLiveAssignments]=useState<Record<string,AssignmentEnvelope>>({})
  const [statusOpen,setStatusOpen]=useState(()=>localStorage.getItem('dsh-group-chat.status-open')!=='false')
  const [statusPos,setStatusPos]=useState(()=>{try{return JSON.parse(localStorage.getItem('dsh-group-chat.status-pos')||'{"x":18,"y":18}')}catch{return {x:18,y:18}}})
  const drag=useRef<{dx:number;dy:number}|null>(null)
  const roomId = useCurrentGroupChatRoomId()
  const voice = getThemeVoice(activeTheme as any, locale)
  const quickTemplates = buildThemeQuickTemplates(activeTheme, locale)
  const onboardingSteps = buildThemeOnboarding(activeTheme, locale)
  useEffect(()=>onGroupChatLocaleChange(setLocale),[])
  useEffect(()=>{localStorage.setItem('dsh-group-chat.task-tier',taskTier)},[taskTier])
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[])
  useEffect(()=>{
    if(mode!=='full')return
    document.body.setAttribute('data-dsh-group-chat-active','true')
    return ()=>document.body.removeAttribute('data-dsh-group-chat-active')
  },[mode])
  const activeAssignments=Object.values(liveAssignments).filter(item=>item.status==='queued'||item.status==='running').sort((a,b)=>(b.startedAt||b.updatedAt||0)-(a.startedAt||a.updatedAt||0)).slice(0,4)
  const isEmptyState=!messages.length&&!activeAssignments.length
  const memberName=(roleId:string)=>{
    const m = members.find(member=>member.id===roleId)
    if (!m) return roleId
    return txRoleName(m, locale)
  }
  const memberAvatar=(roleId:string)=>members.find(member=>member.id===roleId)?.avatar||'🤖'
  const assignmentStatusText=(assignment:AssignmentEnvelope)=>assignment.status==='queued'?tx(locale,'已接单，排队中','Queued'):tx(locale,'正在处理','Running')
  const assignmentLiveTitle=(assignment:AssignmentEnvelope)=>assignment.status==='queued'?tx(locale,'已进入执行队列','Queued for execution'):tx(locale,'正在像官方对话一样生成回复','Generating a reply like the official chat')
  const assignmentLiveSubtitle=(assignment:AssignmentEnvelope)=>assignment.status==='queued'?tx(locale,'等待调度器分配模型与上下文','Waiting for the dispatcher to attach model and context'):tx(locale,'模型调用中；完成后会在这里直接变成正式回复','Model call is running; the final answer will appear here directly')
  const assignmentProgress=(assignment:AssignmentEnvelope)=>assignment.startedAt&&assignment.expectedMs?Math.min(96,Math.round((assignmentElapsed(assignment)*1000/assignment.expectedMs)*100)):assignment.status==='queued'?8:36
  const assignmentElapsed=(assignment:AssignmentEnvelope)=>assignment.startedAt?Math.max(0,Math.round((now-assignment.startedAt)/1000)):0
  useEffect(()=>{
    const controller=new AbortController()
    let active=true
    let timedOut=false
    const timeout=window.setTimeout(()=>{timedOut=true;controller.abort()},45000)
    setMessages([]);setAgentStatuses({});setLiveAssignments({})
    const upsert=(list:GroupMessage[])=>setMessages(prev=>{
      const byId=new Map(prev.map(m=>[m.messageId,m]))
      for(const message of list)byId.set(message.messageId,message)
      return [...byId.values()].sort((a,b)=>a.timestamp-b.timestamp)
    })
    setLoading(true);setError('')
    fetch(`/dsh-group-chat/api/room?id=${encodeURIComponent(roomId)}&ensure=1`,{signal:controller.signal}).then(async r=>{
      if(!r.ok)throw Error(tx(locale,'群聊加载失败','Group chat load failed')+` (${r.status})`)
      const data=await r.json()
      if(!data.room)throw Error(tx(locale,'群聊数据暂未就绪','Group chat data is not ready yet'))
      if(!active||controller.signal.aborted)return
      setMembers(data.room.members);setActiveTheme(data.room.activeTheme || 'meme_comedy');setLiveAssignments(Object.fromEntries((data.room.assignments||[]).map((assignment:AssignmentEnvelope)=>[assignment.assignmentId,assignment])));upsert(data.messages||[])
    }).catch(e=>{
      if(!active)return
      const message=timedOut?tx(locale,'群聊数据加载超时，正在自动重试；也可点重试或重新打开 dsh web 打印的认证链接。','Group chat data load timed out and will auto-retry. You can also click retry or reopen the authenticated URL printed by dsh web.'):e instanceof Error?e.message:String(e)
      setError(message)
    }).finally(()=>{window.clearTimeout(timeout);if(active)setLoading(false)})
    const unsubscribe=subscribeGroupChat(e=>{
      if(controller.signal.aborted)return
      try{
        const event=JSON.parse(e.data)
        if(event.roomId&&event.roomId!==roomId)return
        if(event.type==='message:new')upsert([event.payload])
        if(event.type==='room:updated'&&event.payload){if(event.payload.members)setMembers(event.payload.members); if(event.payload.activeTheme)setActiveTheme(event.payload.activeTheme); if(event.payload.assignments)setLiveAssignments(Object.fromEntries(event.payload.assignments.map((assignment:AssignmentEnvelope)=>[assignment.assignmentId,assignment])))}
        if(event.type==='assignment:updated'&&event.payload?.assignmentId){
          setLiveAssignments(prev=>({...prev,[event.payload.assignmentId]:event.payload}))
        }
        if(event.type==='agent:status'&&event.payload?.agentId){
          setAgentStatuses(prev=>({...prev,[event.payload.agentId]:event.payload}))
        }
      }catch{/* Ignore malformed transport messages, not valid errors. */}
    })
    return ()=>{active=false;window.clearTimeout(timeout);controller.abort();unsubscribe()}
  },[retry, roomId, locale])
  useEffect(()=>{
    if(!error||!isEmptyState)return
    const timer=window.setTimeout(()=>setRetry(v=>v+1),5000)
    return()=>window.clearTimeout(timer)
  },[error,isEmptyState])
  useLayoutEffect(()=>{
    const syncAvailableHeight=()=>{
      const el=root.current
      if(!el||typeof window==='undefined')return
      const top=Math.max(0,el.getBoundingClientRect().top)
      el.style.setProperty('--gc-available-height',`${Math.max(320,window.innerHeight-top)}px`)
    }
    syncAvailableHeight()
    const frame=requestAnimationFrame(syncAvailableHeight)
    window.addEventListener('resize',syncAvailableHeight)
    const parent=root.current?.parentElement
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(syncAvailableHeight):null
    if(parent)observer?.observe(parent)
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',syncAvailableHeight);observer?.disconnect()}
  },[])
  useLayoutEffect(()=>{
    if(follow.current&&scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight
    if(!follow.current||!scroll.current)return
    const el=scroll.current
    const sync=()=>{el.scrollTop=el.scrollHeight}
    sync()
    const frame=requestAnimationFrame(()=>{sync();requestAnimationFrame(sync)})
    return ()=>cancelAnimationFrame(frame)
  },[messages.length, loading, activeAssignments.length])
  useEffect(()=>{
    const el=scroll.current
    if(!el)return
    const syncBottom=()=>{
      const height=bottom.current?.getBoundingClientRect().height||0
      el.style.setProperty('--gc-bottom-height', `${Math.ceil(height)}px`)
      if(follow.current)el.scrollTop=el.scrollHeight
    }
    const observer=new ResizeObserver(syncBottom)
    observer.observe(el)
    if(el.firstElementChild)observer.observe(el.firstElementChild)
    if(bottom.current)observer.observe(bottom.current)
    syncBottom()
    return ()=>observer.disconnect()
  },[])
  useEffect(()=>{localStorage.setItem('dsh-group-chat.status-open',String(statusOpen))},[statusOpen])
  useEffect(()=>{localStorage.setItem('dsh-group-chat.status-pos',JSON.stringify(statusPos))},[statusPos])
  const startDrag=(e:React.PointerEvent<HTMLDivElement>)=>{
    if((e.target as HTMLElement).closest('button'))return
    const rect=e.currentTarget.getBoundingClientRect()
    drag.current={dx:e.clientX-rect.left,dy:e.clientY-rect.top}
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const moveDrag=(e:React.PointerEvent<HTMLDivElement>)=>{
    if(!drag.current)return
    const parent=(e.currentTarget.offsetParent as HTMLElement)?.getBoundingClientRect()||{left:0,top:0,width:window.innerWidth,height:window.innerHeight}
    const rect=e.currentTarget.getBoundingClientRect()
    const nextX=Math.max(8,Math.min(parent.width-rect.width-8,e.clientX-parent.left-drag.current.dx))
    const nextY=Math.max(8,Math.min(parent.height-rect.height-8,e.clientY-parent.top-drag.current.dy))
    setStatusPos({x:Math.round(nextX),y:Math.round(nextY)})
  }
  const stopDrag=()=>{drag.current=null}
  const send=async()=>{
    if(!draft.trim()||sending)return
    await sendContent(draft.trim())
  }
  const sendContent=async(content:string)=>{
    if(!content.trim()||sending)return
    setSending(true);setError('');follow.current=true
    try{
      const response=await fetch('/dsh-group-chat/api/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomId,content:content.trim(),taskTier,locale})})
      const data=await response.json()
      if(!response.ok||!data.success)throw Error(data.error||'消息发送失败')
      setDraft('')
      setMessages(prev=>prev.some(m=>m.messageId===data.message.messageId)?prev:[...prev,data.message])
    }catch(e){setError(e instanceof Error?e.message:String(e))}finally{setSending(false)}
  }
  const copy=async(message:GroupMessage)=>{
    try{await navigator.clipboard.writeText(message.content);setCopied(message.messageId)}catch{setError('复制失败，请选择消息文字复制')}
  }
  const isCollapsibleContent=(content:string)=>{
    if(!content)return false
    const text=content.trim()
    if(text.length>140)return true
    const lines=text.split('\n').filter(l=>l.trim().length>0)
    return lines.length>3
  }
  const isMessageExpanded=(messageId:string,content:string,user:boolean)=>{
    if(user&&!isCollapsibleContent(content))return true
    if(!isCollapsibleContent(content))return true
    return expandOverrides[messageId]===true
  }
  const toggleMessageExpand=(messageId:string,content:string,user:boolean)=>{
    const current=isMessageExpanded(messageId,content,user)
    setExpandOverrides(prev=>({...prev,[messageId]:!current}))
  }
  const collapseAll=()=>{
    const next:Record<string,boolean>={}
    for(const m of messages)next[m.messageId]=false
    setExpandOverrides(next)
  }
  const expandAll=()=>{
    const next:Record<string,boolean>={}
    for(const m of messages)next[m.messageId]=true
    setExpandOverrides(next)
  }
  return <div ref={root} data-dsh-group-chat-panel className="gc-conversation">
    <style>{`
      .gc-conversation{position:relative;display:flex;flex-direction:column;flex:1;min-height:0;height:var(--gc-available-height,100%);max-height:var(--gc-available-height,100%);width:100%;overflow:hidden;color:var(--dsw-alias-label-primary,#eee);font-family:inherit;background:transparent;box-sizing:border-box;transition:padding-right .18s ease;}
      body[data-dsh-group-chat-tab-active="true"][data-dsh-group-chat-hud-docked-open="true"] .gc-conversation,body[data-dsh-group-chat-hero-open="true"][data-dsh-group-chat-hud-docked-open="true"] .gc-conversation{padding-right:min(var(--dsh-group-chat-hud-overlay-width,360px),max(0px,calc(100% - 320px)));}
      body[data-dsh-group-chat-tab-active="true"][data-dsh-group-chat-hud-docked-open="true"] .gc-chat-messages,body[data-dsh-group-chat-hero-open="true"][data-dsh-group-chat-hud-docked-open="true"] .gc-chat-messages{padding-left:24px;padding-right:24px;}
      body[data-dsh-group-chat-tab-active="true"][data-dsh-group-chat-hud-docked-open="true"] .gc-chat-bottom,body[data-dsh-group-chat-hero-open="true"][data-dsh-group-chat-hud-docked-open="true"] .gc-chat-bottom{padding-right:0;}
      body[data-dsh-group-chat-tab-active="true"][data-dsh-group-chat-hud-docked-open="true"] .gc-agent-float{max-width:min(calc(100% - 36px),calc(100% - min(var(--dsh-group-chat-hud-overlay-width,360px),max(44px,calc(100% - 320px))) - 36px));}
      .gc-chat-scroll{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable;scroll-behavior:auto;overflow-anchor:none;}
      .gc-scroll-content{min-height:100%;display:flex;flex-direction:column;}
      .gc-chat-messages{flex:1;padding:28px 24px calc(var(--gc-bottom-height,150px) + 24px);}
      .gc-chat-bottom{position:relative;flex:0 0 auto;z-index:5;background:linear-gradient(180deg,transparent 0,var(--dsw-alias-bg-base,#101014) 18px,var(--dsw-alias-bg-base,#101014) 100%);padding-top:18px;}
      .gc-latest{display:block;margin:0 auto 4px;padding:5px 12px;border-radius:16px;border:1px solid #8885;background:var(--dsw-alias-bg-layer-1,#222);color:inherit;cursor:pointer;}
      .gc-agent-float{position:absolute;z-index:6;width:210px;max-width:calc(100% - 36px);border:1px solid var(--dsw-alias-border-l2,#ffffff24);border-radius:16px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1,#202025) 90%,transparent);box-shadow:0 10px 30px #0004;backdrop-filter:blur(12px);padding:10px;color:inherit;font-size:12px;touch-action:none;}
      .gc-agent-float[data-open=false]{width:auto;padding:6px 8px;}
      .gc-agent-head{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:grab;user-select:none;}
      .gc-agent-drag{font-size:11px;color:var(--dsw-alias-label-tertiary,#999);font-weight:400;margin-left:4px;}
      .gc-agent-toggle{border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;}
      .gc-agent-list{display:flex;flex-direction:column;gap:7px;margin-top:8px;}
      .gc-agent-item{display:grid;grid-template-columns:24px 1fr auto;align-items:center;gap:8px;}
      .gc-agent-dot{width:7px;height:7px;border-radius:50%;background:#64748b;}
      .gc-agent-item[data-status=running] .gc-agent-dot{background:#4d6bfe;box-shadow:0 0 0 4px #4d6bfe22;}
      .gc-agent-item[data-status=complete] .gc-agent-dot{background:#10b981;}
      .gc-agent-item[data-status=error] .gc-agent-dot{background:#f87171;}
      .gc-agent-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;}
      .gc-agent-sub{grid-column:2/4;color:var(--dsw-alias-label-tertiary,#999);font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .gc-agent-idle{color:var(--dsw-alias-label-tertiary,#999);font-size:11px;margin-top:8px;}
      .gc-chat-thread{width:100%;max-width:960px;margin:0 auto;}
      .gc-chat-empty{height:100%;min-height:130px;display:grid;place-content:center;text-align:center;gap:10px;color:var(--dsw-alias-label-tertiary,#999);font-size:13px;}
      .gc-chat-empty strong{font-size:20px;font-weight:500;color:var(--dsw-alias-label-primary,#eee);}
      .gc-load-error{display:grid;gap:8px;max-width:560px;margin:0 auto;padding:16px;border:1px solid #f8717144;border-radius:16px;background:#7f1d1d22;color:#fecaca;}
      .gc-load-error strong{font-size:16px;color:#fee2e2;}
      .gc-load-error button{justify-self:center;border:1px solid #f8717166;border-radius:999px;background:#ef444422;color:#fee2e2;font:inherit;font-size:12px;padding:6px 12px;cursor:pointer;}
      .gc-onboarding{display:grid;gap:14px;max-width:760px;margin:0 auto;color:var(--dsw-alias-label-secondary,#cbd5e1);}
      .gc-onboarding-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}
      .gc-onboarding-step{padding:10px 12px;border:1px solid var(--dsw-alias-border-l1,#ffffff14);border-radius:14px;background:var(--dsw-alias-bg-layer-1,#202025);text-align:left;}
      .gc-onboarding-step b{display:block;color:var(--dsw-alias-label-primary,#eee);font-size:13px;margin-bottom:4px;}
      .gc-template-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}
      .gc-template-chip{border:1px solid var(--dsw-alias-border-l2,#ffffff22);border-radius:999px;background:var(--dsw-alias-bg-layer-2,#29292e);color:var(--dsw-alias-label-primary,#eee);font:inherit;font-size:12px;padding:6px 10px;cursor:pointer;}
      .gc-template-chip:hover{background:var(--dsw-alias-bg-layer-3,#33333a);border-color:#4d6bfe66;}
      .gc-message-live{opacity:.98;}
      .gc-message-live .gc-message-body{display:grid;gap:7px;color:var(--dsw-alias-label-secondary,#cbd5e1);}
      .gc-live-line{display:flex;align-items:center;gap:8px;min-width:0;font-weight:600;color:var(--dsw-alias-label-primary,#eee);}
      .gc-live-pulse{width:7px;height:7px;border-radius:50%;background:#4d6bfe;box-shadow:0 0 0 5px #4d6bfe24;animation:gcPulse 1.4s ease-in-out infinite;flex:0 0 auto;}
      .gc-live-brief{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary,#999);font-size:12px;}
      .gc-live-subtitle{color:var(--dsw-alias-label-secondary,#cbd5e1);font-size:12px;}
      .gc-live-details{margin-top:2px;border:1px solid var(--dsw-alias-border-l1,#ffffff14);border-radius:10px;background:var(--dsw-alias-bg-layer-1,#202025);padding:6px 8px;}
      .gc-live-details summary{cursor:pointer;color:var(--dsw-alias-label-secondary,#cbd5e1);font-size:12px;}
      .gc-live-detail-grid{display:grid;gap:4px;margin-top:6px;color:var(--dsw-alias-label-tertiary,#999);font-size:11px;}
      .gc-live-detail-grid code{white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-secondary,#cbd5e1);}
      .gc-live-bar{height:3px;max-width:360px;border-radius:999px;background:#ffffff14;overflow:hidden;}
      .gc-live-bar span{display:block;height:100%;border-radius:inherit;background:#4d6bfe;transition:width .3s ease;}
      .gc-live-dots{display:inline-flex;gap:3px;vertical-align:middle;}
      .gc-live-dots span{width:4px;height:4px;border-radius:50%;background:currentColor;opacity:.45;animation:gcDot 1.2s ease-in-out infinite;}
      .gc-live-dots span:nth-child(2){animation-delay:.18s}.gc-live-dots span:nth-child(3){animation-delay:.36s}
      @keyframes gcPulse{0%,100%{opacity:.55;transform:scale(.85)}50%{opacity:1;transform:scale(1.05)}}
      @keyframes gcDot{0%,80%,100%{opacity:.28;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}
      .gc-message{margin:0 0 30px;overflow-wrap:anywhere;}
      .gc-message-user{display:flex;flex-direction:column;align-items:flex-end;}
      .gc-message-body{font-size:13px;line-height:1.7;min-width:0;}
      .gc-plain-text{white-space:pre-wrap;overflow-wrap:anywhere;}
      .gc-message-user .gc-message-body{max-width:85%;padding:10px 16px;background:var(--dsw-alias-bg-layer-2,#29292e);border-radius:18px;white-space:pre-wrap;}
      .gc-message-meta{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:12px;color:var(--dsw-alias-label-secondary,#aaa);}
      .gc-message-avatar{width:22px;height:22px;display:inline-grid;place-items:center;object-fit:cover;border-radius:6px;}
      .gc-message-role{font-weight:500;color:var(--dsw-alias-label-primary,#eee);}
      .gc-message-actions{display:flex;align-items:center;gap:12px;margin-top:8px;color:var(--dsw-alias-label-tertiary,#999);font-size:11px;}
      .gc-copy{padding:3px 5px;display:flex;align-items:center;gap:4px;border:0;background:transparent;color:inherit;border-radius:5px;cursor:pointer;font:inherit;}
      .gc-copy:hover{background:var(--dsw-alias-bg-layer-2,#29292e);color:var(--dsw-alias-label-primary,#eee);}
      .gc-copy:focus-visible{outline:2px solid #8196ff;}
      .gc-message-system{padding:8px 12px;color:var(--dsw-alias-label-secondary,#aaa);font-size:12px;border-left:2px solid var(--dsw-alias-border-l2,#555);}
      .gc-autosetup-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}
      .gc-autosetup-actions button{border:1px solid var(--dsw-alias-border-l2,#42424b);border-radius:10px;padding:6px 10px;background:var(--dsw-alias-bg-layer-1,#202025);color:var(--dsw-alias-label-primary,#eee);font:inherit;font-size:12px;cursor:pointer;}
      .gc-autosetup-actions button:first-child{border-color:#4d6bfe66;background:#4d6bfe22;color:#dbe4ff;}
      .gc-autosetup-actions button:hover{background:var(--dsw-alias-bg-layer-2,#303036);}
      .gc-message details{margin:8px 0;color:var(--dsw-alias-label-secondary,#aaa);font-size:13px;}
      .gc-message summary{cursor:pointer;}
      .gc-message pre{max-width:100%;overflow:auto;}
      .gc-message-body>div{min-width:0;font-size:inherit!important;line-height:inherit!important;}
      .gc-message-body :is(p,li,td,th){font-size:13px;line-height:1.7;}
      .gc-message-body pre,.gc-message-body code{font-size:12px;}
      .gc-message-tools pre{white-space:pre-wrap;max-height:240px;}
      .gc-thread-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 16px;padding:8px 14px;border-radius:12px;background:var(--dsw-alias-bg-layer-1,#18181c);border:1px solid var(--dsw-alias-border-l1,#ffffff14);font-size:12px;}
      .gc-thread-info{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-label-secondary,#cbd5e1);font-weight:500;}
      .gc-thread-badge{font-size:13px;}
      .gc-thread-actions{display:flex;align-items:center;gap:6px;}
      .gc-thread-btn{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1,#ffffff18);background:var(--dsw-alias-bg-layer-2,#24242a);color:var(--dsw-alias-label-secondary,#cbd5e1);font:inherit;font-size:11px;cursor:pointer;transition:all .15s ease;}
      .gc-thread-btn:hover{background:var(--dsw-alias-interactive-bg-hover,#2e2e36);color:var(--dsw-alias-label-primary,#eee);border-color:var(--dsw-alias-border-l2,#ffffff2a);}
      .gc-message-body-wrap{position:relative;min-width:0;width:100%;}
      .gc-message-body[data-collapsed="true"]{max-height:86px;overflow:hidden;position:relative;mask-image:linear-gradient(180deg,#000 55%,transparent 100%);-webkit-mask-image:linear-gradient(180deg,#000 55%,transparent 100%);user-select:text;}
      .gc-collapse-trigger{width:100%;margin-top:6px;padding:6px 10px;display:flex;align-items:center;justify-content:center;gap:6px;border:1px dashed var(--dsw-alias-border-l1,#ffffff20);border-radius:8px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1,#1e1e24) 80%,transparent);color:var(--dsw-alias-label-secondary,#cbd5e1);font:inherit;font-size:11px;cursor:pointer;transition:all .15s ease;}
      .gc-collapse-trigger:hover{background:var(--dsw-alias-bg-layer-2,#292930);color:var(--dsw-alias-label-primary,#eee);border-color:var(--dsw-alias-state-business-primary,#4d6bfe66);}
      .gc-collapse-toggle-btn{padding:3px 6px;display:flex;align-items:center;gap:4px;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#aaa);border-radius:5px;cursor:pointer;font:inherit;font-size:11px;}
      .gc-collapse-toggle-btn:hover{background:var(--dsw-alias-bg-layer-2,#29292e);color:var(--dsw-alias-label-primary,#eee);}
      .gc-reasoning-details{margin:8px 0;border:1px solid var(--dsw-alias-border-l1,#ffffff14);border-radius:8px;background:color-mix(in oklab,var(--dsw-alias-bg-base,#141418) 75%,transparent);overflow:hidden;}
      .gc-reasoning-summary{display:flex;align-items:center;gap:7px;padding:6px 10px;font-size:12px;color:var(--dsw-alias-label-secondary,#a1a1aa);cursor:pointer;user-select:none;list-style:none;}
      .gc-reasoning-summary::-webkit-details-marker{display:none;}
      .gc-reasoning-summary:hover{background:var(--dsw-alias-interactive-bg-hover,#ffffff08);color:var(--dsw-alias-label-primary,#eee);}
      .gc-reasoning-icon{display:inline-flex;color:#a78bfa;flex:0 0 auto;}
      .gc-reasoning-title{font-weight:500;color:var(--dsw-alias-label-secondary,#cbd5e1);}
      .gc-reasoning-preview{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary,#71717a);font-size:11px;}
      .gc-reasoning-arrow{margin-left:auto;display:inline-flex;transition:transform .2s ease;}
      .gc-reasoning-details[open] .gc-reasoning-arrow{transform:rotate(180deg);}
      .gc-reasoning-body{padding:8px 12px 10px;border-top:1px solid var(--dsw-alias-border-l1,#ffffff10);font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary,#cbd5e1);}
      .gc-message-tool-calls{margin:6px 0;display:grid;gap:5px;min-width:0;width:100%;}
      .gc-tool-row{border:1px solid var(--dsw-alias-border-l1,#ffffff14);border-radius:8px;background:color-mix(in oklab,var(--dsw-alias-bg-base,#141418) 70%,transparent);overflow:hidden;transition:border-color .15s ease,background-color .15s ease;}
      .gc-tool-row:hover{border-color:var(--dsw-alias-border-l2,#ffffff26);background:color-mix(in oklab,var(--dsw-alias-bg-base,#141418) 85%,transparent);}
      .gc-tool-row[data-open="true"]{border-color:var(--dsw-alias-border-l2,#ffffff26);background:var(--dsw-alias-bg-base,#141418);}
      .gc-tool-row-header{display:flex;align-items:center;gap:7px;min-height:30px;padding:4px 10px;cursor:pointer;user-select:none;font-size:12px;}
      .gc-tool-icon{display:inline-flex;align-items:center;color:var(--dsw-alias-label-secondary,#a1a1aa);flex-shrink:0;}
      .gc-tool-title{font-weight:600;color:var(--dsw-alias-label-primary,#f8fafc);flex-shrink:0;}
      .gc-tool-sep{color:var(--dsw-alias-label-tertiary,#71717a);font-size:11px;user-select:none;}
      .gc-tool-target{font-family:var(--dsw-font-mono,ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace);font-size:11px;color:var(--dsw-alias-state-business-primary,#60a5fa);background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:320px;border:1px solid rgba(255,255,255,0.06);}
      .gc-tool-trailing{margin-left:auto;display:flex;align-items:center;gap:8px;font-size:11px;color:var(--dsw-alias-label-tertiary,#71717a);flex-shrink:0;}
      .gc-tool-duration{font-size:11px;color:var(--dsw-alias-label-tertiary,#71717a);}
      .gc-tool-status{display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:1px 6px;border-radius:4px;}
      .gc-tool-status-running{color:#60a5fa;background:rgba(96,165,250,0.12);}
      .gc-tool-spin{width:8px;height:8px;border:1.5px solid currentColor;border-right-color:transparent;border-radius:50%;animation:gc-tool-spin .8s linear infinite;}
      @keyframes gc-tool-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
      .gc-tool-status-error{color:#f87171;background:rgba(248,113,113,0.12);}
      .gc-tool-chevron{color:var(--dsw-alias-label-tertiary,#71717a);transition:transform .2s ease;flex-shrink:0;}
      .gc-tool-chevron-open{transform:rotate(180deg);}
      .gc-tool-row-body{padding:8px 10px;border-top:1px solid var(--dsw-alias-border-l1,#ffffff10);display:grid;gap:8px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1,#1e1e24) 40%,transparent);}
      .gc-tool-section{display:grid;gap:4px;}
      .gc-tool-section-label{font-size:10px;font-weight:700;color:var(--dsw-alias-label-tertiary,#71717a);letter-spacing:0.04em;}
      .gc-tool-code{margin:0;padding:6px 8px;border-radius:6px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);font-family:var(--dsw-font-mono,ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace);font-size:11px;line-height:1.5;color:var(--dsw-alias-label-secondary,#cbd5e1);max-height:180px;overflow:auto;white-space:pre-wrap;word-break:break-word;}
      .gc-tool-code-result{background:color-mix(in oklab,var(--dsw-alias-bg-base,#121216) 90%,black);}
      .gc-chat-error{margin:8px auto;max-width:960px;padding:8px 16px;font-size:12px;color:#fca5a5;}
      @media(max-width:900px){.gc-agent-float{display:none;}}
      @media(max-width:760px){body[data-dsh-group-chat-tab-active="true"][data-dsh-group-chat-hud-docked-open="true"] .gc-conversation,body[data-dsh-group-chat-hero-open="true"][data-dsh-group-chat-hud-docked-open="true"] .gc-conversation{padding-right:44px;}body[data-dsh-group-chat-tab-active="true"][data-dsh-group-chat-hud-docked-open="true"] .gc-chat-messages,body[data-dsh-group-chat-hero-open="true"][data-dsh-group-chat-hud-docked-open="true"] .gc-chat-messages{padding-left:12px;padding-right:12px;}body[data-dsh-group-chat-tab-active="true"][data-dsh-group-chat-hud-docked-open="true"] .gc-composer,body[data-dsh-group-chat-hero-open="true"][data-dsh-group-chat-hud-docked-open="true"] .gc-composer{padding-left:12px;padding-right:12px;}}
      @media(max-width:600px){.gc-chat-messages{padding:16px 12px calc(var(--gc-bottom-height,150px) + 20px);}.gc-message-user .gc-message-body{max-width:94%;}}
    `}</style>
    <div className="gc-agent-float" data-open={statusOpen} aria-label={tx(locale,'当前执行 Agent 状态','Current Agent status')} style={{left:statusPos.x,top:statusPos.y}} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
      <div className="gc-agent-head"><strong>{tx(locale,'Agent 状态','Agent status')} <span className="gc-agent-drag">{tx(locale,'拖动','drag')}</span></strong><button type="button" className="gc-agent-toggle" onClick={()=>setStatusOpen(v=>!v)}>{statusOpen?tx(locale,'隐藏','Hide'):tx(locale,'显示','Show')}</button></div>
      {statusOpen&&(Object.values(agentStatuses).length?<div className="gc-agent-list">{Object.values(agentStatuses).sort((a,b)=>(b.startedAt||b.finishedAt||0)-(a.startedAt||a.finishedAt||0)).slice(0,5).map(item=><div className="gc-agent-item" data-status={item.status} key={item.agentId}><AvatarBadge avatar={item.avatar} /><span className="gc-agent-name">{item.name}</span><span className="gc-agent-dot" title={item.status}/><span className="gc-agent-sub">{item.status==='running'?voice.runningText:item.status==='complete'?voice.completeText:voice.errorText}{item.taskTier?` · ${item.taskTier==='quick'?tx(locale,'快活','Quick'):tx(locale,'长活','Long')}`:''}{item.startedAt?` · ${Math.max(0,Math.round((now-item.startedAt)/1000))}s${item.expectedMs?`/${Math.round(item.expectedMs/1000)}s`:''}`:''}{item.modelUsed?` · ${item.providerUsed||''}/${item.modelUsed}`:''}{item.message?` · ${item.message}`:''}</span>{item.status==='running'&&item.expectedMs?<div className="gc-agent-progress" aria-label={tx(locale,'执行进度估计','Estimated progress')}><span style={{width:`${Math.min(96,Math.round(((now-(item.startedAt||now))/item.expectedMs)*100))}%`}} /></div>:null}</div>)}</div>:<div className="gc-agent-idle">{voice.idleStatusText}</div>)}
    </div>
    <div ref={scroll} className="gc-chat-scroll" onScroll={e=>{const el=e.currentTarget;follow.current=el.scrollHeight-el.scrollTop-el.clientHeight<80;setShowLatest(!follow.current)}}>
      <div className="gc-scroll-content"><div className="gc-chat-messages">
      {isEmptyState ? <div className="gc-chat-empty">{loading?<><strong>{tx(locale,'正在加载…','Loading…')}</strong><span>{tx(locale,'正在同步当前会话的群聊房间。','Syncing the group chat room for this session.')}</span></>:error?<div className="gc-load-error" role="alert"><strong>{tx(locale,'群聊加载失败','Group chat load failed')}</strong><span>{error}</span><button type="button" onClick={()=>setRetry(v=>v+1)}>{tx(locale,'重试加载','Retry loading')}</button></div>:<div className="gc-onboarding" aria-label={tx(locale,'Agent 群聊首次使用三步引导','Agent group chat onboarding')}><strong>{voice.emptyTitle}</strong><span>{voice.emptySubtitle}</span><div className="gc-onboarding-steps">{onboardingSteps.map(([title,body])=><div className="gc-onboarding-step" key={title}><b>{title}</b><span>{body}</span></div>)}</div><div className="gc-template-row" aria-label={tx(locale,'常见项目模板','Common project templates')}>{quickTemplates.map(item=><button type="button" key={item.label} className="gc-template-chip" onClick={()=>setDraft(item.text)}>{item.label}</button>)}</div></div>}</div> :
      <div className="gc-chat-thread" role="log" aria-label={tx(locale,'群聊消息记录','Group chat message log')} aria-live="polite" aria-relevant="additions">
        {messages.filter(m=>!m.metadata?.isSilent).length > 1 && (
          <div className="gc-thread-toolbar" aria-label={tx(locale,'群聊对话折叠控制','Group chat thread collapse controls')}>
            <div className="gc-thread-info">
              <span className="gc-thread-badge">💬</span>
              <span>{tx(locale,`共 ${messages.filter(m=>!m.metadata?.isSilent).length} 条群聊讨论`,`${messages.filter(m=>!m.metadata?.isSilent).length} messages in thread`)}</span>
            </div>
            <div className="gc-thread-actions">
              <button type="button" className="gc-thread-btn" onClick={collapseAll} title={tx(locale,'收起全部讨论（长发言默认收起）','Collapse all long messages')}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>
                {tx(locale,'全部收起','Collapse all')}
              </button>
              <button type="button" className="gc-thread-btn" onClick={expandAll} title={tx(locale,'展开全部长发言','Expand all long messages')}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                {tx(locale,'全部展开','Expand all')}
              </button>
            </div>
          </div>
        )}
        {messages.filter(m=>!m.metadata?.isSilent).map(message=>{
          const user=message.sender.kind==='user'
          if(message.sender.kind==='system')return <div key={message.messageId} className="gc-message gc-message-system"><SafeMessageText text={message.content} markdown={useMarkdown}/>{message.metadata?.autoSetup==='draft'&&<div className="gc-autosetup-actions" aria-label={tx(locale,'自动建群草案操作','Auto setup draft actions')}><button type="button" disabled={sending} onClick={()=>sendContent(locale==='en-US'?'Confirm setup':'确认创建')}>{tx(locale,'确认创建','Confirm setup')}</button><button type="button" disabled={sending} onClick={()=>sendContent(locale==='en-US'?'Cancel setup':'取消创建')}>{tx(locale,'取消创建','Cancel setup')}</button><button type="button" onClick={()=>setDraft(tx(locale,'补充修改：','Revise: '))}>{tx(locale,'补充修改','Revise')}</button></div>}</div>
          const isLong=!user&&isCollapsibleContent(message.content)
          const expanded=isMessageExpanded(message.messageId,message.content,user)
          const collapsed=isLong&&!expanded
          const senderDisplayName=user?message.sender.name:memberName(message.sender.id)
          return <article key={message.messageId} className={`gc-message ${user?'gc-message-user':'gc-message-agent'}`} aria-label={`${senderDisplayName}的消息`}>
            {!user&&<div className="gc-message-meta">
              <AvatarBadge avatar={message.sender.avatar} className="gc-message-avatar" />
              <span className="gc-message-role">{senderDisplayName}</span>
            </div>}
            {message.reasoningContent&&(
              <details className="gc-reasoning-details">
                <summary className="gc-reasoning-summary">
                  <span className="gc-reasoning-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2a4 4 0 0 0-4 4c0 .4.1.8.2 1.2A4.5 4.5 0 0 0 5 11.5c0 1.5.7 2.8 1.8 3.6A4.5 4.5 0 0 0 11 20h2a4.5 4.5 0 0 0 4.2-4.9c1.1-.8 1.8-2.1 1.8-3.6 0-2.3-1.7-4.2-3.8-4.5.1-.4.2-.8.2-1.2a4 4 0 0 0-4-4z"/><path d="M12 2v20"/></svg>
                  </span>
                  <span className="gc-reasoning-title">{tx(locale,'思考过程','Thinking process')}</span>
                  <span className="gc-reasoning-preview">
                    {message.reasoningContent.trim().split('\n')[0].slice(0, 50)}…
                  </span>
                  <span className="gc-reasoning-arrow">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </span>
                </summary>
                <div className="gc-reasoning-body">
                  <SafeMessageText text={message.reasoningContent} markdown={useMarkdown}/>
                </div>
              </details>
            )}
            {message.metadata?.toolCalls && message.metadata.toolCalls.length > 0 && (
              <div className="gc-message-tools gc-message-tool-calls" aria-label={tx(locale, '工具调用', 'Tool calls')}>
                {message.metadata.toolCalls?.map(tool => (
                  <GroupChatToolRow key={tool.id} tool={tool} locale={locale} />
                ))}
              </div>
            )}
            <div className="gc-message-body-wrap">
              <div className="gc-message-body" data-collapsed={collapsed ? 'true' : 'false'}>
                {user?message.content:<SafeMessageText text={message.content} markdown={useMarkdown}/>}
              </div>
              {collapsed && (
                <button type="button" className="gc-collapse-trigger" onClick={()=>toggleMessageExpand(message.messageId,message.content,user)} aria-label={tx(locale,'展开全文','Expand full message')}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  <span>{tx(locale,`展开全文 · 共 ${message.content.length} 字`,`Expand full message · ${message.content.length} chars`)}</span>
                </button>
              )}
            </div>
            <div className="gc-message-actions">
              <button type="button" className="gc-copy" onClick={()=>copy(message)} aria-label={tx(locale, `复制${senderDisplayName}的消息`, `Copy message from ${senderDisplayName}`)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg>{copied===message.messageId?tx(locale,'已复制','Copied'):tx(locale,'复制','Copy')}
              </button>
              {isLong && (
                <button type="button" className="gc-collapse-toggle-btn" onClick={()=>toggleMessageExpand(message.messageId,message.content,user)} aria-label={expanded?tx(locale,'收起内容','Collapse content'):tx(locale,'展开全文','Expand content')}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {expanded ? <path d="m18 15-6-6-6 6"/> : <path d="m6 9 6 6 6-6"/>}
                  </svg>
                  {expanded ? tx(locale,'收起','Collapse') : tx(locale,'展开','Expand')}
                </button>
              )}
              <time dateTime={new Date(message.timestamp).toISOString()}>{new Date(message.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time>
              {!user&&message.metadata?.modelUsed&&<span title={message.metadata.providerUsed}>{message.metadata.modelUsed}</span>}
            </div>
          </article>
        })}
        {activeAssignments.map(assignment=><article key={`live-${assignment.assignmentId}`} className="gc-message gc-message-agent gc-message-live" aria-label={`${memberName(assignment.ownerRoleId)}${tx(locale,'正在执行',' is working')}`} data-assignment-id={assignment.assignmentId}>
          <div className="gc-message-meta">
            <AvatarBadge avatar={memberAvatar(assignment.ownerRoleId)} className="gc-message-avatar" />
            <span className="gc-message-role">{memberName(assignment.ownerRoleId)}</span>
          </div>
          <div className="gc-message-body" aria-live="polite">
            <div className="gc-live-line"><span className="gc-live-pulse" />{assignmentLiveTitle(assignment)} <span className="gc-live-dots" aria-hidden="true"><span/><span/><span/></span></div>
            <div className="gc-live-subtitle">{assignmentLiveSubtitle(assignment)}</div>
            <details className="gc-live-details">
              <summary>{tx(locale,'展开执行详情','Show execution details')}</summary>
              <div className="gc-live-detail-grid">
                <span>{tx(locale,'状态','Status')}：{assignmentStatusText(assignment)}</span>
                <span>{tx(locale,'任务','Task')}：{assignment.brief}</span>
                <span>{tx(locale,'来源','From')}：@{assignment.createdByRoleId || 'user'}{assignment.workflowTaskId?` · ${tx(locale,'工作流任务','Workflow task')} ${assignment.workflowTaskId}`:''}</span>
                {assignment.error?<code>{assignment.error}</code>:null}
              </div>
            </details>
            <div className="gc-live-bar" aria-label={tx(locale,'执行进度估计','Estimated progress')}><span style={{width:`${assignmentProgress(assignment)}%`}} /></div>
          </div>
          <div className="gc-message-actions">
            <span>{assignment.taskTier==='long'?tx(locale,'长活','Long'):tx(locale,'快活','Quick')}</span>
            {assignment.startedAt?<span>{assignmentElapsed(assignment)}s{assignment.expectedMs?`/${Math.round(assignment.expectedMs/1000)}s`:''}</span>:null}
          </div>
        </article>)}
      </div>}
      </div></div>
    </div>
    <div className="gc-chat-bottom" ref={bottom}>
      {showLatest&&<button className="gc-latest" aria-label="滚动到底部" onClick={()=>{follow.current=true;setShowLatest(false);if(scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight}}>↓ 回到最新</button>}
      {error&&!isEmptyState&&<div className="gc-chat-error" role="alert">{error} <button type="button" onClick={()=>setRetry(v=>v+1)}>{tx(locale,'重试加载','Retry loading')}</button></div>}
      <GroupChatComposer members={members} value={draft} onChange={setDraft} onSend={send} sending={sending} taskTier={taskTier} onTaskTierChange={setTaskTier} locale={locale}/>
    </div>
  </div>
}

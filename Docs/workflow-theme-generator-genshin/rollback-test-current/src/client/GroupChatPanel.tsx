import {subscribeGroupChat} from './group-chat-events.js'
import {AvatarBadge} from './AvatarBadge.js'
import React, {useEffect, useRef, useState} from 'react'
import {MarkdownText} from '@deepseek-ai/dsh-client-ui-primitives'
import {GroupChatComposer} from './GroupChatComposer.js'
import type {AgentProfile, AgentStatus, GroupMessage} from './group-chat-view-types.js'

export interface GroupChatPanelProps { mode?: 'dock' | 'full'; onClose?: () => void }
export function GroupChatPanel({mode='full'}:GroupChatPanelProps) {
  const [members,setMembers]=useState<AgentProfile[]>([])
  const [messages,setMessages]=useState<GroupMessage[]>([])
  const [draft,setDraft]=useState('')
  const [sending,setSending]=useState(false)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [copied,setCopied]=useState('')
  const [retry,setRetry]=useState(0)
  const scroll=useRef<HTMLDivElement>(null)
  const bottom=useRef<HTMLDivElement>(null)
  const follow=useRef(true)
  const [showLatest,setShowLatest]=useState(false)
  const [agentStatuses,setAgentStatuses]=useState<Record<string,AgentStatus>>({})
  const [statusOpen,setStatusOpen]=useState(()=>localStorage.getItem('dsh-group-chat.status-open')!=='false')
  const [statusPos,setStatusPos]=useState(()=>{try{return JSON.parse(localStorage.getItem('dsh-group-chat.status-pos')||'{"x":18,"y":18}')}catch{return {x:18,y:18}}})
  const drag=useRef<{dx:number;dy:number}|null>(null)
  const roomId='dev-team-alpha'
  useEffect(()=>{
    if(mode!=='full')return
    document.body.setAttribute('data-dsh-group-chat-active','true')
    return ()=>document.body.removeAttribute('data-dsh-group-chat-active')
  },[mode])
  useEffect(()=>{
    const controller=new AbortController()
    const upsert=(list:GroupMessage[])=>setMessages(prev=>{
      const byId=new Map(prev.map(m=>[m.messageId,m]))
      for(const message of list)byId.set(message.messageId,message)
      return [...byId.values()].sort((a,b)=>a.timestamp-b.timestamp)
    })
    setLoading(true);setError('')
    fetch(`/dsh-group-chat/api/room?id=${roomId}`,{signal:controller.signal}).then(async r=>{
      if(!r.ok)throw Error(`加载失败 (${r.status})`)
      const data=await r.json()
      if(!data.room)throw Error('群聊数据暂未就绪')
      if(controller.signal.aborted)return
      setMembers(data.room.members);upsert(data.messages||[])
    }).catch(e=>{if(!controller.signal.aborted)setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)})
    const unsubscribe=subscribeGroupChat(e=>{
      if(controller.signal.aborted)return
      try{
        const event=JSON.parse(e.data)
        if(event.roomId&&event.roomId!==roomId)return
        if(event.type==='message:new')upsert([event.payload])
        if(event.type==='room:updated'&&event.payload.members)setMembers(event.payload.members)
        if(event.type==='agent:status'&&event.payload?.agentId){
          setAgentStatuses(prev=>({...prev,[event.payload.agentId]:event.payload}))
        }
      }catch{/* Ignore malformed transport messages, not valid errors. */}
    })
    return ()=>{controller.abort();unsubscribe()}
  },[retry])
  useEffect(()=>{
    if(follow.current&&scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight
  },[messages])
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
    setSending(true);setError('');follow.current=true
    try{
      const response=await fetch('/dsh-group-chat/api/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomId,content:draft.trim()})})
      const data=await response.json()
      if(!response.ok||!data.success)throw Error(data.error||'消息发送失败')
      setDraft('')
      setMessages(prev=>prev.some(m=>m.messageId===data.message.messageId)?prev:[...prev,data.message])
    }catch(e){setError(e instanceof Error?e.message:String(e))}finally{setSending(false)}
  }
  const copy=async(message:GroupMessage)=>{
    try{await navigator.clipboard.writeText(message.content);setCopied(message.messageId)}catch{setError('复制失败，请选择消息文字复制')}
  }
  return <div data-dsh-group-chat-panel className="gc-conversation">
    <style>{`
      .gc-conversation{position:relative;display:flex;flex-direction:column;flex:1;min-height:0;height:100%;width:100%;overflow:hidden;color:var(--dsw-alias-label-primary,#eee);font-family:inherit;background:transparent;}
      .gc-chat-scroll{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable;scroll-behavior:auto;overflow-anchor:none;}
      .gc-scroll-content{min-height:100%;display:flex;flex-direction:column;}
      .gc-chat-messages{flex:1;padding:28px 24px calc(var(--gc-bottom-height,150px) + 24px);}
      .gc-chat-bottom{position:relative;z-index:5;background:var(--dsw-alias-bg-base,#101014);padding-top:10px;}
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
      .gc-message{margin:0 0 30px;overflow-wrap:anywhere;}
      .gc-message-user{display:flex;flex-direction:column;align-items:flex-end;}
      .gc-message-body{font-size:13px;line-height:1.7;min-width:0;}
      .gc-message-user .gc-message-body{max-width:85%;padding:10px 16px;background:var(--dsw-alias-bg-layer-2,#29292e);border-radius:18px;white-space:pre-wrap;}
      .gc-message-meta{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:12px;color:var(--dsw-alias-label-secondary,#aaa);}
      .gc-message-avatar{width:22px;height:22px;display:inline-grid;place-items:center;object-fit:cover;border-radius:6px;}
      .gc-message-role{font-weight:500;color:var(--dsw-alias-label-primary,#eee);}
      .gc-message-actions{display:flex;align-items:center;gap:12px;margin-top:8px;color:var(--dsw-alias-label-tertiary,#999);font-size:11px;}
      .gc-copy{padding:3px 5px;display:flex;align-items:center;gap:4px;border:0;background:transparent;color:inherit;border-radius:5px;cursor:pointer;font:inherit;}
      .gc-copy:hover{background:var(--dsw-alias-bg-layer-2,#29292e);color:var(--dsw-alias-label-primary,#eee);}
      .gc-copy:focus-visible{outline:2px solid #8196ff;}
      .gc-message-system{padding:8px 12px;color:var(--dsw-alias-label-secondary,#aaa);font-size:12px;border-left:2px solid var(--dsw-alias-border-l2,#555);}
      .gc-message details{margin:8px 0;color:var(--dsw-alias-label-secondary,#aaa);font-size:13px;}
      .gc-message summary{cursor:pointer;}
      .gc-message pre{max-width:100%;overflow:auto;}
      .gc-message-body>div{min-width:0;font-size:inherit!important;line-height:inherit!important;}
      .gc-message-body :is(p,li,td,th){font-size:13px;line-height:1.7;}
      .gc-message-body pre,.gc-message-body code{font-size:12px;}
      .gc-message-tools pre{white-space:pre-wrap;max-height:240px;}
      .gc-chat-error{margin:8px auto;max-width:960px;padding:8px 16px;font-size:12px;color:#fca5a5;}
      @media(max-width:900px){.gc-agent-float{display:none;}}
      @media(max-width:600px){.gc-chat-messages{padding:16px 12px calc(var(--gc-bottom-height,150px) + 20px);}.gc-message-user .gc-message-body{max-width:94%;}}
    `}</style>
    <div className="gc-agent-float" data-open={statusOpen} aria-label="当前执行 Agent 状态" style={{left:statusPos.x,top:statusPos.y}} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
      <div className="gc-agent-head"><strong>Agent 状态 <span className="gc-agent-drag">拖动</span></strong><button type="button" className="gc-agent-toggle" onClick={()=>setStatusOpen(v=>!v)}>{statusOpen?'隐藏':'显示'}</button></div>
      {statusOpen&&(Object.values(agentStatuses).length?<div className="gc-agent-list">{Object.values(agentStatuses).sort((a,b)=>(b.startedAt||b.finishedAt||0)-(a.startedAt||a.finishedAt||0)).slice(0,5).map(item=><div className="gc-agent-item" data-status={item.status} key={item.agentId}><AvatarBadge avatar={item.avatar} /><span className="gc-agent-name">{item.name}</span><span className="gc-agent-dot" title={item.status}/><span className="gc-agent-sub">{item.status==='running'?'执行中':item.status==='complete'?'已完成':'出错'}{item.modelUsed?` · ${item.providerUsed||''}/${item.modelUsed}`:''}{item.message?` · ${item.message}`:''}</span></div>)}</div>:<div className="gc-agent-idle">当前没有正在执行的角色。</div>)}
    </div>
    <div ref={scroll} className="gc-chat-scroll" onScroll={e=>{const el=e.currentTarget;follow.current=el.scrollHeight-el.scrollTop-el.clientHeight<80;setShowLatest(!follow.current)}}>
      <div className="gc-scroll-content"><div className="gc-chat-messages">
      {!messages.length ? <div className="gc-chat-empty"><strong>{loading?'正在加载…':'开始群聊'}</strong><span>{loading?'':'发送消息，或通过下方 @ 选择角色'}</span></div> :
      <div className="gc-chat-thread" role="log" aria-label="群聊消息记录" aria-live="polite" aria-relevant="additions">
        {messages.filter(m=>!m.metadata?.isSilent).map(message=>{
          const user=message.sender.kind==='user'
          if(message.sender.kind==='system')return <div key={message.messageId} className="gc-message gc-message-system">{message.content}</div>
          return <article key={message.messageId} className={`gc-message ${user?'gc-message-user':'gc-message-agent'}`} aria-label={`${message.sender.name}的消息`}>
            {!user&&<div className="gc-message-meta">
              <AvatarBadge avatar={message.sender.avatar} className="gc-message-avatar" />
              <span className="gc-message-role">{message.sender.name}</span>
            </div>}
            {message.reasoningContent&&<details><summary>思考过程</summary><MarkdownText text={message.reasoningContent}/></details>}
            {message.metadata?.toolCalls?.map(tool=><details className="gc-message-tools" key={tool.id}><summary>{tool.name} · {tool.status}</summary><pre>{tool.arguments}</pre>{tool.result&&<pre>{tool.result}</pre>}</details>)}
            <div className="gc-message-body">{user?message.content:<MarkdownText text={message.content}/>}</div>
            <div className="gc-message-actions">
              <button type="button" className="gc-copy" onClick={()=>copy(message)} aria-label={`复制${message.sender.name}的消息`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg>{copied===message.messageId?'已复制':'复制'}
              </button>
              <time dateTime={new Date(message.timestamp).toISOString()}>{new Date(message.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time>
              {!user&&message.metadata?.modelUsed&&<span title={message.metadata.providerUsed}>{message.metadata.modelUsed}</span>}
            </div>
          </article>
        })}
      </div>}
    </div>
    <div className="gc-chat-bottom" ref={bottom}>
    {showLatest&&<button className="gc-latest" aria-label="滚动到底部" onClick={()=>{follow.current=true;setShowLatest(false);if(scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight}}>↓ 回到最新</button>}
    {error&&<div className="gc-chat-error" role="alert">{error} <button type="button" onClick={()=>setRetry(v=>v+1)}>重试加载</button></div>}
    <GroupChatComposer members={members} value={draft} onChange={setDraft} onSend={send} sending={sending}/>
    </div></div></div>
  </div>
}


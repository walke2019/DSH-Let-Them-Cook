import React, {useEffect, useRef, useState} from 'react'
import {MarkdownText} from '@deepseek-ai/dsh-client-ui-primitives'
import {GroupChatComposer} from './GroupChatComposer.js'
import type {AgentProfile, GroupMessage} from './group-chat-view-types.js'

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
  const follow=useRef(true)
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
    const events=new EventSource('/dsh-group-chat/api/events')
    events.onmessage=e=>{
      if(controller.signal.aborted)return
      try{
        const event=JSON.parse(e.data)
        if(event.roomId&&event.roomId!==roomId)return
        if(event.type==='message:new')upsert([event.payload])
        if(event.type==='room:updated'&&event.payload.members)setMembers(event.payload.members)
      }catch{/* Ignore malformed transport messages, not valid errors. */}
    }
    return ()=>{controller.abort();events.close()}
  },[retry])
  useEffect(()=>{
    if(follow.current&&scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight
  },[messages])
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
      .gc-conversation{display:flex;flex-direction:column;flex:1;min-height:0;height:100%;width:100%;overflow:hidden;color:var(--dsw-alias-label-primary,#eee);font-family:inherit;background:transparent;}
      .gc-chat-scroll{flex:1;min-height:0;overflow:auto;padding:28px 24px 16px;}
      .gc-chat-thread{width:100%;max-width:960px;margin:0 auto;}
      .gc-chat-empty{height:100%;min-height:130px;display:grid;place-content:center;text-align:center;gap:10px;color:var(--dsw-alias-label-tertiary,#999);font-size:13px;}
      .gc-chat-empty strong{font-size:20px;font-weight:500;color:var(--dsw-alias-label-primary,#eee);}
      .gc-message{margin:0 0 30px;overflow-wrap:anywhere;}
      .gc-message-user{display:flex;flex-direction:column;align-items:flex-end;}
      .gc-message-body{font-size:15px;line-height:1.75;min-width:0;}
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
      .gc-message-body>div{min-width:0;}
      .gc-message-tools pre{white-space:pre-wrap;max-height:240px;}
      .gc-chat-error{margin:8px auto;max-width:960px;padding:8px 16px;font-size:12px;color:#fca5a5;}
      @media(max-width:600px){.gc-chat-scroll{padding:16px 12px;}.gc-message-user .gc-message-body{max-width:94%;}}
    `}</style>
    <div ref={scroll} className="gc-chat-scroll" onScroll={e=>{const el=e.currentTarget;follow.current=el.scrollHeight-el.scrollTop-el.clientHeight<80}}>
      {!messages.length ? <div className="gc-chat-empty"><strong>{loading?'正在加载…':'开始群聊'}</strong><span>{loading?'':'发送消息，或通过下方 @ 选择角色'}</span></div> :
      <div className="gc-chat-thread" role="log" aria-label="群聊消息记录" aria-live="polite" aria-relevant="additions">
        {messages.filter(m=>!m.metadata?.isSilent).map(message=>{
          const user=message.sender.kind==='user'
          if(message.sender.kind==='system')return <div key={message.messageId} className="gc-message gc-message-system">{message.content}</div>
          return <article key={message.messageId} className={`gc-message ${user?'gc-message-user':'gc-message-agent'}`} aria-label={`${message.sender.name}的消息`}>
            {!user&&<div className="gc-message-meta">
              {/^(data:|https?:)/.test(message.sender.avatar||'')?<img className="gc-message-avatar" src={message.sender.avatar} alt=""/>:<span className="gc-message-avatar" aria-hidden="true">{message.sender.avatar||'◉'}</span>}
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
    {error&&<div className="gc-chat-error" role="alert">{error} <button type="button" onClick={()=>setRetry(v=>v+1)}>重试加载</button></div>}
    <GroupChatComposer members={members} value={draft} onChange={setDraft} onSend={send} sending={sending}/>
  </div>
}

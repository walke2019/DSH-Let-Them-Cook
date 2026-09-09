from pathlib import Path
p=Path('src/client/GroupChatPanel.tsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace("import type {AgentProfile, GroupMessage} from './group-chat-view-types.js'", "import type {AgentProfile, AgentStatus, GroupMessage} from './group-chat-view-types.js'")
s=s.replace("  const scroll=useRef<HTMLDivElement>(null)", "  const scroll=useRef<HTMLDivElement>(null)\n  const bottom=useRef<HTMLDivElement>(null)")
s=s.replace("  const [showLatest,setShowLatest]=useState(false)", "  const [showLatest,setShowLatest]=useState(false)\n  const [agentStatuses,setAgentStatuses]=useState<Record<string,AgentStatus>>({})\n  const [statusOpen,setStatusOpen]=useState(()=>localStorage.getItem('dsh-group-chat.status-open')!=='false')")
s=s.replace("        if(event.type==='message:new')upsert([event.payload])\n        if(event.type==='room:updated'&&event.payload.members)setMembers(event.payload.members)", """        if(event.type==='message:new')upsert([event.payload])
        if(event.type==='room:updated'&&event.payload.members)setMembers(event.payload.members)
        if(event.type==='agent:status'&&event.payload?.agentId){
          setAgentStatuses(prev=>({...prev,[event.payload.agentId]:event.payload}))
        }""")
s=s.replace("  useEffect(()=>{\n    const el=scroll.current\n    if(!el)return\n    const observer=new ResizeObserver(()=>{if(follow.current)el.scrollTop=el.scrollHeight})\n    observer.observe(el)\n    if(el.firstElementChild)observer.observe(el.firstElementChild)\n    return ()=>observer.disconnect()\n  },[])", """  useEffect(()=>{
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
  useEffect(()=>{localStorage.setItem('dsh-group-chat.status-open',String(statusOpen))},[statusOpen])""")
s=s.replace("      .gc-conversation{display:flex;flex-direction:column;flex:1;min-height:0;height:100%;width:100%;overflow:hidden;color:var(--dsw-alias-label-primary,#eee);font-family:inherit;background:transparent;}", "      .gc-conversation{position:relative;display:flex;flex-direction:column;flex:1;min-height:0;height:100%;width:100%;overflow:hidden;color:var(--dsw-alias-label-primary,#eee);font-family:inherit;background:transparent;}")
s=s.replace("      .gc-chat-messages{flex:1;padding:28px 24px 16px;}", "      .gc-chat-messages{flex:1;padding:28px 24px calc(var(--gc-bottom-height,150px) + 24px);}")
s=s.replace("      .gc-chat-bottom{position:sticky;bottom:0;z-index:5;background:var(--dsw-alias-bg-base,#101014);}", "      .gc-chat-bottom{position:sticky;bottom:0;z-index:5;background:linear-gradient(to top,var(--dsw-alias-bg-base,#101014) 86%,transparent);padding-top:10px;}")
s=s.replace("      .gc-latest{display:block;margin:0 auto;padding:5px 12px;border-radius:16px;border:1px solid #8885;background:var(--dsw-alias-bg-layer-1,#222);color:inherit;cursor:pointer;}", "      .gc-latest{display:block;margin:0 auto 4px;padding:5px 12px;border-radius:16px;border:1px solid #8885;background:var(--dsw-alias-bg-layer-1,#222);color:inherit;cursor:pointer;}\n      .gc-agent-float{position:absolute;left:18px;top:18px;z-index:6;width:210px;max-width:calc(100% - 36px);border:1px solid var(--dsw-alias-border-l2,#ffffff24);border-radius:16px;background:color-mix(in oklab,var(--dsw-alias-bg-layer-1,#202025) 90%,transparent);box-shadow:0 10px 30px #0004;backdrop-filter:blur(12px);padding:10px;color:inherit;font-size:12px;}\n      .gc-agent-float[data-open=false]{width:auto;padding:6px 8px;}\n      .gc-agent-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}\n      .gc-agent-toggle{border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;}\n      .gc-agent-list{display:flex;flex-direction:column;gap:7px;margin-top:8px;}\n      .gc-agent-item{display:grid;grid-template-columns:24px 1fr auto;align-items:center;gap:8px;}\n      .gc-agent-dot{width:7px;height:7px;border-radius:50%;background:#64748b;}\n      .gc-agent-item[data-status=running] .gc-agent-dot{background:#4d6bfe;box-shadow:0 0 0 4px #4d6bfe22;}\n      .gc-agent-item[data-status=complete] .gc-agent-dot{background:#10b981;}\n      .gc-agent-item[data-status=error] .gc-agent-dot{background:#f87171;}\n      .gc-agent-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;}\n      .gc-agent-sub{grid-column:2/4;color:var(--dsw-alias-label-tertiary,#999);font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}\n      .gc-agent-idle{color:var(--dsw-alias-label-tertiary,#999);font-size:11px;margin-top:8px;}")
s=s.replace("      @media(max-width:600px){.gc-chat-messages{padding:16px 12px;}.gc-message-user .gc-message-body{max-width:94%;}}", "      @media(max-width:900px){.gc-agent-float{display:none;}}\n      @media(max-width:600px){.gc-chat-messages{padding:16px 12px calc(var(--gc-bottom-height,150px) + 20px);}.gc-message-user .gc-message-body{max-width:94%;}}")
insert="""    <div className=\"gc-agent-float\" data-open={statusOpen} aria-label=\"当前执行 Agent 状态\">
      <div className=\"gc-agent-head\"><strong>Agent 状态</strong><button type=\"button\" className=\"gc-agent-toggle\" onClick={()=>setStatusOpen(v=>!v)}>{statusOpen?'隐藏':'显示'}</button></div>
      {statusOpen&&(Object.values(agentStatuses).length?<div className=\"gc-agent-list\">{Object.values(agentStatuses).sort((a,b)=>(b.startedAt||b.finishedAt||0)-(a.startedAt||a.finishedAt||0)).slice(0,5).map(item=><div className=\"gc-agent-item\" data-status={item.status} key={item.agentId}><span aria-hidden=\"true\">{item.avatar||'◉'}</span><span className=\"gc-agent-name\">{item.name}</span><span className=\"gc-agent-dot\" title={item.status}/><span className=\"gc-agent-sub\">{item.status==='running'?'执行中':item.status==='complete'?'已完成':'出错'}{item.modelUsed?` · ${item.providerUsed||''}/${item.modelUsed}`:''}{item.message?` · ${item.message}`:''}</span></div>)}</div>:<div className=\"gc-agent-idle\">当前没有正在执行的角色。</div>)}
    </div>
"""
s=s.replace("    <div ref={scroll} className=\"gc-chat-scroll\"", insert+"    <div ref={scroll} className=\"gc-chat-scroll\"")
s=s.replace("    <div className=\"gc-chat-bottom\">", "    <div className=\"gc-chat-bottom\" ref={bottom}>")
p.write_text(s,encoding='utf-8')

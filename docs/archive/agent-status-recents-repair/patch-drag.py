from pathlib import Path
p=Path('src/client/GroupChatPanel.tsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace("  const [statusOpen,setStatusOpen]=useState(()=>localStorage.getItem('dsh-group-chat.status-open')!=='false')", """  const [statusOpen,setStatusOpen]=useState(()=>localStorage.getItem('dsh-group-chat.status-open')!=='false')
  const [statusPos,setStatusPos]=useState(()=>{try{return JSON.parse(localStorage.getItem('dsh-group-chat.status-pos')||'{\"x\":18,\"y\":18}')}catch{return {x:18,y:18}}})
  const drag=useRef<{dx:number;dy:number}|null>(null)""")
s=s.replace("  useEffect(()=>{localStorage.setItem('dsh-group-chat.status-open',String(statusOpen))},[statusOpen])", """  useEffect(()=>{localStorage.setItem('dsh-group-chat.status-open',String(statusOpen))},[statusOpen])
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
  const stopDrag=()=>{drag.current=null}""")
s=s.replace("      .gc-agent-float{position:absolute;left:18px;top:18px;z-index:6;width:210px;max-width:calc(100% - 36px);border", "      .gc-agent-float{position:absolute;z-index:6;width:210px;max-width:calc(100% - 36px);border")
s=s.replace("padding:10px;color:inherit;font-size:12px;}", "padding:10px;color:inherit;font-size:12px;touch-action:none;}" ,1)
s=s.replace("      .gc-agent-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}", "      .gc-agent-head{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:grab;user-select:none;}\n      .gc-agent-drag{font-size:11px;color:var(--dsw-alias-label-tertiary,#999);font-weight:400;margin-left:4px;}")
s=s.replace("    <div className=\"gc-agent-float\" data-open={statusOpen} aria-label=\"当前执行 Agent 状态\">\n      <div className=\"gc-agent-head\"><strong>Agent 状态</strong><button type=\"button\" className=\"gc-agent-toggle\" onClick={()=>setStatusOpen(v=>!v)}>{statusOpen?'隐藏':'显示'}</button></div>", """    <div className=\"gc-agent-float\" data-open={statusOpen} aria-label=\"当前执行 Agent 状态\" style={{left:statusPos.x,top:statusPos.y}} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
      <div className=\"gc-agent-head\"><strong>Agent 状态 <span className=\"gc-agent-drag\">拖动</span></strong><button type=\"button\" className=\"gc-agent-toggle\" onClick={()=>setStatusOpen(v=>!v)}>{statusOpen?'隐藏':'显示'}</button></div>""")
p.write_text(s,encoding='utf-8')

from pathlib import Path
p=Path('src/client/GroupChatSideDock.tsx')
s=p.read_text(encoding='utf-8')
s=s.replace("activeTheme: 'modern' | 'three_kingdoms' | 'legends'", "activeTheme: 'modern' | 'three_kingdoms' | 'legends' | 'meme_comedy' | string")
s=s.replace("  const [modeHelpOpen, setModeHelpOpen] = useState(false)", "  const [modeHelpOpen, setModeHelpOpen] = useState(false)\n  const [themeBrief,setThemeBrief] = useState('沙雕但靠谱的互联网项目小队，说人话、有梗、能交付')\n  const [themeBusy,setThemeBusy] = useState(false)\n  const [themeDraft,setThemeDraft] = useState<AgentProfile[]>([])")
func=r'''
  const generateThemeDraft = async (apply=false) => {
    setManagementError('')
    setThemeBusy(true)
    try {
      const response = await fetch(`/dsh-group-chat/api/theme/${apply ? 'apply-draft' : 'draft'}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({roomId:room?.roomId||'dev-team-alpha', brief:themeBrief, members:themeDraft})})
      const result = await response.json()
      if(!response.ok||result.success===false)throw Error(result.error||result.message||'主题生成失败')
      if(apply){ setThemeDraft([]); await fetchRoomData() }
      else setThemeDraft(result.members || [])
    } catch(e){setManagementError(e instanceof Error?e.message:String(e))}
    finally { setThemeBusy(false) }
  }

'''
s=s.replace("  return (\n", func+"  return (\n",1)
s=s.replace('<option value="modern">现代精英</option><option value="three_kingdoms">三国风云</option><option value="legends">现代传奇</option>', '<option value="modern">现代精英</option><option value="three_kingdoms">三国风云</option><option value="legends">现代传奇</option><option value="meme_comedy">沙雕整活</option>')
insert=r'''
              <div style={{
                background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(77,107,254,0.10))',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(236,72,153,0.22)',
                display: 'grid',
                gap: '8px',
              }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--dsw-alias-label-primary,#f8fafc)'}}>AI 造主题角色</div>
                  <button type="button" onClick={()=>void updateRoom('theme',{theme:'meme_comedy'})} style={{fontSize:10,padding:'3px 8px',borderRadius:999,border:'1px solid rgba(255,255,255,0.14)',background:'var(--dsw-alias-bg-layer-2,#202025)',color:'var(--dsw-alias-label-primary,#fff)',cursor:'pointer'}}>套用沙雕整活</button>
                </div>
                <textarea value={themeBrief} onChange={e=>setThemeBrief(e.target.value)} placeholder="例如：赛博修仙创业公司、猫猫宇宙产品战队、东北烧烤摊式研发部……" style={{minHeight:54,resize:'vertical',borderRadius:9,border:'1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.12))',background:'var(--dsw-alias-bg-layer-1,#151518)',color:'var(--dsw-alias-label-primary,#f8fafc)',fontSize:11,lineHeight:1.45,padding:'8px'}} />
                <div style={{display:'flex',gap:8}}>
                  <button type="button" disabled={themeBusy} onClick={()=>void generateThemeDraft(false)} style={{flex:1,fontSize:11,padding:'6px 8px',borderRadius:9,border:'1px solid rgba(255,255,255,0.14)',background:'var(--dsw-alias-bg-layer-2,#202025)',color:'var(--dsw-alias-label-primary,#fff)',cursor:'pointer'}}>{themeBusy?'生成中…':'生成草案'}</button>
                  <button type="button" disabled={themeBusy} onClick={()=>void generateThemeDraft(true)} style={{flex:1,fontSize:11,padding:'6px 8px',borderRadius:9,border:'none',background:'var(--dsw-alias-state-business-primary,#4d6bfe)',color:'#fff',cursor:'pointer',fontWeight:700}}>生成并套用</button>
                </div>
                {themeDraft.length>0 && <div style={{display:'grid',gap:6}}>
                  <div style={{fontSize:10,color:'var(--dsw-alias-label-tertiary,#94a3b8)'}}>草案预览：可先套用，再用每个角色右侧「编辑」细调。</div>
                  {themeDraft.map(item=><div key={item.id} style={{display:'flex',alignItems:'center',gap:7,fontSize:11,color:'var(--dsw-alias-label-secondary,#cbd5e1)',minWidth:0}}><AvatarBadge avatar={item.avatar} className="gc-roster-avatar"/><span style={{fontWeight:700,color:'var(--dsw-alias-label-primary,#fff)'}}>{item.name}</span><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</span></div>)}
                  <button type="button" disabled={themeBusy} onClick={()=>void generateThemeDraft(true)} style={{fontSize:11,padding:'6px 8px',borderRadius:9,border:'none',background:'#10b981',color:'#fff',cursor:'pointer',fontWeight:700}}>套用这个草案</button>
                </div>}
              </div>

'''
s=s.replace("            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>\n              <div style={{\n                background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',", "            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>\n"+insert+"              <div style={{\n                background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',",1)
p.write_text(s,encoding='utf-8')

from pathlib import Path
p=Path('src/client/GroupChatSideDock.tsx');s=p.read_text(encoding='utf-8-sig')
old="""        <div style={{padding:'10px 14px',display:'grid',gap:8,fontSize:12}}>
          <label style={{display:'flex',justifyContent:'space-between',gap:8}}>角色主题
            <select aria-label="角色主题" value={room?.activeTheme||'modern'} onChange={e=>void updateRoom('theme',{theme:e.target.value})}>
              <option value="modern">现代精英</option><option value="three_kingdoms">三国风云</option><option value="legends">现代传奇</option>
            </select>
          </label>
          <label style={{display:'flex',justifyContent:'space-between',gap:8}}>调度模式
            <select aria-label="调度模式" value={room?.dispatchMode||'mention_only'} onChange={e=>void updateRoom('mode',{mode:e.target.value})}>
              <option value="mention_only">仅 @ 角色</option><option value="workflow_driven">工作流</option><option value="moderator_led">主持人调度</option><option value="free_discussion">自由讨论</option>
            </select>
          </label>
          {managementError&&<div role="alert">{managementError}</div>}
        </div>
"""
new="""        <div style={{padding:'10px 14px',display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:8,fontSize:11,alignItems:'end'}}>
          <label style={{display:'grid',gap:5,minWidth:0,color:'var(--dsw-alias-label-secondary, #cbd5e1)'}}>角色主题
            <span style={{position:'relative',display:'block'}}>
              <select aria-label="角色主题" value={room?.activeTheme||'modern'} onChange={e=>void updateRoom('theme',{theme:e.target.value})} style={{width:'100%',height:32,boxSizing:'border-box',appearance:'none',WebkitAppearance:'none',border:'1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.14))',borderRadius:10,background:'var(--dsw-alias-bg-layer-2, #202025)',color:'var(--dsw-alias-label-primary, #f8fafc)',font:'inherit',fontSize:12,padding:'0 30px 0 10px',outline:'none'}}>
                <option value="modern">现代精英</option><option value="three_kingdoms">三国风云</option><option value="legends">现代传奇</option>
              </select>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{position:'absolute',right:10,top:'50%',width:14,height:14,transform:'translateY(-50%)',pointerEvents:'none',color:'var(--dsw-alias-label-tertiary,#9ca3af)'}}><path d="M4 6l4 4 4-4"/></svg>
            </span>
          </label>
          <label style={{display:'grid',gap:5,minWidth:0,color:'var(--dsw-alias-label-secondary, #cbd5e1)'}}>调度模式
            <span style={{position:'relative',display:'block'}}>
              <select aria-label="调度模式" value={room?.dispatchMode||'mention_only'} onChange={e=>void updateRoom('mode',{mode:e.target.value})} style={{width:'100%',height:32,boxSizing:'border-box',appearance:'none',WebkitAppearance:'none',border:'1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.14))',borderRadius:10,background:'var(--dsw-alias-bg-layer-2, #202025)',color:'var(--dsw-alias-label-primary, #f8fafc)',font:'inherit',fontSize:12,padding:'0 30px 0 10px',outline:'none'}}>
                <option value="mention_only">仅 @ 角色</option><option value="workflow_driven">工作流</option><option value="moderator_led">主持人调度</option><option value="free_discussion">自由讨论</option>
              </select>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{position:'absolute',right:10,top:'50%',width:14,height:14,transform:'translateY(-50%)',pointerEvents:'none',color:'var(--dsw-alias-label-tertiary,#9ca3af)'}}><path d="M4 6l4 4 4-4"/></svg>
            </span>
          </label>
          {managementError&&<div role="alert" style={{gridColumn:'1 / -1',color:'#fca5a5'}}>{managementError}</div>}
        </div>
"""
if old not in s: raise SystemExit('block not found')
p.write_text(s.replace(old,new),encoding='utf-8')

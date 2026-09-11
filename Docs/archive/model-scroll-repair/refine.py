from pathlib import Path
p=Path('src/engine/model-settings.ts');s=p.read_text(encoding='utf-8-sig');s=s.replace('  if(!policy)return','  if(policy===undefined)return\n  if(!policy||typeof policy!==\'object\')throw Error(\'回退策略格式错误\')')
s=s.replace('  save(room:string',"  remember(model:ModelRef){\n    if(!model.provider||!model.model)return\n    const data={...this.data,recent:[model,...this.data.recent.filter(m=>m.provider!==model.provider||m.model!==model.model)].slice(0,20)}\n    mkdirSync(dirname(this.path),{recursive:true});writeFileSync(this.path+'.tmp',JSON.stringify(data,null,2));renameSync(this.path+'.tmp',this.path);this.data=data\n  }\n  save(room:string")
p.write_text(s,encoding='utf-8')
p=Path('src/index.ts');s=p.read_text(encoding='utf-8-sig');s=s.replace('      fallbackChain = execution.fallbackChain',"      fallbackChain = execution.fallbackChain\n      try{modelSettings.remember({provider:providerUsed,model:modelUsed})}catch(error){logger.warn?.('最近模型记录保存失败',error)}")
s=s.replace('resiliencePolicy:body.resiliencePolicy??existing.resiliencePolicy','resiliencePolicy:body.resiliencePolicy===undefined?existing.resiliencePolicy:body.resiliencePolicy');p.write_text(s,encoding='utf-8')
p=Path('src/client/GroupChatModelSettings.tsx');s=p.read_text(encoding='utf-8-sig').replace('最近保存的 20 项','最近保存或调用的 20 项');p.write_text(s,encoding='utf-8')
p=Path('src/client/GroupChatRoleEditor.tsx');s=p.read_text(encoding='utf-8');s=s.replace('useState,useRef','useState,useRef,useEffect')
s=s.replace('  const fileInputRef',"""  const dialogRef=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    return ()=>previous?.isConnected&&previous.focus()
  },[])
  const fileInputRef""")
s=s.replace('<div role="dialog"', '''<div ref={dialogRef} onKeyDown={e=>{
            if(e.key==='Escape'&&!saving){e.preventDefault();onClose()}
            if(e.key==='Tab'){
              const nodes=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea,select')).filter(el=>el.getClientRects().length)
              const first=nodes[0],last=nodes[nodes.length-1]
              if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
              if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
            }
          }} role="dialog"''')
# fixed flex children stay full size while modal scrolls
s=s.replace('  return <><input','  return <><style>{`[aria-label="编辑特遣角色属性"]>div,[aria-label="编辑特遣角色属性"]>section{flex-shrink:0;}`}</style><input')
p.write_text(s,encoding='utf-8')

from pathlib import Path
p=Path('src/engine/model-settings.ts');s=p.read_text(encoding='utf-8-sig')
s=s.replace('  remember(model:ModelRef){', """  forget(model:ModelRef){
    if(!model.provider||!model.model)return
    const data={...this.data,recent:this.data.recent.filter(m=>m.provider!==model.provider||m.model!==model.model)}
    mkdirSync(dirname(this.path),{recursive:true});writeFileSync(this.path+'.tmp',JSON.stringify(data,null,2));renameSync(this.path+'.tmp',this.path);this.data=data
  }
  remember(model:ModelRef){""")
p.write_text(s,encoding='utf-8')
p=Path('src/index.ts');s=p.read_text(encoding='utf-8-sig')
needle="""        if(method==='GET' && pathname==='/models'){
          const groups=await Promise.all(ctx.llm.listProviders().map(async provider=>{
            try{return {...provider,models:await ctx.llm.listModels(provider.id)}}
            catch{return {...provider,models:[],error:'模型目录加载失败，可手动输入 ID'}}
          }))
          res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'})
          res.end(JSON.stringify({groups,recent:modelSettings.recent(),current:ctx.agentDefaultModel.currentSelection()}));return
        }

"""
insert=needle+"""        if(method==='POST' && pathname==='/models/recent/delete'){
          const body=await readJsonBody(req)
          const provider=String(body.provider||'').trim()
          const model=String(body.model||'').trim()
          if(!provider||!model){res.writeHead(400,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({success:false,error:'provider and model are required'}));return}
          modelSettings.forget({provider,model})
          res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'})
          res.end(JSON.stringify({success:true,recent:modelSettings.recent()}));return
        }

"""
s=s.replace(needle,insert)
p.write_text(s,encoding='utf-8')

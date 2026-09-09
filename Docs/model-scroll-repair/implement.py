from pathlib import Path
p=Path('src/index.ts');s=p.read_text(encoding='utf-8-sig');s="import {homedir} from 'node:os'\nimport {join} from 'node:path'\nimport {ModelSettingsStore, validateModels} from './engine/model-settings.js'\n"+s
s=s.replace("'agentDefaultModel']","'agentDefaultModel', 'llm']")
s=s.replace('  webServer: any','  llm: {listProviders(): {id:string;name:string}[]; listModels(provider:string): Promise<{id:string;name:string}[]>}\n  webServer: any')
s=s.replace('  const toolBus =',"  const modelSettings = new ModelSettingsStore(join(homedir(), '.dsh', 'dsh-group-chat', 'model-settings.json'))\n  for(const room of roomManager.getAllRooms())for(const member of room.members){\n    const saved=modelSettings.get(room.roomId,member.id)\n    if(saved)roomManager.updateAgentProfile(room.roomId,member.id,saved)\n  }\n  const toolBus =")
pos="        // 1. 获取所有房间"
s=s.replace(pos,"""        if(method==='GET' && pathname==='/models'){
          const groups=await Promise.all(ctx.llm.listProviders().map(async provider=>{
            try{return {...provider,models:await ctx.llm.listModels(provider.id)}}
            catch{return {...provider,models:[],error:'模型目录加载失败，可手动输入 ID'}}
          }))
          res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'})
          res.end(JSON.stringify({groups,recent:modelSettings.recent(),current:ctx.agentDefaultModel.currentSelection()}));return
        }

"""+pos)
s=s.replace('          const updated = roomManager.updateAgentProfile(roomId, agentId, {',"""          const existing=roomManager.getRoom(roomId)?.members.find(m=>m.id===agentId)
          if(existing){
            try{
              const models={llmConfig:{...existing.llmConfig,...body.llmConfig},resiliencePolicy:body.resiliencePolicy??existing.resiliencePolicy}
              validateModels(models.llmConfig,models.resiliencePolicy)
              modelSettings.save(roomId,agentId,models)
            }catch(error){
              res.writeHead(400,{'Content-Type':'application/json; charset=utf-8'})
              res.end(JSON.stringify({error:error instanceof Error?error.message:String(error)}));return
            }
          }
          const updated = roomManager.updateAgentProfile(roomId, agentId, {""")
s=s.replace('              llmConfig: body.llmConfig,','              llmConfig: body.llmConfig,\n              resiliencePolicy: body.resiliencePolicy,')
p.write_text(s,encoding='utf-8')
p=Path('src/engine/room-manager.ts');s=p.read_text(encoding='utf-8');s=s.replace("'llmConfig' | 'permissions'>>","'llmConfig' | 'permissions' | 'resiliencePolicy'>>");s=s.replace('      this.saveRoom(room)', '      this.saveRoom(room)')
s=s.replace('    if (updates.permissions !== undefined)', '    if (updates.resiliencePolicy !== undefined) member.resiliencePolicy = structuredClone(updates.resiliencePolicy)\n    if (updates.permissions !== undefined)');p.write_text(s,encoding='utf-8')
p=Path('src/client/group-chat-view-types.ts');s=p.read_text(encoding='utf-8');s=s.replace('export interface AgentProfile {',"export interface AgentProfile {\n  resiliencePolicy?: {fallbackModels:{provider:string;model:string}[];maxRetriesPerModel:number;retryBackoffMs:number;timeoutMs:number}");p.write_text(s,encoding='utf-8')

import assert from 'node:assert/strict'
const base='http://127.0.0.1:3080/dsh-group-chat/api'
const get=path=>fetch(base+path).then(r=>r.json())
const before=(await get('/room')).room.members.find(m=>m.id==='backend')
const policy={fallbackModels:[{provider:'win',model:'gpt-5.3-codex-spark'}],maxRetriesPerModel:0,retryBackoffMs:1000,timeoutMs:30000}
const update=body=>fetch(base+'/agent/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomId:'dev-team-alpha',agentId:'backend',...body})})
try{
 let r=await update({llmConfig:{provider:'cpa',model:'gemini-3.8-flash-high'},resiliencePolicy:policy});assert.equal(r.status,200);assert.deepEqual((await r.json()).agent.resiliencePolicy,policy)
 const role=(await get('/room')).room.members.find(m=>m.id==='backend');assert.deepEqual(role.resiliencePolicy,policy)
 const catalog=await get('/models');assert(catalog.recent.some(m=>m.model==='gemini-3.8-flash-high'));assert(catalog.groups.length)
 r=await update({resiliencePolicy:{...policy,timeoutMs:-1}});assert.equal(r.status,400)
 console.log('PASS live API save/read fallback, recent IDs, registered catalog, invalid timeout rejected')
}finally{
 const r=await update({llmConfig:before.llmConfig,resiliencePolicy:before.resiliencePolicy||{fallbackModels:[],maxRetriesPerModel:2,retryBackoffMs:1000,timeoutMs:30000}});assert.equal(r.status,200)
 console.log('RESTORED backend original model and equivalent original fallback behavior')
}

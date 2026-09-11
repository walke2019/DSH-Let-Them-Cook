import assert from 'node:assert/strict'
const base='http://127.0.0.1:3080/dsh-group-chat/api'
const get=path=>fetch(base+path).then(r=>r.json())
const before=(await get('/room')).room.members.find(m=>m.id==='backend')
const temp={provider:'tmp-provider-delete',model:'tmp-model-delete'}
const policy=before.resiliencePolicy||{fallbackModels:[],maxRetriesPerModel:2,retryBackoffMs:1000,timeoutMs:30000}
const update=body=>fetch(base+'/agent/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomId:'dev-team-alpha',agentId:'backend',...body})})
try{
 let r=await update({llmConfig:{...before.llmConfig,...temp},resiliencePolicy:policy});assert.equal(r.status,200)
 let catalog=await get('/models');assert(catalog.recent.some(m=>m.provider===temp.provider&&m.model===temp.model))
 r=await fetch(base+'/models/recent/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(temp)});assert.equal(r.status,200)
 let data=await r.json();assert.equal(data.success,true);assert(!data.recent.some(m=>m.provider===temp.provider&&m.model===temp.model))
 catalog=await get('/models');assert(!catalog.recent.some(m=>m.provider===temp.provider&&m.model===temp.model))
 console.log('PASS live API recent delete: temp recent removed and persisted')
}finally{
 const r=await update({llmConfig:before.llmConfig,resiliencePolicy:before.resiliencePolicy||{fallbackModels:[],maxRetriesPerModel:2,retryBackoffMs:1000,timeoutMs:30000}});assert.equal(r.status,200)
 console.log('RESTORED backend role model after recent-delete test')
}

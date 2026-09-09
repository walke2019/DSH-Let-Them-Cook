const base='http://127.0.0.1:3080/dsh-group-chat/api';
const models=Array.from({length:8},(_,i)=>({provider:'tmp-six',model:'m'+i}));
async function post(path,body){return fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(async r=>({status:r.status,data:await r.json()}))}
const room=await fetch(base+'/room').then(r=>r.json());
const before=room.room.members.find(m=>m.id==='backend');
try{
 for(const m of models){const r=await post('/agent/update',{roomId:'dev-team-alpha',agentId:'backend',llmConfig:m,resiliencePolicy:before.resiliencePolicy||{fallbackModels:[],maxRetriesPerModel:2,retryBackoffMs:1000,timeoutMs:30000}});if(r.status!==200)throw Error(JSON.stringify(r))}
 let catalog=await fetch(base+'/models').then(r=>r.json());
 const tmp=catalog.recent.filter(m=>m.provider==='tmp-six').map(m=>m.model);
 if(tmp.length!==6||tmp[0]!=='m7'||tmp.includes('m0')||tmp.includes('m1'))throw Error('bad max six '+JSON.stringify(tmp));
 const del=await post('/models/recent/delete',{provider:'tmp-six',model:'m5'});if(del.status!==200||del.data.recent.some(m=>m.provider==='tmp-six'&&m.model==='m5'))throw Error('delete failed')
 catalog=await fetch(base+'/models').then(r=>r.json());
 if(catalog.recent.some(m=>m.provider==='tmp-six'&&m.model==='m5'))throw Error('delete not persisted')
 console.log('PASS live recents: max 6, oldest trimmed, single delete persisted')
}finally{
 const r=await post('/agent/update',{roomId:'dev-team-alpha',agentId:'backend',llmConfig:before.llmConfig,resiliencePolicy:before.resiliencePolicy||{fallbackModels:[],maxRetriesPerModel:2,retryBackoffMs:1000,timeoutMs:30000}});console.log('RESTORED backend role model',r.status)
 for(const m of models)await post('/models/recent/delete',m).catch(()=>{})
}

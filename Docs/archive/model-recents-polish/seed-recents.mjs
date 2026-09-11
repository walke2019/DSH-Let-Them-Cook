const base='http://127.0.0.1:3080/dsh-group-chat/api';
async function post(path,body){return fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(async r=>({status:r.status,data:await r.json()}))}
const room=await fetch(base+'/room').then(r=>r.json());
const before=room.room.members.find(m=>m.id==='backend');
try{
 const policy={fallbackModels:[{provider:'win',model:'gpt-5.3-codex-spark'}],maxRetriesPerModel:2,retryBackoffMs:1000,timeoutMs:30000}
 let r=await post('/agent/update',{roomId:'dev-team-alpha',agentId:'backend',llmConfig:{provider:'cpa',model:'gemini-3.8-flash-high'},resiliencePolicy:policy});if(r.status!==200)throw Error('seed failed')
 console.log('SEEDED real recent models: cpa/gemini-3.8-flash-high and win/gpt-5.3-codex-spark')
}finally{
 const r=await post('/agent/update',{roomId:'dev-team-alpha',agentId:'backend',llmConfig:before.llmConfig,resiliencePolicy:before.resiliencePolicy||{fallbackModels:[],maxRetriesPerModel:2,retryBackoffMs:1000,timeoutMs:30000}});console.log('RESTORED backend role model',r.status)
}

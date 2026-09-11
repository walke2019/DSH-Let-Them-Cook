
const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname, '..');
const types=fs.readFileSync(path.join(root,'src/types.ts'),'utf8');const room=fs.readFileSync(path.join(root,'src/engine/room-manager.ts'),'utf8');const api=fs.readFileSync(path.join(root,'src/index.ts'),'utf8');
const errors=[];
for(const m of ["'blocked' | 'cancelled'",'interface CoordinationEvent','coordinationEvents?: CoordinationEvent[]','recordCoordinationEvent','applyCoordinationToProtocol','/coordination/event']) if(!(types+'\n'+room+'\n'+api).includes(m)) errors.push(`missing durable resume marker ${m}`);
if(!room.includes("type: 'resume'")&&!types.includes("'resume'")) errors.push('resume event type missing');
if(errors.length){console.error(JSON.stringify({P66_DURABLE_SUBAGENT_RESUME_EXIT:1,errors},null,2));process.exit(1)}
console.log(JSON.stringify({P66_DURABLE_SUBAGENT_RESUME_EXIT:0,coordinationEvents:true},null,2));

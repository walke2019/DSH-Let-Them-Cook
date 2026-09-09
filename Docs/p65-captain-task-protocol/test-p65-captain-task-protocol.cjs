
const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'../..');
const types=fs.readFileSync(path.join(root,'src/types.ts'),'utf8');const room=fs.readFileSync(path.join(root,'src/engine/room-manager.ts'),'utf8');const index=fs.readFileSync(path.join(root,'src/index.ts'),'utf8');
const errors=[];
for(const m of ['interface CaptainTaskProtocol','interface CaptainTaskNode','captainTaskProtocol?: CaptainTaskProtocol']) if(!types.includes(m)) errors.push(`missing type ${m}`);
for(const m of ['createCaptainTaskProtocol','commanderRoleId','dependencies','createCaptainTaskProtocol(roomId, envelope.messageId, content, taskTier)']) if(!(room+'\n'+index).includes(m)) errors.push(`missing protocol marker ${m}`);
if(errors.length){console.error(JSON.stringify({P65_CAPTAIN_TASK_PROTOCOL_EXIT:1,errors},null,2));process.exit(1)}
console.log(JSON.stringify({P65_CAPTAIN_TASK_PROTOCOL_EXIT:0,protocol:true},null,2));

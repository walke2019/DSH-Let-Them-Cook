
const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname, '..');
const tools=fs.readFileSync(path.join(root,'src/tools/index.ts'),'utf8');const room=fs.readFileSync(path.join(root,'src/engine/room-manager.ts'),'utf8');
const errors=[];
for(const name of ['group_chat_task_claim','group_chat_task_block','group_chat_task_handoff','group_chat_task_report','group_chat_task_close']) if(!tools.includes(`name: '${name}'`)) errors.push(`missing tool ${name}`);
if(!tools.includes('addMailboxMessage')||!tools.includes('onTriggerAgentTurn')) errors.push('report/handoff tool must wire mailbox and trigger');
if(!room.includes('group_chat_task_claim')||!room.includes('group_chat_task_report')) errors.push('role allowedTools must include coordination tools');
if(errors.length){console.error(JSON.stringify({P68_TEAM_COORDINATION_TOOLS_EXIT:1,errors},null,2));process.exit(1)}
console.log(JSON.stringify({P68_TEAM_COORDINATION_TOOLS_EXIT:0,tools:5},null,2));

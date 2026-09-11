
const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname, '..');
const panel=fs.readFileSync(path.join(root,'src/client/GroupChatHudWorkflowPanel.tsx'),'utf8');const todo=fs.readFileSync(path.join(root,'docs/TODO.md'),'utf8');
const errors=[];
for(const m of ['data-dsh-gc-director-card','data-dsh-gc-loop-quality','data-dsh-gc-captain-protocol','Captain plan','Approve & Run']) if(!panel.includes(m)) errors.push(`missing cockpit marker ${m}`);
for(const p of ['P65','P66','P67','P68','P69']) if(!todo.includes(p)) errors.push(`TODO missing ${p}`);
if(errors.length){console.error(JSON.stringify({P69_TASK_COCKPIT_PRODUCTIZATION_EXIT:1,errors},null,2));process.exit(1)}
console.log(JSON.stringify({P69_TASK_COCKPIT_PRODUCTIZATION_EXIT:0,cockpit:true},null,2));

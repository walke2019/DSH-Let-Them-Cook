
const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname, '..');
const files=['src/types.ts','src/engine/room-manager.ts','src/index.ts','src/client/GroupChatHudWorkflowPanel.tsx','src/tools/index.ts'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
const errors=[];
for(const m of ['interface ApprovalTransaction','willChange','rollbackPlan','createApprovalTransaction','resolveApprovalTransaction','/transaction/create','/transaction/action','data-dsh-gc-approval-transactions','group_chat_transaction_create','group_chat_transaction_action']) if(!files.includes(m)) errors.push(`missing transaction marker ${m}`);
if(errors.length){console.error(JSON.stringify({P67_APPROVE_RUN_TRANSACTION_CARD_EXIT:1,errors},null,2));process.exit(1)}
console.log(JSON.stringify({P67_APPROVE_RUN_TRANSACTION_CARD_EXIT:0,transactions:true},null,2));

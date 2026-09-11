const fs = require('fs');
const path = require('path');
const root = process.cwd();
function read(p){ return fs.readFileSync(path.join(root,p),'utf8'); }
function assert(cond,msg){ if(!cond){ console.error('FAIL '+msg); process.exitCode=1; } else { console.log('PASS '+msg); } }
const dock = read('src/client/GroupChatSideDock.tsx');
const workflowPanel = read('src/client/GroupChatHudWorkflowPanel.tsx');
const rosterPanel = read('src/client/GroupChatHudRosterPanel.tsx');
const hudTypes = read('src/client/group-chat-hud-types.ts');
const hudSurface = dock + '\n' + workflowPanel + '\n' + rosterPanel + '\n' + hudTypes;
assert(hudSurface.includes('interface WorkflowTask'), 'HUD defines WorkflowTask type');
assert(hudSurface.includes('interface AssignmentEnvelope'), 'HUD defines AssignmentEnvelope type');
assert(hudSurface.includes('interface AgentMailboxMessage'), 'HUD defines AgentMailboxMessage type');
assert(dock.includes('assignment:updated') && dock.includes('mailbox:new'), 'HUD refreshes on assignment and mailbox events');
assert(hudSurface.includes('执行中') && hudSurface.includes('待处理') && hudSurface.includes('邮箱'), 'HUD shows execution counters');
assert(workflowPanel.includes('st.tasks.map'), 'HUD renders stage tasks');
assert(workflowPanel.includes('verify: {task.verifyCommand}'), 'HUD renders verifyCommand');
assert(workflowPanel.includes('task.qualityContract'), 'HUD renders quality contract');
assert(workflowPanel.includes('最近任务分派') && workflowPanel.includes('Recent assignments') && workflowPanel.includes('/ Assignment'), 'HUD renders assignment foldout');
assert(workflowPanel.includes('主 Agent 邮箱') && workflowPanel.includes('Master Agent mailbox') && workflowPanel.includes('/ Mailbox'), 'HUD renders mailbox foldout');
if(process.exitCode){ process.exit(process.exitCode); }
console.log('P5_HUD_DAG_ASSIGNMENT_MAILBOX_TEST_EXIT:0');



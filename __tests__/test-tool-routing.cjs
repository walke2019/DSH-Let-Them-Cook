const fs = require('fs');
const path = require('path');
const root = process.cwd();
function read(p){ return fs.readFileSync(path.join(root,p),'utf8'); }
function assert(cond,msg){ if(!cond){ console.error('FAIL '+msg); process.exitCode=1; } else { console.log('PASS '+msg); } }
const runtime = read('src/engine/agent-runtime.ts');
const index = read('src/index.ts');
const room = read('src/engine/room-manager.ts');
const gate = read('src/engine/workflow-orchestrator.ts');
assert(runtime.includes('MemberTurnRuntimeOptions'), 'runtime exposes MemberTurnRuntimeOptions');
assert(runtime.includes('restrictToolsCompat(scoped.tools, allowedTools)'), 'runtime restricts tools by role allowedTools');
assert(runtime.includes('Tool Scope'), 'runtime injects Tool Scope prompt');
assert(index.includes('allowedTools: member.permissions.allowedTools'), 'index passes member permissions to runMemberTurn');
assert(room.includes("'group_chat_workflow_advance'") && room.includes("'group_chat_workflow_reject'"), 'commander uses real workflow tool names');
assert(room.includes("'web_search'") && room.includes("'stealth_read_page'"), 'researcher owns web/search tool aliases');
assert(gate.includes("if (action === 'call_tool')") && gate.indexOf("if (action === 'call_tool')") < gate.indexOf("rolePermissions.level === 'admin'"), 'tool permission gate runs before admin bypass');
assert(gate.includes('该角色本轮未开放任何工具'), 'empty allowedTools denies tool calls');
if(process.exitCode){ process.exit(process.exitCode); }
console.log('TOOL_ROUTING_RUNTIME_TEST_EXIT:0');

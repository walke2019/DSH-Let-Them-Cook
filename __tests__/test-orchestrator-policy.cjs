const assert = require('assert');
const fs = require('fs');
const base = 'http://127.0.0.1:3080/dsh-group-chat/api';
async function post(path, body){ const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); const data=await r.json(); return {status:r.status,data}; }
async function room(){ const r=await fetch(base+'/room?id=dev-team-alpha'); return r.json(); }
(async()=>{
  const before = await room();
  fs.writeFileSync('docs/tasks/phases/orchestrator-policy-skill-sync/live-before.json', JSON.stringify(before, null, 2));
  assert.equal(before.room.orchestration.strategy, 'master_subagents');
  assert.equal(before.room.orchestration.masterAgentId, 'commander');
  assert.equal(before.room.orchestration.toolRoutingPolicy.webSearchOwner, 'researcher');
  assert.equal(before.room.orchestration.toolRoutingPolicy.allowStageParallelism, true);
  console.log('PASS room exposes master/subagent orchestration and tool routing');

  const draft = await post('/message', {roomId:'dev-team-alpha', content:'请自动创建角色和工作流：做一个浏览器插件项目，需要搜索竞品、爬取资料、写前端界面、后端状态机、QA验收和用户文档。'});
  assert.equal(draft.status, 200);
  assert.equal(draft.data.systemMessage.metadata.autoSetup, 'draft');
  assert.ok(draft.data.systemMessage.content.includes('阶段并发'));
  assert.ok(draft.data.systemMessage.content.includes('工具归口'));
  assert.equal(draft.data.draft.orchestration.toolRoutingPolicy.webSearchOwner, 'researcher');
  assert.equal(draft.data.draft.orchestration.modelHints.backend.requiredCapabilities.includes('coding'), true);
  console.log('PASS middle conversation draft shows parallelism, routing, model hints');

  const cancel = await post('/message', {roomId:'dev-team-alpha', content:'取消创建'});
  assert.equal(cancel.status, 200);
  assert.equal(cancel.data.systemMessage.metadata.autoSetup, 'cancelled');
  const after = await room();
  fs.writeFileSync('docs/tasks/phases/orchestrator-policy-skill-sync/live-after.json', JSON.stringify(after, null, 2));
  assert.ok(!after.room.pendingAutoSetup);
  console.log('PASS pending draft can be cancelled without writing');

  const docs = [
    'AGENTS.md', 'README.md', 'docs/architecture/orchestrator-skill-and-policy.md',
    'docs/architecture/dispatch-engine.md', 'docs/architecture/workflow-and-role-personas.md', 'docs/architecture/standards-and-extensibility.md',
    'src/skills/dsh-group-chat-orchestrator/SKILL.md',
  ];
  for (const file of docs) assert.ok(fs.existsSync(file), file);
  assert.ok(fs.readFileSync('AGENTS.md','utf8').includes('工具专员归口'));
  assert.ok(fs.readFileSync('docs/architecture/orchestrator-skill-and-policy.md','utf8').includes('DSH workflow 并发保留'));
  assert.ok(fs.readFileSync('src/skills/dsh-group-chat-orchestrator/SKILL.md','utf8').includes('not a Codex assistant skill') || fs.readFileSync('src/skills/dsh-group-chat-orchestrator/SKILL.md','utf8').includes('不是 Codex'));
  console.log('PASS docs and AGENTS synced');
})().catch(e=>{console.error(e); process.exit(1);});

const assert = require('assert');
const base = 'http://127.0.0.1:3080/dsh-group-chat/api';
async function request(path, body) {
  const r = await fetch(base + path, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = {text}; }
  return {status:r.status, data};
}
async function getRoom() {
  const r = await fetch(base + '/room?id=dev-team-alpha');
  return r.json();
}
(async () => {
  const before = await getRoom();
  require('fs').writeFileSync('Docs/auto-setup-confirmation/live-before.json', JSON.stringify(before, null, 2));
  const vague = await request('/message', {roomId:'dev-team-alpha', content:'帮我创建角色和工作流'});
  assert.equal(vague.status, 200);
  assert.equal(vague.data.systemMessage.metadata.autoSetup, 'clarify');
  console.log('PASS vague setup asks clarification');

  const draftReq = await request('/message', {roomId:'dev-team-alpha', content:'请根据这个工作区自动创建角色和工作流：继续开发 dsh-group-chat 插件，重点处理 UI 体验、模型选择、工作流调度和测试验收。'});
  assert.equal(draftReq.status, 200);
  assert.equal(draftReq.data.systemMessage.metadata.autoSetup, 'draft');
  assert.ok(draftReq.data.draft.members.length >= 6);
  assert.ok(draftReq.data.draft.workflow.stages.length >= 5);
  assert.equal(draftReq.data.draft.orchestration.masterAgentId, 'commander');
  console.log('PASS auto setup creates pending draft with master/subagents');

  let mid = await getRoom();
  assert.ok(mid.room.pendingAutoSetup);
  assert.equal(mid.room.pendingAutoSetup.orchestration.masterAgentId, 'commander');
  console.log('PASS pending draft stored but not applied');

  const confirm = await request('/message', {roomId:'dev-team-alpha', content:'确认创建'});
  assert.equal(confirm.status, 200);
  assert.equal(confirm.data.systemMessage.metadata.autoSetup, 'applied');
  console.log('PASS confirm applies draft');

  const after = await getRoom();
  require('fs').writeFileSync('Docs/auto-setup-confirmation/live-after.json', JSON.stringify(after, null, 2));
  assert.equal(after.room.dispatchMode, 'workflow_driven');
  assert.ok(!after.room.pendingAutoSetup);
  assert.equal(after.room.orchestration.strategy, 'master_subagents');
  assert.equal(after.room.orchestration.masterAgentId, 'commander');
  assert.ok(after.messages.some(m => m.sender.id === 'auto-setup' && m.metadata.autoSetup === 'draft'));
  assert.ok(after.messages.some(m => m.sender.id === 'auto-setup' && m.metadata.autoSetup === 'applied'));
  console.log('PASS central conversation shows draft and applied messages');

  await request('/theme', {roomId:'dev-team-alpha', theme:'meme_comedy'});
  await request('/mode', {roomId:'dev-team-alpha', mode:'workflow_driven'});
  console.log('PASS restored visible theme/mode to meme workflow');
})().catch(e => { console.error(e); process.exit(1); });

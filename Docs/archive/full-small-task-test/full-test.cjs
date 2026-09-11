const fs = require('fs');
const path = require('path');
const base='http://127.0.0.1:3080/dsh-group-chat/api';
const outDir=path.resolve('docs/full-small-task-test');
const results=[];
async function api(method, url, body){
  const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  const text=await r.text(); let json; try{json=JSON.parse(text)}catch{json={raw:text.slice(0,300)}}
  results.push({name:`${method} ${url}`, ok:r.ok, status:r.status, sample:JSON.stringify(json).slice(0,500)});
  if(!r.ok) throw new Error(`${method} ${url} ${r.status} ${text}`);
  return json;
}
async function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
(async()=>{
  const before=await api('GET','/room?id=dev-team-alpha');
  fs.writeFileSync(path.join(outDir,'live-room-before.json'), JSON.stringify(before,null,2));
  const models=await api('GET','/models');
  const defaultModel=models.current||{};
  results.push({name:'model directory', ok:Array.isArray(models.groups), providers:models.groups?.length||0, recent:models.recent?.length||0, scope:models.scope});

  const draft=await api('POST','/theme/draft',{roomId:'dev-team-alpha',brief:'番茄钟小组件：优化开始按钮文案，用户要一眼懂、别装腔'});
  results.push({name:'draft includes roles+workflow', ok:Array.isArray(draft.members)&&draft.members.length===6&&draft.workflow?.stages?.length===5, firstRole:draft.members?.[0]?.name, workflow:draft.workflow?.title});

  const apply=await api('POST','/theme/apply-draft',{roomId:'dev-team-alpha',brief:'番茄钟小组件：优化开始按钮文案，用户要一眼懂、别装腔'});
  results.push({name:'apply draft updates workflow', ok:apply.room?.activeTheme?.startsWith('custom_')&&apply.room?.workflow?.stages?.[0]?.status==='in_progress', theme:apply.room?.activeTheme, stage:apply.room?.workflow?.stages?.[0]?.name});

  const genshin=await api('POST','/theme',{roomId:'dev-team-alpha',theme:'genshin'});
  results.push({name:'genshin theme', ok:genshin.room?.members?.[0]?.name?.includes('琴'), first:genshin.room?.members?.[0]?.name});
  const meme=await api('POST','/theme',{roomId:'dev-team-alpha',theme:'meme_comedy'});
  results.push({name:'meme theme default option', ok:meme.room?.activeTheme==='meme_comedy'&&meme.room?.members?.[0]?.name==='离谱总导演', first:meme.room?.members?.[0]?.name});

  for(const mode of ['mention_only','workflow_driven','moderator_led','free_discussion']){
    const m=await api('POST','/mode',{roomId:'dev-team-alpha',mode});
    results.push({name:`mode ${mode}`, ok:m.room?.dispatchMode===mode});
  }

  const roomForEdit=(await api('GET','/room?id=dev-team-alpha')).room;
  const writer=roomForEdit.members.find(m=>m.id==='writer');
  const tmpTitle='小任务测试临时文案官';
  const edited=await api('POST','/agent/update',{roomId:'dev-team-alpha',agentId:'writer',name:writer.name,avatar:writer.avatar,title:tmpTitle,roleDescription:writer.roleDescription,systemPrompt:writer.systemPrompt,llmConfig:writer.llmConfig,resiliencePolicy:writer.resiliencePolicy,permissions:writer.permissions});
  results.push({name:'role edit temporary', ok:edited.agent?.title===tmpTitle});
  const restored=await api('POST','/agent/update',{roomId:'dev-team-alpha',agentId:'writer',name:writer.name,avatar:writer.avatar,title:writer.title,roleDescription:writer.roleDescription,systemPrompt:writer.systemPrompt,llmConfig:writer.llmConfig,resiliencePolicy:writer.resiliencePolicy,permissions:writer.permissions});
  results.push({name:'role edit restore', ok:restored.agent?.title===writer.title});

  const badRecent=await api('POST','/models/recent/delete',{provider:'__full_test__',model:'__no_such_model__'});
  results.push({name:'recent delete harmless', ok:badRecent.success===true&&Array.isArray(badRecent.recent)});

  const rejected=await api('POST','/workflow/action',{roomId:'dev-team-alpha',action:'reject',reason:'完整测试：故意驳回验证工作流接口'});
  results.push({name:'workflow reject endpoint', ok:rejected.success===true||typeof rejected.message==='string', message:rejected.message});

  await api('POST','/mode',{roomId:'dev-team-alpha',mode:'mention_only'});
  const beforeMsg=(await api('GET','/room?id=dev-team-alpha')).messages.length;
  const send=await api('POST','/message',{roomId:'dev-team-alpha',content:'@writer 小任务完整测试：给番茄钟开始按钮写一句 12 字以内的人话文案，只输出一句。'});
  results.push({name:'message dispatch mention_only', ok:send.success===true&&send.decision?.nextSpeakerIds?.includes('writer'), decision:send.decision});
  let finalRoom=null;
  for(let i=0;i<90;i++){
    await sleep(1000);
    const r=await api('GET','/room?id=dev-team-alpha');
    const agentMsgs=(r.messages||[]).filter(m=>m.sender?.kind==='agent' && m.sender?.id==='writer' && m.timestamp>=send.message.timestamp);
    const errors=(r.messages||[]).filter(m=>m.metadata?.systemNotice==='model-error' && m.timestamp>=send.message.timestamp);
    if(agentMsgs.length||errors.length){ finalRoom=r; results.push({name:'agent turn result', ok:agentMsgs.length>0, agentReply:agentMsgs[0]?.content, error:errors[0]?.content}); break; }
  }
  if(!finalRoom){ finalRoom=await api('GET','/room?id=dev-team-alpha'); results.push({name:'agent turn result', ok:false, error:'timeout waiting writer reply'}); }
  results.push({name:'ledger after one task', ok:!!finalRoom.ledger?.metrics && typeof finalRoom.ledger.metrics.stepCount==='number', ledger:finalRoom.ledger});

  await api('POST','/theme',{roomId:'dev-team-alpha',theme:'meme_comedy'});
  await api('POST','/mode',{roomId:'dev-team-alpha',mode:'workflow_driven'});
  const after=await api('GET','/room?id=dev-team-alpha');
  fs.writeFileSync(path.join(outDir,'live-room-after.json'), JSON.stringify(after,null,2));
  fs.writeFileSync(path.join(outDir,'full-test-results.json'), JSON.stringify(results,null,2));
  const summary=results.map(r=>`${r.ok?'PASS':'FAIL'} ${r.name}${r.agentReply?' -> '+r.agentReply:''}${r.error?' -> '+r.error:''}`).join('\n');
  fs.writeFileSync(path.join(outDir,'FULL_TEST_REPORT.md'), `# DSH group-chat full small task test\n\nTask: 番茄钟按钮文案小任务\n\n\`\`\`\n${summary}\n\`\`\`\n`, 'utf8');
  console.log(summary);
  if(results.some(r=>!r.ok && r.name!=='agent turn result')) process.exit(1);
})();

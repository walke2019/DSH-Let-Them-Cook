const assert = require('assert');
const fs = require('fs');
const base = 'http://127.0.0.1:3080/dsh-group-chat/api';
async function post(path, body){ const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); const data=await r.json(); return {status:r.status,data}; }
async function room(){ const r=await fetch(base+'/room?id=dev-team-alpha'); return r.json(); }
(async()=>{
  let a=await post('/theme',{roomId:'dev-team-alpha',theme:'genshin'}); assert.equal(a.status,200); assert.equal(a.data.room.activeTheme,'genshin');
  let b=await post('/theme',{roomId:'dev-team-alpha',theme:'default'}); assert.equal(b.status,200); assert.equal(b.data.room.activeTheme,'meme_comedy'); console.log('PASS theme default maps to meme_comedy');
  let c=await post('/mode',{roomId:'dev-team-alpha',mode:'mention_only'}); assert.equal(c.status,200); assert.equal(c.data.room.dispatchMode,'mention_only');
  let d=await post('/mode',{roomId:'dev-team-alpha',mode:'default'}); assert.equal(d.status,200); assert.equal(d.data.room.dispatchMode,'workflow_driven'); console.log('PASS mode default maps to workflow_driven');
  const current=await room();
  assert.equal(current.room.activeTheme,'meme_comedy');
  assert.equal(current.room.dispatchMode,'workflow_driven');
  fs.writeFileSync('docs/tasks/phases/default-theme-mode-option/default-api-result.json', JSON.stringify(current, null, 2));
  console.log('PASS current room restored to default visible values');
})().catch(e=>{console.error(e); process.exit(1);});

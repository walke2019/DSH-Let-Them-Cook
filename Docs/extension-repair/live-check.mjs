import {writeFile} from 'node:fs/promises'
const base='http://127.0.0.1:3080/dsh-group-chat/api'
const post=async(p,b)=>(await fetch(base+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)})).json()
const original=await (await fetch(base+'/room')).json()
try{
 await post('/mode',{mode:'mention_only'})
 const sent=await post('/message',{content:'@backend 这是扩展连接回归测试，请仅回复 GROUP_CHAT_RUNTIME_OK，不调用工具。'})
 if(!sent.success)throw Error(JSON.stringify(sent))
 const deadline=Date.now()+110000
 while(Date.now()<deadline){
  await new Promise(r=>setTimeout(r,2000))
  const room=await (await fetch(base+'/room')).json()
  const message=room.messages.find(m=>m.timestamp>=sent.message.timestamp&&m.sender.kind!=='user')
  if(!message)continue
  await writeFile('Docs/extension-repair/live-success.json',JSON.stringify({input:sent.message,output:message},null,2))
  if(message.sender.kind!=='agent'||message.content.trim()!=='GROUP_CHAT_RUNTIME_OK')throw Error(JSON.stringify(message))
  console.log('PASS: live group-chat reply GROUP_CHAT_RUNTIME_OK; provider='+message.metadata.providerUsed+'; model='+message.metadata.modelUsed)
  process.exitCode=0;break
 }
 if(process.exitCode!==0)throw Error('Timed out waiting for live group-chat reply')
}finally{await post('/mode',{mode:original.room.dispatchMode})}

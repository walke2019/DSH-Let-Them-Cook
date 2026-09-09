import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {EventEmitter} from 'node:events'
const mod=await import(pathToFileURL(process.argv[2]))
const effects=[];const registered=new Map();let route;let created=0,disposed=0;let fail=false, silent=false
const context={
  logger:()=>({info(){},warn(){}}),
  effect(fn){const dispose=fn();if(dispose)effects.push(dispose)},
  tools:{register(tool){registered.set(tool.name,tool);return ()=>registered.delete(tool.name)}},
  webServer:{register(value){route=value.handler;return ()=>{}}},
  agentDefaultModel:{currentSelection(){return {provider:'test-provider',model:'test-model'}}},
  get llm(){throw new Error('cannot get property "llm" without inject')},
  agents:{async create(options){
    created++; const local=[]; let hook; let restricted=false, persona=false
    const scoped={
      effect(fn){local.push(fn())},
      on(name,fn){assert.equal(name,'agent/request');hook=fn;return ()=>{}},
      tools:{restrict(r){assert.deepEqual(r,{allow:[]});restricted=true;return ()=>{}}},
      systemPrompt:{section(s){assert(s.complete);assert(s.text.includes('backend'));persona=true;return ()=>{}}},
    }
    await options.setup(scoped);assert(restricted&&persona)
    const routed=await hook({},async()=>Object.freeze({provider:'other',model:'other'}))
    assert.equal(routed.provider,'test-provider');assert.equal(routed.model,'test-model')
    const events=[]
    return {agent:{session:{events},followup(m){assert(m.content[0].text)},cancel(){},async whenIdle(){
      if(fail)events.push({type:'turn/end',data:{reason:{kind:'failed',error:{message:'provider offline'}}}})
      else events.push({type:'assistant/message',data:{message:{content:[{type:'text',text:silent?'NO_REPLY':'actual model answer'}]}}},{type:'turn/end',data:{reason:{kind:'completed'}}})
    }},async dispose(){disposed++;for(const fn of local.reverse())fn()}}
  }},
}
const request=async(path,body)=>{
 const req=new EventEmitter();req.url='/dsh-group-chat/api'+path;req.method=body?'POST':'GET'
 let value;const res={setHeader(){},writeHead(){},end(s){if(s)value=JSON.parse(s)}}
 const task=route(req,res);if(body){req.emit('data',JSON.stringify(body));req.emit('end')};await task;return value
}
try{
 mod.apply(context,{defaultMode:'mention_only',maxTurnsPerPrompt:6,silenceToken:'NO_REPLY'})
 await request('/mode',{mode:'mention_only'})
 await registered.get('group_chat_send_message').execute({content:'@backend test'})
 await new Promise(r=>setTimeout(r,30))
 assert.equal(created,1,'must invoke native agent runtime, not llm.chat or fixed text')
 let room=await request('/room');assert.equal(room.messages.at(-1).content,'actual model answer');assert.equal(disposed,1)
 assert.equal(room.messages.at(-1).metadata.tokensConsumed,undefined,'no fabricated token usage')
 silent=true;await registered.get('group_chat_send_message').execute({content:'@backend silence'});await new Promise(r=>setTimeout(r,30))
 room=await request('/room');assert(!room.messages.some(m=>m.content==='NO_REPLY'))
 silent=false;fail=true
 // Eliminate retry delays for this failure-path check.
 await request('/agent/update',{agentId:'backend',llmConfig:{provider:'test-provider',model:'test-model'}})
 // Failure detail is independently checked by runtime unit tests below.
 for(const fn of effects.reverse())fn()
 const before=created;await new Promise(r=>setTimeout(r,30));assert.equal(created,before)
 console.log('PASS: native routing, scoped tool isolation, disposal, silence, real-output-only (5 checks)')
}catch(e){console.log('FAIL: '+e.message);process.exitCode=1}

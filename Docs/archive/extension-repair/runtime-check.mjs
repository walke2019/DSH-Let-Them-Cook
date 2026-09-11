import assert from 'node:assert/strict'
import {runMemberTurn} from '../../lib/engine/agent-runtime.js'
import {ModelResilienceManager} from '../../lib/engine/resilience.js'
let disposed=0,cancelled=0
const make=(failure=false,hang=false)=>({agents:{async create(o){
 let resolve;const idle=new Promise(r=>resolve=r)
 const events=failure?[{type:'turn/end',data:{reason:{kind:'failed',error:{message:'test-provider-error'}}}}]:[{type:'turn/end',data:{reason:{kind:'completed'}}}]
 return {agent:{session:{events},followup(){},whenIdle(){return hang?idle:Promise.resolve()},cancel(){cancelled++;resolve()}},async dispose(){disposed++}}
}}})
const model={provider:'test',model:'model'}
await assert.rejects(runMemberTurn(make(true),model,'test',new AbortController().signal),/test-provider-error/)
assert.equal(disposed,1)
await assert.rejects(runMemberTurn(make(),model,'test',new AbortController().signal),/no text/)
assert.equal(disposed,2)
const policy={...model,llmConfig:model,resiliencePolicy:{maxRetriesPerModel:0,retryBackoffMs:1,timeoutMs:10,fallbackModels:[]}}
await assert.rejects(new ModelResilienceManager().executeWithFallback(policy,(_,s)=>runMemberTurn(make(false,true),model,'test',s)),/timed out/)
assert.equal(cancelled,1);assert.equal(disposed,3)
const ac=new AbortController();const task=new ModelResilienceManager().executeWithFallback(policy,(_,s)=>runMemberTurn(make(false,true),model,'test',s),ac.signal)
queueMicrotask(()=>ac.abort(new Error('unloaded')))
await assert.rejects(task,/unloaded/)
assert.equal(disposed,4)
let calls=0;const fallback={...policy,resiliencePolicy:{...policy.resiliencePolicy,fallbackModels:[{provider:'backup',model:'b'}]}}
const result=await new ModelResilienceManager().executeWithFallback(fallback,async()=>{if(++calls===1)throw Error('429');return 'ok'})
assert.equal(result.isFallback,true);assert.equal(calls,2)
console.log('PASS: failed/empty output, timeout cancellation, unload disposal, 429 fallback (5 checks)')

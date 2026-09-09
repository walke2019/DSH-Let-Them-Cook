import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
let made=0,closed=0
class Source{constructor(){made++;Source.instance=this}close(){closed++}}
globalThis.EventSource=Source
const source=readFileSync('src/client/group-chat-events.ts','utf8')
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const events=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
let a=0,b=0;const offA=events.subscribeGroupChat(()=>a++),offB=events.subscribeGroupChat(()=>b++)
assert.equal(made,1);Source.instance.onmessage({data:'event'});assert.deepEqual([a,b],[1,1]);offA();assert.equal(closed,0);offB();assert.equal(closed,1)
events.subscribeGroupChat(()=>{});events.disposeGroupChatEvents();assert.equal(closed,2)
console.log('PASS shared SSE: one connection, two subscribers, last unsubscribe and plugin unload close connection')

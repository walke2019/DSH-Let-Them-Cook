import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {ModelSettingsStore,validateModels} from '../../lib/engine/model-settings.js'
import {RoomManager} from '../../lib/engine/room-manager.js'
import {ModelResilienceManager} from '../../lib/engine/resilience.js'
const dir=mkdtempSync(join(tmpdir(),'gc-model-test-'))
try{
 const primary={provider:'provider-a',model:'primary'}
 const policy={fallbackModels:[{provider:'provider-b',model:'fallback'}],maxRetriesPerModel:0,retryBackoffMs:0,timeoutMs:1000}
 const store=new ModelSettingsStore(join(dir,'models.json'))
 store.save('room','backend',{llmConfig:primary,resiliencePolicy:policy})
 const reopened=new ModelSettingsStore(join(dir,'models.json'))
 assert.deepEqual(reopened.get('room','backend'),{llmConfig:primary,resiliencePolicy:policy})
 assert.equal(reopened.recent().length,2)
 store.save('room','backend',{llmConfig:primary,resiliencePolicy:policy});assert.equal(store.recent().length,2)
 assert.throws(()=>validateModels({provider:'a',model:''},policy))
 assert.throws(()=>validateModels(primary,{...policy,timeoutMs:-1}))
 assert.throws(()=>validateModels(primary,{...policy,fallbackModels:[primary]}))
 const rm=new RoomManager();const profile=rm.updateAgentProfile('dev-team-alpha','backend',{llmConfig:primary,resiliencePolicy:policy})
 assert.deepEqual(profile.resiliencePolicy,policy)
 const calls=[];const result=await new ModelResilienceManager().executeWithFallback(profile,async m=>{calls.push(m.model);if(m.model==='primary')throw Error('503');return 'fallback-ok'})
 assert.deepEqual(calls,['primary','fallback']);assert.equal(result.isFallback,true);assert.equal(result.result,'fallback-ok')
 console.log('PASS persistence, recents dedupe, validation, role update, primary failure -> fallback success')
}finally{rmSync(dir,{recursive:true,force:true})}

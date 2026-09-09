import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {ModelSettingsStore} from '../../lib/engine/model-settings.js'
const dir=mkdtempSync(join(tmpdir(),'gc-recent-six-'))
try{
 const store=new ModelSettingsStore(join(dir,'models.json'))
 for(let i=0;i<8;i++)store.remember({provider:'p',model:'m'+i})
 assert.equal(store.recent().length,6)
 assert.deepEqual(store.recent().map(m=>m.model),['m7','m6','m5','m4','m3','m2'])
 store.forget({provider:'p',model:'m5'});assert.deepEqual(store.recent().map(m=>m.model),['m7','m6','m4','m3','m2'])
 const reopened=new ModelSettingsStore(join(dir,'models.json'));assert.equal(reopened.recent().length,5)
 console.log('PASS recent max-six and single delete persisted')
}finally{rmSync(dir,{recursive:true,force:true})}

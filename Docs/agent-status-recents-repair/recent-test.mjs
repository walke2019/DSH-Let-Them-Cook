import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {ModelSettingsStore} from '../../lib/engine/model-settings.js'
const dir=mkdtempSync(join(tmpdir(),'gc-recent-delete-'))
try{
 const store=new ModelSettingsStore(join(dir,'models.json'))
 store.remember({provider:'p1',model:'m1'});store.remember({provider:'p2',model:'m2'});store.remember({provider:'p1',model:'m1'})
 assert.deepEqual(store.recent().map(m=>m.provider+'/'+m.model),['p1/m1','p2/m2'])
 store.forget({provider:'p1',model:'m1'});assert.deepEqual(store.recent().map(m=>m.provider+'/'+m.model),['p2/m2'])
 const reopened=new ModelSettingsStore(join(dir,'models.json'));assert.deepEqual(reopened.recent().map(m=>m.provider+'/'+m.model),['p2/m2'])
 console.log('PASS recent delete: single item removed, persisted, other recents preserved')
}finally{rmSync(dir,{recursive:true,force:true})}

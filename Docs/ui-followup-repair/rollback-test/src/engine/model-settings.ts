import {existsSync, readFileSync, mkdirSync, writeFileSync, renameSync} from 'node:fs'
import {dirname} from 'node:path'
import type {ModelRef, ResiliencePolicy} from '../types.js'
export interface RoleModels {llmConfig:ModelRef;resiliencePolicy?:ResiliencePolicy}
export function validateModels(primary:ModelRef, policy?:ResiliencePolicy):void {
  const valid=(m:ModelRef,blank=false)=>m&&typeof m.provider==='string'&&typeof m.model==='string'&&((blank&&!m.provider.trim()&&!m.model.trim())||(!!m.provider.trim()&&!!m.model.trim()))
  if(!valid(primary,true))throw Error('主模型的 Provider 与模型 ID 必须同时填写，或同时留空以跟随宿主')
  if(policy===undefined)return
  if(!policy||typeof policy!=='object')throw Error('回退策略格式错误')
  if(!Array.isArray(policy.fallbackModels)||policy.fallbackModels.length>5||policy.fallbackModels.some(m=>!valid(m)))throw Error('回退模型最多 5 个，每项必须填写 Provider 和模型 ID')
  const keys=[primary,...policy.fallbackModels].filter(m=>m.model).map(m=>JSON.stringify([m.provider.trim(),m.model.trim()]))
  if(new Set(keys).size!==keys.length)throw Error('主模型与回退模型不能重复')
  for(const [key,min,max] of [['maxRetriesPerModel',0,5],['retryBackoffMs',0,60000],['timeoutMs',1000,600000]] as const){
    if(!Number.isInteger(policy[key])||policy[key]<min||policy[key]>max)throw Error(`${key} 必须为 ${min}–${max} 的整数`)
  }
}
/** Plugin-owned settings only. No host credential or core configuration is written. */
export class ModelSettingsStore {
  private data:{roles:Record<string,RoleModels>;recent:ModelRef[]}={roles:{},recent:[]}
  constructor(private path:string){
    if(existsSync(path)){
      const data=JSON.parse(readFileSync(path,'utf8'))
      if(!data.roles||!Array.isArray(data.recent))throw Error('Invalid group-chat model settings')
      for(const role of Object.values(data.roles) as RoleModels[])validateModels(role.llmConfig,role.resiliencePolicy)
      this.data=data
    }
  }
  get(room:string,role:string){return this.data.roles[JSON.stringify([room,role])]}
  recent(){return this.data.recent.slice()}
  remember(model:ModelRef){
    if(!model.provider||!model.model)return
    const data={...this.data,recent:[model,...this.data.recent.filter(m=>m.provider!==model.provider||m.model!==model.model)].slice(0,20)}
    mkdirSync(dirname(this.path),{recursive:true});writeFileSync(this.path+'.tmp',JSON.stringify(data,null,2));renameSync(this.path+'.tmp',this.path);this.data=data
  }
  save(room:string,role:string,value:RoleModels){
    validateModels(value.llmConfig,value.resiliencePolicy)
    const selected=[value.llmConfig,...(value.resiliencePolicy?.fallbackModels||[])].filter(m=>m.provider&&m.model)
    const recent=[...selected,...this.data.recent].filter((m,i,a)=>a.findIndex(x=>x.provider===m.provider&&x.model===m.model)===i).slice(0,20)
    const data={roles:{...this.data.roles,[JSON.stringify([room,role])]:structuredClone(value)},recent}
    mkdirSync(dirname(this.path),{recursive:true});writeFileSync(this.path+'.tmp',JSON.stringify(data,null,2));renameSync(this.path+'.tmp',this.path)
    this.data=data
  }
}

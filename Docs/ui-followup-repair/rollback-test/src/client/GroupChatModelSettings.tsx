import React,{useEffect,useId,useState} from 'react'
import type {AgentProfile} from './group-chat-view-types.js'
type Model={provider:string;model:string}
type Policy=NonNullable<AgentProfile['resiliencePolicy']>
type Catalog={groups:{id:string;name:string;models:{id:string;name:string}[];error?:string}[];recent:Model[];current?:Model}
export function GroupChatModelSettings({role,primary,policy,onPrimary,onPolicy}:{role:AgentProfile;primary:Model;policy:Policy;onPrimary:(m:Model)=>void;onPolicy:(p:Policy)=>void}){
  const [catalog,setCatalog]=useState<Catalog>({groups:[],recent:[]})
  const [status,setStatus]=useState('正在加载宿主模型目录…')
  const [reload,setReload]=useState(0)
  const id=useId()
  useEffect(()=>{
    const abort=new AbortController()
    fetch('/dsh-group-chat/api/models',{signal:abort.signal}).then(async r=>{if(!r.ok)throw Error('目录加载失败');return r.json()}).then(data=>{setCatalog(data);setStatus(data.groups.some((g:Catalog['groups'][number])=>g.error)?'部分目录加载失败；仍可手动填写模型 ID。':'')}).catch(e=>{if(!abort.signal.aborted)setStatus(e.message+'，可手动输入或重试。')})
    return ()=>abort.abort()
  },[reload])
  const models=catalog.groups.flatMap(g=>g.models.map(m=>({provider:g.id,model:m.id,name:m.name})))
  // Advisory name matching, not a benchmark. Only IDs actually returned by the host.
  const pattern=({backend:/code|coder|codex/i,frontend:/code|coder|codex/i,qa:/reason|thinking|r1|code/i,commander:/reason|thinking|r1/i,researcher:/reason|thinking|pro|search/i,writer:/chat|instruct|flash/i} as Record<string,RegExp>)[role.id]||/chat|instruct/i
  const suggestions=models.filter(m=>pattern.test(m.model+' '+m.name)).slice(0,4)
  const modelRow=(label:string,value:Model,change:(m:Model)=>void,key:string)=><div className="gc-model-row">
    <label>{label} Provider<input aria-label={`${label} Provider`} list={`${id}-providers`} placeholder="如 cpa" value={value.provider} onChange={e=>change({...value,provider:e.target.value})}/></label>
    <label>模型 ID<input aria-label={`${label}模型 ID`} list={`${id}-${key}`} placeholder="选择或输入完整模型 ID" value={value.model} onChange={e=>change({...value,model:e.target.value})}/></label>
    <datalist id={`${id}-${key}`}>{models.filter(m=>m.provider===value.provider).map(m=><option key={m.model} value={m.model}>{m.name}</option>)}</datalist>
  </div>
  return <section className="gc-model-settings" aria-label="角色模型与回退设置">
    <style>{`.gc-model-settings{border-top:1px solid #8883;padding-top:12px;font-size:12px}.gc-model-settings h3{font-size:13px;margin:0 0 8px}.gc-model-settings p{color:var(--dsw-alias-label-secondary,#aaa);font-size:11px;line-height:1.6}.gc-model-row{display:grid;grid-template-columns:minmax(100px,1fr) minmax(140px,2fr);gap:8px}.gc-model-settings label{display:block;min-width:0}.gc-model-settings input,.gc-model-settings select{display:block;box-sizing:border-box;width:100%;margin:4px 0 8px;padding:7px;border:1px solid #8885;border-radius:6px;background:var(--dsw-alias-bg-base,#18181c);color:inherit;font:inherit}.gc-model-settings button{padding:4px 8px;margin:2px;border:1px solid #8884;border-radius:6px;background:transparent;color:inherit;font:inherit;cursor:pointer}.gc-model-settings button:disabled{opacity:.4;cursor:default}.gc-fallback-item{padding:8px;margin-top:8px;border:1px solid #8883;border-radius:8px}.gc-model-numbers{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}`}</style>
    <h3>主模型</h3>
    {modelRow('主模型',primary,onPrimary,'primary')}
    <datalist id={`${id}-providers`}>{catalog.groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</datalist>
    <button type="button" onClick={()=>onPrimary({provider:'',model:''})}>跟随宿主默认</button>
    <p>两项同时留空时跟随宿主{catalog.current?.model?`：${catalog.current.provider} / ${catalog.current.model}`:'默认模型'}。凭据由 DSH 托管。</p>
    {status&&<p role="status">{status} <button type="button" onClick={()=>setReload(v=>v+1)}>刷新目录</button></p>}
    <label>最近使用（最近保存或调用的 20 项，跨重启保留）<select aria-label="最近使用的模型" value="" onChange={e=>{if(e.target.value)onPrimary(catalog.recent[Number(e.target.value)])}}><option value="">选择后填入主模型</option>{catalog.recent.map((m,i)=><option key={i} value={i}>{m.provider} / {m.model}</option>)}</select></label>
    <p>角色建议：按模型名称匹配「{role.title||role.id}」职责，仅供选择参考，不代表能力评测。</p>
    {suggestions.length?suggestions.map(m=><button type="button" key={m.provider+'/'+m.model} onClick={()=>onPrimary({provider:m.provider,model:m.model})}>{m.provider} / {m.model}</button>):<p>当前目录没有明确匹配项，建议先跟随宿主默认，再根据实际输出调整。</p>}
    <h3 style={{marginTop:14}}>回退模型 · 按顺序尝试</h3>
    <p>主模型失败并耗尽重试后，依次切换下列模型；空列表表示不切换。优先选择不同 Provider，降低同一服务故障的影响。</p>
    {policy.fallbackModels.map((m,i)=><div className="gc-fallback-item" key={i}>
      {modelRow(`回退 ${i+1}`,m,value=>onPolicy({...policy,fallbackModels:policy.fallbackModels.map((old,j)=>j===i?value:old)}),`fallback-${i}`)}
      <select aria-label={`回退 ${i+1} 最近使用`} value="" onChange={e=>{if(e.target.value)onPolicy({...policy,fallbackModels:policy.fallbackModels.map((old,j)=>j===i?catalog.recent[Number(e.target.value)]:old)})}}><option value="">从最近使用填入</option>{catalog.recent.map((r,j)=><option key={j} value={j}>{r.provider} / {r.model}</option>)}</select>
      <button type="button" disabled={i===0} onClick={()=>{const next=[...policy.fallbackModels];[next[i-1],next[i]]=[next[i],next[i-1]];onPolicy({...policy,fallbackModels:next})}}>上移</button>
      <button type="button" onClick={()=>onPolicy({...policy,fallbackModels:policy.fallbackModels.filter((_,j)=>j!==i)})}>移除回退 {i+1}</button>
    </div>)}
    <button type="button" disabled={policy.fallbackModels.length>=5} onClick={()=>onPolicy({...policy,fallbackModels:[...policy.fallbackModels,{provider:'',model:''}]})}>＋ 添加回退模型</button>
    <div className="gc-model-numbers">
      <label>每模型重试次数<input aria-label="每模型重试次数" type="number" min={0} max={5} value={policy.maxRetriesPerModel} onChange={e=>onPolicy({...policy,maxRetriesPerModel:Number(e.target.value)})}/></label>
      <label>退避毫秒<input aria-label="退避毫秒" type="number" min={0} max={60000} value={policy.retryBackoffMs} onChange={e=>onPolicy({...policy,retryBackoffMs:Number(e.target.value)})}/></label>
      <label>超时毫秒<input aria-label="超时毫秒" type="number" min={1000} max={600000} value={policy.timeoutMs} onChange={e=>onPolicy({...policy,timeoutMs:Number(e.target.value)})}/></label>
    </div>
  </section>
}

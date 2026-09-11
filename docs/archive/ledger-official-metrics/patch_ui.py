from pathlib import Path
p=Path('src/client/GroupChatSideDock.tsx')
s=p.read_text(encoding='utf-8')
s=s.replace("interface LedgerData {\n  totalCalls: number\n  totalTokens: number\n  agentStats: Record<string, {\n    agentName: string\n    callCount: number\n    totalTokens: number\n  }>\n}\n", r"""interface RuntimeMetrics {
  turnCount: number
  stepCount: number
  llmMs: number
  toolMs: number
  firstTokenMsTotal: number
  firstTokenCount: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

interface ModelLedgerData {
  provider: string
  model: string
  callCount: number
  totalTokens: number
  metrics: RuntimeMetrics
}

interface LedgerData {
  totalCalls: number
  totalTokens: number
  metrics?: RuntimeMetrics
  agentStats: Record<string, {
    agentName: string
    callCount: number
    totalTokens: number
    metrics?: RuntimeMetrics
    modelStats?: Record<string, ModelLedgerData>
  }>
}
""")
helper=r'''
function formatDuration(ms=0): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return minutes ? `${minutes}m${rest}s` : `${rest}s`
}

function formatTokens(n=0): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 1 : 2)}K`
  return `${Math.round(n)}`
}

function metricLine(calls=0, m?: RuntimeMetrics): string {
  const input = (m?.inputTokens || 0) + (m?.cacheReadTokens || 0) + (m?.cacheWriteTokens || 0)
  const output = m?.outputTokens || 0
  const totalInputForCache = (m?.inputTokens || 0) + (m?.cacheReadTokens || 0)
  const cacheHit = totalInputForCache ? Math.round(((m?.cacheReadTokens || 0) / totalInputForCache) * 100) : 0
  const first = m?.firstTokenCount ? `${((m.firstTokenMsTotal / m.firstTokenCount) / 1000).toFixed(1)}s` : '—'
  const llmSeconds = (m?.llmMs || 0) / 1000
  const tokPerSec = llmSeconds > 0 ? Math.round(output / llmSeconds) : 0
  return `${calls} 轮 · ${m?.stepCount || 0} 步  LLM ${formatDuration(m?.llmMs)} · 工具调用 ${formatDuration(m?.toolMs)}  首 token 平均 ${first} · ${tokPerSec} tok/s  缓存命中 ${cacheHit}%  输入 ${formatTokens(input)} tok · 输出 ${formatTokens(output)} tok`
}

function mergeMetrics(items: Array<RuntimeMetrics | undefined>): RuntimeMetrics {
  return items.reduce((acc,m)=>({
    turnCount: acc.turnCount + (m?.turnCount || 0), stepCount: acc.stepCount + (m?.stepCount || 0), llmMs: acc.llmMs + (m?.llmMs || 0), toolMs: acc.toolMs + (m?.toolMs || 0),
    firstTokenMsTotal: acc.firstTokenMsTotal + (m?.firstTokenMsTotal || 0), firstTokenCount: acc.firstTokenCount + (m?.firstTokenCount || 0),
    inputTokens: acc.inputTokens + (m?.inputTokens || 0), outputTokens: acc.outputTokens + (m?.outputTokens || 0), cacheReadTokens: acc.cacheReadTokens + (m?.cacheReadTokens || 0), cacheWriteTokens: acc.cacheWriteTokens + (m?.cacheWriteTokens || 0),
  }), {turnCount:0,stepCount:0,llmMs:0,toolMs:0,firstTokenMsTotal:0,firstTokenCount:0,inputTokens:0,outputTokens:0,cacheReadTokens:0,cacheWriteTokens:0})
}
'''
s=s.replace("/**\n * 侧边栏辅助副屏 (Companion HUD)", helper+"\n/**\n * 侧边栏辅助副屏 (Companion HUD)")
old=s[s.index("              <div style={{\n                background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',"):s.index("              <div style={{ fontSize: '11px', color: 'var(--dsw-alias-label-secondary, #94a3b8)', marginTop: '4px' }}>", s.index("{/* C. 特遣账本"))]
new=r'''              <div style={{
                background: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))',
                display: 'grid',
                gap: '8px',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                  <div style={{ fontSize: '11px', color: 'var(--dsw-alias-label-secondary, #94a3b8)', fontWeight: 600 }}>总体运行统计</div>
                  <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-caption, #64748b)' }}>官方摘要风格</div>
                </div>
                <div style={{ fontSize:'11px', lineHeight:1.55, color:'var(--dsw-alias-label-primary,#f8fafc)', whiteSpace:'normal' }}>
                  {metricLine(ledger?.totalCalls || 0, ledger?.metrics || mergeMetrics(Object.values(ledger?.agentStats || {}).map(s=>s.metrics)))}
                </div>
                <details style={{borderTop:'1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))',paddingTop:8}}>
                  <summary style={{cursor:'pointer',fontSize:11,color:'var(--dsw-alias-label-secondary,#cbd5e1)',userSelect:'none'}}>按 Agent / 模型展开</summary>
                  <div style={{display:'grid',gap:8,marginTop:8}}>
                    {Object.entries(ledger?.agentStats || {}).map(([agentId,stat])=>(
                      <div key={agentId} style={{padding:'8px 9px',borderRadius:8,background:'var(--dsw-alias-bg-layer-1,#151518)',border:'1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))'}}>
                        <div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:11,fontWeight:700,color:'var(--dsw-alias-label-primary,#f8fafc)'}}><span>{stat.agentName}</span><span>{stat.totalTokens || 0} T</span></div>
                        <div style={{fontSize:10,color:'var(--dsw-alias-label-tertiary,#94a3b8)',marginTop:4}}>{metricLine(stat.callCount || 0, stat.metrics)}</div>
                        {Object.values(stat.modelStats || {}).map(ms=>(
                          <div key={`${ms.provider}/${ms.model}`} style={{marginTop:6,paddingTop:6,borderTop:'1px dashed var(--dsw-alias-border-l1, rgba(255,255,255,0.08))',fontSize:10,color:'var(--dsw-alias-label-secondary,#cbd5e1)'}}>
                            <div style={{fontWeight:600,color:'var(--dsw-alias-label-primary,#f8fafc)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ms.provider} / {ms.model}</div>
                            <div style={{marginTop:2,color:'var(--dsw-alias-label-tertiary,#94a3b8)'}}>{metricLine(ms.callCount || 0, ms.metrics)}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                    {Object.keys(ledger?.agentStats || {}).length===0 && <div style={{fontSize:11,color:'var(--dsw-alias-label-tertiary,#94a3b8)'}}>暂无 Agent 调用记录；首次角色发言后会显示分项。</div>}
                  </div>
                </details>
              </div>

'''
s=s.replace(old,new)
p.write_text(s,encoding='utf-8')

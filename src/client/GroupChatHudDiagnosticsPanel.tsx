import React from 'react'
import {hudCardStyle, hudPanelStackStyle, hudTokens} from './group-chat-hud-styles.js'
import type {CompatReport} from './group-chat-hud-types.js'
import {tx, type GroupChatLocale} from './i18n.js'

interface Props {
  compat: CompatReport | null
  ledgerSource?: string
  watchdogSource?: string
  toolEventSource?: string
  locale?: GroupChatLocale
}

function statusTone(ok: boolean): { text: string; color: string; bg: string; border: string } {
  return ok
    ? { text: 'Native', color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.30)' }
    : { text: 'Missing', color: '#fca5a5', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.30)' }
}

function CapabilityRow({label, ok, detail}: {label: string; ok: boolean; detail?: string}) {
  const tone = statusTone(ok)
  return <div className="gc-diagnostics-row" data-native={ok ? 'true' : 'false'}>
    <div style={{minWidth:0}}>
      <div className="gc-diagnostics-row-label">{label}</div>
      {detail && <div className="gc-diagnostics-row-detail">{detail}</div>}
    </div>
    <span className="gc-diagnostics-badge" style={{color:tone.color, background:tone.bg, borderColor:tone.border}}>{ok ? 'ON' : 'OFF'}</span>
  </div>
}

function SourcePill({label, value}: {label: string; value: string}) {
  return <div className="gc-diagnostics-source-pill"><span>{label}</span><b>{value}</b></div>
}

export function GroupChatHudDiagnosticsPanel({compat, ledgerSource = 'dsh-session-projections', watchdogSource = 'dsh-runtime-liveness', toolEventSource = 'dsh-tool-event-adapter', locale = 'zh-CN'}: Props) {
  const features = compat?.features || {}
  const warnings = compat?.warnings || []
  const optimizations = compat?.optimizations || []
  const nativeReady = !!compat?.ok && !!features.sessionProjectionStateOf
  return <div style={hudPanelStackStyle} data-dsh-capability-diagnostics="true">
    <style>{`
      .gc-diagnostics-title{font-size:13px;font-weight:700;color:${hudTokens.labelPrimary};display:flex;justify-content:space-between;gap:8px;align-items:center;}
      .gc-diagnostics-subtitle{font-size:11px;color:${hudTokens.labelTertiary};line-height:1.45;margin-top:4px;}
      .gc-diagnostics-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid rgba(255,255,255,0.06);}
      .gc-diagnostics-row:first-of-type{border-top:none;}
      .gc-diagnostics-row-label{font-size:12px;color:${hudTokens.labelPrimary};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .gc-diagnostics-row-detail{font-size:10px;color:${hudTokens.labelTertiary};margin-top:2px;line-height:1.35;}
      .gc-diagnostics-badge{font-size:10px;font-weight:700;border:1px solid;border-radius:999px;padding:2px 6px;white-space:nowrap;}
      .gc-diagnostics-source-grid{display:grid;grid-template-columns:1fr;gap:6px;margin-top:8px;}
      .gc-diagnostics-source-pill{display:flex;justify-content:space-between;gap:8px;border:1px solid ${hudTokens.borderL1};background:${hudTokens.bgLayer3};border-radius:8px;padding:6px 8px;font-size:11px;color:${hudTokens.labelSecondary};}
      .gc-diagnostics-source-pill b{color:#93c5fd;font-weight:700;text-align:right;}
      .gc-diagnostics-list{margin:8px 0 0;padding-left:16px;color:${hudTokens.labelSecondary};font-size:11px;line-height:1.45;}
    `}</style>
    <section style={hudCardStyle}>
      <div className="gc-diagnostics-title">
        <span>{tx(locale,'DSH 底座能力诊断','DSH Native Capability Diagnostics')}</span>
        <span className="gc-diagnostics-badge" style={{color:nativeReady?'#34d399':'#fbbf24',background:nativeReady?'rgba(16,185,129,0.12)':'rgba(234,179,8,0.12)',borderColor:nativeReady?'rgba(16,185,129,0.30)':'rgba(234,179,8,0.30)'}}>{nativeReady ? 'DSH-native' : 'Review'}</span>
      </div>
      <div className="gc-diagnostics-subtitle">{tx(locale,'用于确认扩展是否走官方 DSH 原生能力路径，而不是补丁式 DOM 或估算兜底。','Confirms whether the extension is using official DSH-native primitives instead of patch-style DOM or estimated fallbacks.')}</div>
    </section>

    <section style={hudCardStyle}>
      <CapabilityRow label="agents.create" ok={!!features.agents} detail={tx(locale,'群聊成员以独立 subagent session 运行。','Members run as independent subagent sessions.')} />
      <CapabilityRow label="sessionProjections.stateOf" ok={!!features.sessionProjectionStateOf} detail="tokenUsage / sessionStats" />
      <CapabilityRow label="tools.restrict({ allow })" ok={!!features.toolRestrict} detail={tx(locale,'角色工具白名单由 DSH 底座强制执行。','Role tool allowlists are enforced by DSH.')} />
      <CapabilityRow label="webServer.register" ok={!!features.webServer} detail={tx(locale,'插件 API 由 Cordis/DSH 挂载。','Plugin APIs are mounted through Cordis/DSH.')} />
      <CapabilityRow label="agentDefaultModel.currentSelection" ok={!!features.currentModel} detail={tx(locale,'读取官方当前模型选择。','Reads the official current model selection.')} />
      <CapabilityRow label="llm.listProviders/listModels" ok={!!features.llmCatalog} detail={tx(locale,'读取官方模型目录。','Reads the official model catalog.')} />
    </section>

    <section style={hudCardStyle}>
      <div className="gc-diagnostics-title"><span>{tx(locale,'当前事实源','Current fact sources')}</span></div>
      <div className="gc-diagnostics-source-grid">
        <SourcePill label={tx(locale,'账本','Ledger')} value={ledgerSource} />
        <SourcePill label={tx(locale,'看门狗','Watchdog')} value={watchdogSource} />
        <SourcePill label={tx(locale,'工具事件','Tool events')} value={toolEventSource} />
      </div>
    </section>

    {optimizations.length > 0 && <section style={hudCardStyle}>
      <div className="gc-diagnostics-title"><span>{tx(locale,'已启用优化','Enabled optimizations')}</span></div>
      <ul className="gc-diagnostics-list">{optimizations.map((item,index)=><li key={index}>{item}</li>)}</ul>
    </section>}

    {warnings.length > 0 && <section style={hudCardStyle}>
      <div className="gc-diagnostics-title"><span>{tx(locale,'需要关注','Warnings')}</span></div>
      <ul className="gc-diagnostics-list">{warnings.map((item,index)=><li key={index}>{item}</li>)}</ul>
    </section>}
  </div>
}

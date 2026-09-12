import React, {useState} from 'react'
import {hudTokens} from './group-chat-hud-styles.js'
import {tx, type GroupChatLocale} from './i18n.js'

type ThemeValue = 'default' | 'meme_comedy' | 'genshin' | 'modern' | 'three_kingdoms' | 'legends' | string
type ModeValue = 'default' | 'mention_only' | 'workflow_driven' | 'moderator_led' | 'free_discussion' | string

interface GroupChatHudTopControlsProps {
  selectedTheme: ThemeValue
  selectedMode: ModeValue
  managementError?: string
  onThemeChange(theme: string): void | Promise<void>
  locale?: GroupChatLocale
  onModeChange(mode: string): void | Promise<void>
}

const MODE_GUIDE: Record<string,{fit:string;trigger:string;cost:string}> = {
  default: {fit:'默认等同工作流，适合完整项目任务。', trigger:'当前阶段责任人并发执行，主 Agent 审核推进。', cost:'调用量中等，可控。'},
  workflow_driven: {fit:'需求→实现→验收→文档这类完整任务。', trigger:'按阶段唤醒 assignedRoleIds，阶段内保留 DSH 并发。', cost:'调用量中等，适合项目闭环。'},
  mention_only: {fit:'只想问某个角色，或者先不触发模型。', trigger:'只有明确 @ 的角色会发言，不 @ 只入库。', cost:'最省。'},
  moderator_led: {fit:'你不想理解角色分工，希望有人先拆活。', trigger:'先唤醒 commander，再由 commander 指派 SubAgent。', cost:'中等偏省。'},
  free_discussion: {fit:'头脑风暴、多视角挑刺。', trigger:'全员收到主题，无关角色返回 NO_REPLY 并被静默。', cost:'最高。'},
}

const MODES = [
  ['仅 @ 角色','你明确 @ 谁，谁才发言；不 @ 就只入库。适合精准点名单问，例如：@前端工程师 优化这个下拉。'],
  ['工作流','按右侧五阶段推进当前任务；当前阶段责任人先执行，阶段产物需要总指挥审核后进入下一阶段。适合完整项目、需求→实现→审计→文档。'],
  ['主持人调度','每次人类消息先交给总指挥拆解，再由总指挥安排后续角色。适合你不想自己点名、但仍希望有人把控节奏。'],
  ['自由讨论','所有角色都收到主题并自行判断是否相关；无关角色返回 NO_REPLY 被静默。适合头脑风暴，但调用量会更多。'],
]

function SelectChevron() {
  return <svg className="dsh-gc-top-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>
}

export function GroupChatHudTopControls({selectedTheme, selectedMode, managementError, locale = 'zh-CN', onThemeChange, onModeChange}: GroupChatHudTopControlsProps) {
  const [modeHelpOpen, setModeHelpOpen] = useState(false)
  const currentModeGuide = MODE_GUIDE[selectedMode] || MODE_GUIDE.default
  return <>
    <span aria-hidden="true" data-dsh-gc-top-style-token style={{display:'none',color:hudTokens.labelPrimary,background:hudTokens.bgLayer2,borderColor:hudTokens.borderL2}} />
    <style>{`
      .dsh-gc-top-controls{padding:8px 10px;display:grid;grid-template-columns:46px minmax(0,1fr) 46px minmax(0,1fr) 24px;column-gap:4px;row-gap:6px;font-size:11px;align-items:center;white-space:nowrap;overflow:hidden;}
      .dsh-gc-top-label{color:var(--dsw-alias-label-secondary,#cbd5e1);height:30px;display:inline-flex;align-items:center;}
      .dsh-gc-select-wrap{position:relative;display:block;min-width:0;}
      .dsh-gc-top-select{width:100%;height:30px;box-sizing:border-box;appearance:none;-webkit-appearance:none;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.14));border-radius:10px;background:var(--dsw-alias-bg-layer-2,#202025);color:var(--dsw-alias-label-primary,#f8fafc);font:inherit;font-size:12px;padding:0 28px 0 10px;outline:none;}
      .dsh-gc-top-select:focus-visible,.dsh-gc-help-button:focus-visible{outline:2px solid #8196ff;outline-offset:1px;}
      .dsh-gc-top-chevron{position:absolute;right:9px;top:50%;width:14px;height:14px;transform:translateY(-50%);pointer-events:none;color:var(--dsw-alias-label-tertiary,#9ca3af);}
      .dsh-gc-help-button{width:24px;height:28px;border-radius:9px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.14));background:var(--dsw-alias-bg-layer-2,#202025);color:var(--dsw-alias-label-secondary,#cbd5e1);font-size:13px;font-weight:700;cursor:pointer;}
      .dsh-gc-top-error{grid-column:1 / -1;color:#fca5a5;white-space:normal;}
      .dsh-gc-help-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;background:rgba(0,0,0,0.52);pointer-events:auto;}
      .dsh-gc-help-dialog{width:min(560px,calc(100vw - 32px));max-height:calc(100vh - 80px);overflow-y:auto;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.14));border-radius:16px;background:var(--dsw-alias-bg-layer-1,#1f1f23);box-shadow:var(--dsw-shadow-lv3,0 20px 60px rgba(0,0,0,0.45));color:var(--dsw-alias-label-primary,#f8fafc);}
      .dsh-gc-help-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.08));gap:12px;}
      .dsh-gc-help-title{font-size:14px;font-weight:700;}
      .dsh-gc-help-subtitle{font-size:11px;color:var(--dsw-alias-label-tertiary,#94a3b8);margin-top:2px;}
      .dsh-gc-help-close{width:28px;height:28px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.14));background:var(--dsw-alias-bg-layer-2,#202025);color:inherit;cursor:pointer;}
      .dsh-gc-help-body{display:grid;gap:10px;padding:14px 16px;font-size:12px;line-height:1.55;}
      .dsh-gc-help-current{padding:10px 12px;border-radius:12px;background:rgba(77,107,254,0.10);border:1px solid rgba(77,107,254,0.26);color:var(--dsw-alias-label-secondary,#cbd5e1);}
      .dsh-gc-help-current b,.dsh-gc-help-mode b,.dsh-gc-help-scope b{color:var(--dsw-alias-label-primary,#f8fafc);}
      .dsh-gc-help-mode{padding:10px 12px;border-radius:12px;background:var(--dsw-alias-bg-layer-2,#242428);border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.08));}
      .dsh-gc-help-mode b{display:block;margin-bottom:4px;}
      .dsh-gc-help-mode div,.dsh-gc-help-scope{color:var(--dsw-alias-label-secondary,#cbd5e1);}
      .dsh-gc-help-scope{padding:10px 12px;border-radius:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.24);}
    `}</style>
    <div className="dsh-gc-top-controls" aria-label={tx(locale,'群聊 HUD 顶部配置','Group chat HUD top settings')}>
      <span className="dsh-gc-top-label">{tx(locale,'角色主题','Theme')}</span>
      <span className="dsh-gc-select-wrap">
        <select className="dsh-gc-top-select" aria-label={tx(locale,'角色主题','Theme')} value={selectedTheme} onChange={e=>void onThemeChange(e.target.value)}>
          <option value="default">{tx(locale,'默认（沙雕整活）','Default (Meme squad)')}</option><option value="meme_comedy">{tx(locale,'沙雕整活','Meme squad')}</option><option value="genshin">{tx(locale,'原神提瓦特','Genshin / Teyvat')}</option><option value="modern">{tx(locale,'现代精英','Modern elite')}</option><option value="three_kingdoms">{tx(locale,'三国风云','Three Kingdoms')}</option><option value="legends">{tx(locale,'科技传奇','Tech legends')}</option>
        </select>
        <SelectChevron />
      </span>
      <span className="dsh-gc-top-label">{tx(locale,'调度模式','Mode')}</span>
      <span className="dsh-gc-select-wrap">
        <select className="dsh-gc-top-select" aria-label={tx(locale,'调度模式','Mode')} value={selectedMode} onChange={e=>void onModeChange(e.target.value)}>
          <option value="default">{tx(locale,'默认（工作流）','Default (Workflow)')}</option><option value="mention_only">{tx(locale,'仅 @ 角色','@ mention only')}</option><option value="workflow_driven">{tx(locale,'工作流','Workflow')}</option><option value="moderator_led">{tx(locale,'主持人调度','Moderator-led')}</option><option value="free_discussion">{tx(locale,'自由讨论','Free discussion')}</option>
        </select>
        <SelectChevron />
      </span>
      <button type="button" className="dsh-gc-help-button" aria-label={tx(locale,'查看调度模式 QA 说明','View mode QA guide')} title={tx(locale,'调度模式 QA','Mode QA')} onClick={()=>setModeHelpOpen(true)}>?</button>
      <button
        type="button"
        className="dsh-gc-clear-button"
        aria-label={tx(locale,'清空对话记录','Clear history')}
        title={tx(locale,'清空当前群聊对话与执行记录','Clear all messages and execution history')}
        style={{
          border: '1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.14))',
          borderRadius: '8px',
          background: 'var(--dsw-alias-bg-layer-2,#202025)',
          color: 'var(--dsw-alias-label-secondary,#cbd5e1)',
          cursor: 'pointer',
          fontSize: '11px',
          padding: '2px 7px',
          height: '24px',
          lineHeight: '20px',
        }}
        onClick={async () => {
          if (window.confirm(tx(locale, '确定清空当前群聊对话与执行记录吗？', 'Are you sure you want to clear conversation records?'))) {
            try {
              await fetch('/dsh-group-chat/api/room/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId }),
              })
            } catch (err) {
              console.error(err)
            }
          }
        }}
      >
        🧹 {tx(locale, '清空', 'Clear')}
      </button>
      {managementError&&<div className="dsh-gc-top-error" role="alert">{managementError}</div>}
    </div>
    {modeHelpOpen && <div className="dsh-gc-help-backdrop" role="dialog" aria-modal="true" aria-label={tx(locale,'调度模式 QA 说明','Mode QA guide')} onClick={()=>setModeHelpOpen(false)}>
      <div className="dsh-gc-help-dialog" onClick={e=>e.stopPropagation()}>
        <div className="dsh-gc-help-head"><div><div className="dsh-gc-help-title">{tx(locale,'调度模式 QA 速查','Mode QA quick guide')}</div><div className="dsh-gc-help-subtitle">{tx(locale,'不知道怎么用时，直接按场景选下面四种。','When unsure, choose by scenario below.')}</div></div><button type="button" className="dsh-gc-help-close" onClick={()=>setModeHelpOpen(false)} aria-label={tx(locale,'关闭调度模式说明','Close mode guide')}>×</button></div>
        <div className="dsh-gc-help-body">
          <div className="dsh-gc-help-current"><b>{tx(locale,'当前模式','Current mode')}：{selectedMode === 'default' ? tx(locale,'默认（工作流）','Default (Workflow)') : selectedMode}</b><br/>{tx(locale,'适合','Best for')}：{locale==='en-US'?'See selected scenario guidance':currentModeGuide.fit}<br/>{tx(locale,'会触发谁','Triggers')}：{locale==='en-US'?'Current stage owners; master Agent reviews and advances.':currentModeGuide.trigger}<br/>{tx(locale,'调用量','Cost')}：{locale==='en-US'?'Controlled / varies by mode.':currentModeGuide.cost}</div>
          {MODES.map(([title,body])=><div className="dsh-gc-help-mode" key={title}><b>{title}</b><div>{body}</div></div>)}
          <div className="dsh-gc-help-scope"><b>{tx(locale,'工作区隔离','Workspace scope')}：</b>{tx(locale,'角色编辑、模型/回退模型与调度状态保存在当前 DSH 工作区的 ','Role edits, primary/fallback models, and mode state are saved under this DSH workspace: ')}<code>.pm-workflow/dsh-group-chat/</code>{tx(locale,'，不是全局配置；换工作区不会串配置。','. They are not global, so switching workspaces keeps configs separate.')}</div>
        </div>
      </div>
    </div>}
  </>
}

import React, { useState } from 'react'
import type { UserDecisionPrompt } from '../types.js'
import { tx, type GroupChatLocale } from './i18n.js'

export interface GroupChatQuestionComposerProps {
  prompt: UserDecisionPrompt
  locale?: GroupChatLocale
  sending?: boolean
  onDismiss: () => void
  onSubmit: (answerText: string) => void
}

export function GroupChatQuestionComposer({
  prompt,
  locale = 'zh-CN',
  sending = false,
  onDismiss,
  onSubmit,
}: GroupChatQuestionComposerProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(prompt.recommendedOptionKey || prompt.options?.[0]?.key || null)
  const [customText, setCustomText] = useState<string>('')
  const [minimized, setMinimized] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const hasOptions = Array.isArray(prompt.options) && prompt.options.length > 0

  const handleSubmit = (chosenKey: string | null, customVal: string) => {
    if (sending) return
    const trimmedCustom = customVal.trim()
    if (trimmedCustom) {
      onSubmit(trimmedCustom)
      return
    }
    if (chosenKey && hasOptions) {
      const opt = prompt.options!.find(o => o.key === chosenKey)
      if (opt) {
        onSubmit(locale === 'en-US' ? `I choose: ${opt.label}` : `我拍板选择：${opt.label}`)
        return
      }
    }
    setError(tx(locale, '请选择一个方案或输入自定义回答', 'Please select an option or enter a custom answer'))
  }

  return (
    <div className="gc-qc-frame" data-dsh-gc-question-composer="true" data-dsh-gc-decision-card="true">
      <style>{`
        .gc-qc-frame {
          padding: 6px calc(var(--dsh-composer-side-clearance, 0px) + 16px) 12px;
          justify-content: center;
          display: flex;
          width: 100%;
          box-sizing: border-box;
        }
        .gc-qc-card {
          width: 100%;
          max-width: var(--dsh-chat-content-width, 960px);
          background: var(--dsw-specific-input-major, #18181c);
          border: 1px solid var(--dsw-alias-border-l2, #34343a);
          border-radius: 20px;
          box-shadow: var(--dsw-elevation-panel, 0 8px 30px rgba(0,0,0,0.35));
          color: var(--dsw-alias-label-primary, #f8fafc);
          flex-direction: column;
          display: flex;
          overflow: hidden;
          max-height: min(60vh, 520px);
          font-family: inherit;
          box-sizing: border-box;
        }
        .gc-qc-card-minimized {
          max-height: none;
        }
        .gc-qc-header {
          flex-shrink: 0;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding: 16px 16px 0 20px;
          display: flex;
        }
        .gc-qc-headingBlock {
          min-width: 0;
          flex: 1;
        }
        .gc-qc-eyebrow {
          color: var(--dsw-alias-label-tertiary, #94a3b8);
          margin-bottom: 4px;
          font-size: 11px;
          font-weight: 500;
          line-height: 16px;
        }
        .gc-qc-title {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          line-height: 22px;
          color: var(--dsw-alias-label-primary, #f8fafc);
        }
        .gc-qc-headerActions {
          flex-shrink: 0;
          align-items: center;
          gap: 4px;
          display: flex;
        }
        .gc-qc-iconButton {
          width: 24px;
          height: 24px;
          color: var(--dsw-alias-label-tertiary, #94a3b8);
          cursor: pointer;
          background: transparent;
          border: none;
          border-radius: 999px;
          place-items: center;
          padding: 0;
          display: grid;
          transition: background 0.12s, color 0.12s;
        }
        .gc-qc-iconButton:hover:not(:disabled) {
          background: var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.08));
          color: var(--dsw-alias-label-primary, #f8fafc);
        }
        .gc-qc-body {
          overscroll-behavior: contain;
          flex-direction: column;
          flex: auto;
          min-height: 0;
          display: flex;
          overflow-y: auto;
        }
        .gc-qc-detail {
          margin: 4px 20px 6px;
          font-size: 13px;
          line-height: 1.5;
          color: var(--dsw-alias-label-secondary, #cbd5e1);
        }
        .gc-qc-options {
          flex-direction: column;
          gap: 2px;
          margin: 4px 0 0;
          padding: 4px 12px;
          display: flex;
        }
        .gc-qc-option {
          width: 100%;
          min-height: 40px;
          color: inherit;
          text-align: left;
          cursor: pointer;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 12px;
          flex-shrink: 0;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 12px 8px 8px;
          transition: background-color .12s, border-color .12s;
          display: flex;
          font: inherit;
        }
        .gc-qc-option:hover:not(:disabled) {
          background: var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.06));
        }
        .gc-qc-optionSelected {
          background: var(--dsw-alias-interactive-bg-hover, rgba(77,107,254,0.12)) !important;
          border-color: var(--dsw-alias-state-business-primary, #4d6bfe) !important;
        }
        .gc-qc-number {
          background: var(--dsw-alias-bg-overlay, rgba(255,255,255,0.08));
          width: 20px;
          height: 20px;
          color: var(--dsw-alias-label-secondary, #cbd5e1);
          border-radius: 6px;
          flex: 0 0 20px;
          place-items: center;
          margin-top: 2px;
          font-size: 12px;
          font-weight: 600;
          line-height: 18px;
          display: grid;
        }
        .gc-qc-numberSelected {
          background: var(--dsw-alias-state-business-primary, #4d6bfe);
          color: white;
        }
        .gc-qc-optionCopy {
          flex: 1;
          min-width: 0;
        }
        .gc-qc-optionLine {
          flex-wrap: wrap;
          align-items: baseline;
          gap: 4px 6px;
          display: flex;
        }
        .gc-qc-optionLabel {
          font-size: 14px;
          font-weight: 500;
          line-height: 22px;
        }
        .gc-qc-badge {
          background: rgba(16,185,129,0.18);
          color: #34d399;
          border-radius: 6px;
          padding: 0 5px;
          font-size: 11px;
          font-weight: 600;
          line-height: 18px;
        }
        .gc-qc-description {
          color: var(--dsw-alias-label-tertiary, #94a3b8);
          font-size: 12px;
          font-weight: 400;
          line-height: 18px;
          margin-top: 2px;
        }
        .gc-qc-customRow {
          border: 1px solid transparent;
          border-radius: 12px;
          flex-shrink: 0;
          align-items: center;
          gap: 8px;
          width: 100%;
          min-height: 40px;
          padding: 6px 12px 6px 8px;
          transition: background-color .12s, border-color .12s;
          display: flex;
          box-sizing: border-box;
        }
        .gc-qc-customRow:hover, .gc-qc-customRow:focus-within, .gc-qc-customRowActive {
          background: var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.06));
        }
        .gc-qc-customRow:focus-within, .gc-qc-customRowActive {
          border-color: var(--dsw-alias-border-l2, #44444e);
        }
        .gc-qc-field {
          flex: 1;
          display: grid;
        }
        .gc-qc-fieldInput {
          resize: none;
          color: var(--dsw-alias-label-primary, #f8fafc);
          caret-color: var(--dsw-alias-state-business-primary, #4d6bfe);
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          font: inherit;
          font-size: 13px;
          line-height: 20px;
        }
        .gc-qc-customBlock {
          border: 1px solid var(--dsw-alias-border-l2, #34343a);
          background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,0.03));
          border-radius: 10px;
          margin: 8px 16px;
          padding: 10px 12px;
        }
        .gc-qc-blockInput {
          width: 100%;
          min-height: 60px;
          max-height: 140px;
          resize: none;
          border: none;
          outline: none;
          background: transparent;
          color: var(--dsw-alias-label-primary, #f8fafc);
          font: inherit;
          font-size: 13px;
          line-height: 1.5;
        }
        .gc-qc-footer {
          flex-shrink: 0;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 6px;
          padding: 8px 14px 10px 18px;
          border-top: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06));
          display: flex;
        }
        .gc-qc-pager {
          flex-shrink: 0;
          align-items: center;
          gap: 4px;
          display: flex;
        }
        .gc-qc-progress {
          color: var(--dsw-alias-label-secondary, #cbd5e1);
          white-space: nowrap;
          padding: 0 4px;
          font-size: 13px;
          font-weight: 500;
          line-height: 20px;
        }
        .gc-qc-feedback {
          flex: 1;
          font-size: 12px;
          color: #ef4444;
          text-align: right;
        }
        .gc-qc-footerActions {
          flex-shrink: 0;
          align-items: center;
          gap: 10px;
          display: flex;
        }
        .gc-qc-btn-outline {
          padding: 6px 14px;
          font-size: 13px;
          border-radius: 8px;
          border: 1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.18));
          background: transparent;
          color: var(--dsw-alias-label-secondary, #cbd5e1);
          cursor: pointer;
          transition: all .12s;
        }
        .gc-qc-btn-outline:hover {
          background: var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.08));
          color: var(--dsw-alias-label-primary, #f8fafc);
        }
        .gc-qc-btn-primary {
          padding: 6px 18px;
          font-size: 13px;
          font-weight: 500;
          border-radius: 8px;
          border: none;
          background: var(--dsw-alias-state-business-primary, #4d6bfe);
          color: white;
          cursor: pointer;
          transition: all .12s;
        }
        .gc-qc-btn-primary:hover:not(:disabled) {
          background: #3b5bdb;
        }
        .gc-qc-btn-primary:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>
      <section className={`gc-qc-card ${minimized ? 'gc-qc-card-minimized' : ''}`} aria-label={prompt.question}>
        <header className="gc-qc-header">
          <div className="gc-qc-headingBlock">
            <div className="gc-qc-eyebrow">
              <span>🎯 </span>
              {prompt.header || tx(locale, '方案抉择 / 请您拍板', 'Decision Required / Awaiting Your Choice')}
              {prompt.askedByRoleId && <span style={{ marginLeft: 6, opacity: 0.8 }}>· @{prompt.askedByRoleId}</span>}
            </div>
            <h2 className="gc-qc-title">{prompt.question}</h2>
          </div>
          <div className="gc-qc-headerActions">
            <button
              type="button"
              className="gc-qc-iconButton"
              aria-label={minimized ? tx(locale, '展开', 'Expand') : tx(locale, '收起', 'Minimize')}
              title={minimized ? tx(locale, '展开', 'Expand') : tx(locale, '收起', 'Minimize')}
              onClick={() => setMinimized(!minimized)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: minimized ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              className="gc-qc-iconButton"
              aria-label={tx(locale, '取消 / 关闭', 'Dismiss')}
              title={tx(locale, '取消 / 关闭', 'Dismiss')}
              onClick={onDismiss}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {!minimized && (
          <div className="gc-qc-body">
            {prompt.detail && (
              <div className="gc-qc-detail">
                {prompt.detail}
              </div>
            )}
            {hasOptions ? (
              <div className="gc-qc-options" role={prompt.multiSelect ? "group" : "radiogroup"}>
                {prompt.options!.map((opt, idx) => {
                  const isSelected = selectedKey === opt.key && !customText.trim()
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      className={`gc-qc-option ${isSelected ? 'gc-qc-optionSelected' : ''}`}
                      role={prompt.multiSelect ? "checkbox" : "radio"}
                      aria-checked={isSelected}
                      onClick={() => {
                        setSelectedKey(opt.key)
                        setCustomText('')
                        setError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSubmit(opt.key, '')
                        }
                      }}
                    >
                      <span className={`gc-qc-number ${isSelected ? 'gc-qc-numberSelected' : ''}`}>
                        {idx + 1}
                      </span>
                      <span className="gc-qc-optionCopy">
                        <span className="gc-qc-optionLine">
                          <span className="gc-qc-optionLabel">{opt.label}</span>
                          {opt.isRecommended && (
                            <span className="gc-qc-badge">{tx(locale, '推荐', 'Recommended')}</span>
                          )}
                        </span>
                        {opt.description && (
                          <div className="gc-qc-description">{opt.description}</div>
                        )}
                      </span>
                    </button>
                  )
                })}
                <div className={`gc-qc-customRow ${customText.trim() ? 'gc-qc-customRowActive' : ''}`}>
                  <span className="gc-qc-number" style={{ background: customText.trim() ? 'var(--dsw-alias-state-business-primary, #4d6bfe)' : undefined, color: customText.trim() ? '#fff' : undefined }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </span>
                  <div className="gc-qc-field">
                    <textarea
                      className="gc-qc-fieldInput"
                      rows={1}
                      placeholder={tx(locale, '其他… 输入自定义答案并按回车提交', 'Other… Type a custom answer and press Enter')}
                      value={customText}
                      onChange={(e) => {
                        setCustomText(e.target.value)
                        if (e.target.value) setSelectedKey(null)
                        setError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          if (customText.trim()) {
                            handleSubmit(null, customText.trim())
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="gc-qc-customBlock">
                <textarea
                  autoFocus
                  className="gc-qc-blockInput"
                  placeholder={tx(locale, '请输入您的回答或拍板意见，按 Enter 提交…', 'Type your answer or decision, press Enter to submit…')}
                  value={customText}
                  onChange={(e) => {
                    setCustomText(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (customText.trim()) {
                        handleSubmit(null, customText.trim())
                      }
                    }
                  }}
                />
              </div>
            )}
            <footer className="gc-qc-footer">
              <div className="gc-qc-pager">
                <button type="button" className="gc-qc-iconButton" disabled style={{ opacity: 0.4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <span className="gc-qc-progress">1 / 1</span>
                <button type="button" className="gc-qc-iconButton" disabled style={{ opacity: 0.4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </div>
              <div className="gc-qc-feedback">
                {error}
              </div>
              <div className="gc-qc-footerActions">
                <button
                  type="button"
                  className="gc-qc-btn-outline"
                  onClick={onDismiss}
                >
                  {tx(locale, '跳过', 'Skip')}
                </button>
                <button
                  type="button"
                  className="gc-qc-btn-primary"
                  disabled={sending || (!selectedKey && !customText.trim())}
                  onClick={() => handleSubmit(selectedKey, customText.trim())}
                >
                  {sending ? tx(locale, '提交中…', 'Submitting…') : tx(locale, '提交', 'Submit')}
                </button>
              </div>
            </footer>
          </div>
        )}
      </section>
    </div>
  )
}

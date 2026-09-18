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

/**
 * Split the conventional recommendation suffix without changing the answer value.
 */
function parseRecommendedLabel(label: string) {
  const suffix = /\s*(?:\((?:recommended|推荐)\)|（(?:recommended|推荐)）)\s*$/i
  return suffix.test(label) ? {
    label: label.replace(suffix, '').trim(),
    recommended: true,
  } : {
    label: label.trim(),
    recommended: false,
  }
}

export function GroupChatQuestionComposer({
  prompt,
  locale = 'zh-CN',
  sending = false,
  onDismiss,
  onSubmit,
}: GroupChatQuestionComposerProps) {
  // Determine initial selection
  const initialSelected = prompt.recommendedOptionKey
    ? [prompt.recommendedOptionKey]
    : prompt.options?.[0]?.key
      ? [prompt.options[0].key]
      : []

  const [selectedKeys, setSelectedKeys] = useState<string[]>(initialSelected)
  const [customText, setCustomText] = useState<string>('')
  const [minimized, setMinimized] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const multiSelect = prompt.multiSelect === true
  const options = prompt.options || []
  const hasOptions = options.length > 0

  const handleSelectOption = (optLabel: string, optKey: string) => {
    if (sending) return
    setError(null)
    if (multiSelect) {
      if (selectedKeys.includes(optKey)) {
        setSelectedKeys(selectedKeys.filter(k => k !== optKey))
      } else {
        setSelectedKeys([...selectedKeys, optKey])
      }
    } else {
      setSelectedKeys([optKey])
      setCustomText('')
    }
  }

  const handleSubmit = () => {
    if (sending) return
    const trimmedCustom = customText.trim()
    if (trimmedCustom) {
      onSubmit(trimmedCustom)
      return
    }
    if (selectedKeys.length > 0 && hasOptions) {
      const selectedOpts = options.filter(o => selectedKeys.includes(o.key))
      if (selectedOpts.length > 0) {
        if (selectedOpts.length === 1) {
          const opt = selectedOpts[0]
          onSubmit(locale === 'en-US' ? `I choose: ${opt.label}` : `我拍板选择：${opt.label}`)
        } else {
          const labels = selectedOpts.map(o => o.label).join('、')
          onSubmit(locale === 'en-US' ? `I choose: ${labels}` : `我拍板选择：${labels}`)
        }
        return
      }
    }
    setError(tx(locale, '请选择一个选项或填写自定义答案。', 'Please select an option or enter a custom answer.'))
  }

  const eyebrowText = prompt.header || tx(locale, '方案抉择', 'Decision Required')

  return (
    <div
      className="Mbwy4a_frame gc-question-composer-frame gc-composer"
      data-dsh-gc-question-composer="true"
      data-dsh-gc-decision-card="true"
    >
      <style>{`
        .Mbwy4a_frame {
          padding: 6px calc(var(--dsh-composer-side-clearance, 0px) + 16px) 10px;
          justify-content: center;
          display: flex;
          width: 100%;
          box-sizing: border-box;
        }
        .Mbwy4a_card {
          width: 100%;
          max-width: var(--dsh-chat-content-width, 960px);
          --dsw-elevation-stroke-color: var(--dsw-alias-border-l2-darkmode-thin, rgba(255,255,255,0.08));
          background: var(--dsw-specific-input-major, #18181c);
          max-height: min(60vh, 520px);
          box-shadow: var(--dsw-elevation-panel, 0 8px 30px rgba(0,0,0,0.35));
          color: var(--dsw-alias-label-primary, #f8fafc);
          --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2, rgba(255,255,255,0.15));
          --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2, rgba(255,255,255,0.25));
          border: 0;
          border-radius: 20px;
          flex-direction: column;
          padding: 0 0 10px;
          display: flex;
          overflow: hidden;
          box-sizing: border-box;
        }
        .Mbwy4a_card, .Mbwy4a_card * {
          box-sizing: border-box;
        }
        .Mbwy4a_cardMinimized {
          max-height: none;
        }
        .Mbwy4a_cardMinimized .Mbwy4a_header {
          padding-bottom: 14px;
        }
        .Mbwy4a_headerActions {
          flex-shrink: 0;
          align-items: center;
          gap: 4px;
          display: flex;
        }
        .Mbwy4a_header {
          flex-shrink: 0;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding: 20px 16px 0 24px;
          display: flex;
        }
        .Mbwy4a_headingBlock {
          min-width: 0;
        }
        .Mbwy4a_eyebrow {
          color: var(--dsw-alias-label-tertiary, #94a3b8);
          margin-bottom: 5px;
          font-size: 11px;
          line-height: 16px;
        }
        .Mbwy4a_title {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          line-height: 22px;
          color: var(--dsw-alias-label-primary, #f8fafc);
        }
        .Mbwy4a_detail {
          margin: 0 24px 8px;
          font-size: 13px;
          line-height: 20px;
          color: var(--dsw-alias-label-secondary, #cbd5e1);
        }
        .Mbwy4a_footerActions {
          flex-shrink: 0;
          align-items: center;
          gap: 12px;
          display: flex;
        }
        .Mbwy4a_pager {
          flex-shrink: 0;
          align-items: center;
          gap: 6px;
          display: flex;
        }
        .Mbwy4a_progress {
          color: var(--dsw-alias-label-secondary, #94a3b8);
          white-space: nowrap;
          word-spacing: -2px;
          padding: 0 4px;
          font-size: 14px;
          font-weight: 500;
          line-height: 24px;
        }
        .Mbwy4a_iconButton {
          width: 24px;
          height: 24px;
          color: var(--dsw-alias-label-tertiary, #94a3b8);
          cursor: pointer;
          background: 0 0;
          border: none;
          border-radius: 999px;
          place-items: center;
          padding: 0;
          display: grid;
        }
        .Mbwy4a_iconButton:hover:not(:disabled) {
          background: var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.06));
          color: var(--dsw-alias-label-primary, #f8fafc);
        }
        .Mbwy4a_iconButton:disabled {
          color: var(--dsw-alias-label-dimmed, rgba(255,255,255,0.25));
          cursor: default;
        }
        .Mbwy4a_body {
          overscroll-behavior: contain;
          flex-direction: column;
          flex: auto;
          min-height: 0;
          display: flex;
          overflow-y: auto;
        }
        .Mbwy4a_options {
          flex-direction: column;
          gap: 1px;
          margin: 8px 0 0;
          padding: 4px 12px;
          display: flex;
        }
        .Mbwy4a_option {
          width: 100%;
          min-height: 40px;
          color: inherit;
          text-align: left;
          cursor: pointer;
          background: 0 0;
          border: 1px solid transparent;
          border-radius: 12px;
          flex-shrink: 0;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 12px 8px 8px;
          transition: background-color .12s, border-color .12s;
          display: flex;
          font-family: inherit;
        }
        .Mbwy4a_option:hover:not(:disabled), .Mbwy4a_optionSelected {
          background: var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.06));
        }
        .Mbwy4a_optionSelected {
          border-color: var(--dsw-alias-border-l2, rgba(255,255,255,0.18));
        }
        .Mbwy4a_option:disabled {
          cursor: default;
        }
        .Mbwy4a_number {
          background: var(--dsw-alias-bg-overlay, rgba(255,255,255,0.08));
          width: 20px;
          height: 20px;
          color: var(--dsw-alias-label-secondary, #cbd5e1);
          border-radius: 6px;
          flex: 0 0 20px;
          place-items: center;
          margin-top: 2px;
          font-size: 12px;
          font-weight: 500;
          line-height: 18px;
          display: grid;
        }
        .Mbwy4a_checkbox {
          flex: 0 0 20px;
          place-items: center;
          width: 20px;
          height: 20px;
          margin-top: 2px;
          display: grid;
        }
        .Mbwy4a_checkbox:before {
          content: "";
          border: .5px solid var(--dsw-alias-border-l4, rgba(255,255,255,0.25));
          border-radius: 4px;
          grid-area: 1/1;
          width: 14px;
          height: 14px;
          transition: background-color .12s, border-color .12s;
        }
        .Mbwy4a_checkbox > svg {
          grid-area: 1/1;
        }
        .Mbwy4a_checkboxChecked {
          color: var(--dsw-alias-label-primary-foreground, #ffffff);
        }
        .Mbwy4a_checkboxChecked:before {
          border-color: var(--dsw-alias-label-primary, #ffffff);
          background: var(--dsw-alias-label-primary, #ffffff);
        }
        .Mbwy4a_optionCopy {
          flex: 1;
          min-width: 0;
        }
        .Mbwy4a_optionLine {
          flex-wrap: wrap;
          align-items: baseline;
          gap: 2px 6px;
          display: flex;
        }
        .Mbwy4a_optionLabel {
          font-size: 14px;
          font-weight: 500;
          line-height: 24px;
          color: var(--dsw-alias-label-primary, #f8fafc);
        }
        .Mbwy4a_badge {
          background: var(--dsw-specific-sidebar-nav-item-active-accent, rgba(16,185,129,0.15));
          color: var(--dsw-alias-button-info-fill, #10b981);
          border-radius: 6px;
          padding: 0 4px;
          font-size: 11px;
          font-weight: 600;
          line-height: 18px;
        }
        .Mbwy4a_description {
          color: var(--dsw-alias-label-tertiary, #94a3b8);
          font-size: 14px;
          font-weight: 400;
          line-height: 24px;
        }
        .Mbwy4a_customRow {
          border: 1px solid transparent;
          border-radius: 12px;
          flex-shrink: 0;
          align-items: flex-start;
          gap: 8px;
          width: 100%;
          min-height: 40px;
          padding: 8px 12px 8px 8px;
          transition: background-color .12s, border-color .12s;
          display: flex;
        }
        .Mbwy4a_customRow:hover, .Mbwy4a_customRow:focus-within, .Mbwy4a_customRowActive {
          background: var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.06));
        }
        .Mbwy4a_customRow:focus-within, .Mbwy4a_customRowActive {
          border-color: var(--dsw-alias-border-l2, rgba(255,255,255,0.18));
        }
        .Mbwy4a_field {
          --dsh-answer-field-padding: 0;
          min-width: 0;
          display: grid;
        }
        .Mbwy4a_field > * {
          min-width: 0;
          padding: var(--dsh-answer-field-padding);
          font: inherit;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
          grid-area: 1/1;
          font-size: 14px;
          line-height: 24px;
        }
        .Mbwy4a_fieldMirror {
          box-sizing: content-box;
          visibility: hidden;
          max-height: 144px;
          overflow: hidden;
        }
        .Mbwy4a_fieldInput {
          resize: none;
          color: var(--dsw-alias-label-primary, #f8fafc);
          caret-color: var(--dsw-alias-state-business-primary, #3b82f6);
          background: 0 0;
          border: none;
          outline: none;
          overflow-y: auto;
          font-family: inherit;
        }
        .Mbwy4a_fieldInput::placeholder {
          color: var(--dsw-alias-label-caption, #64748b);
        }
        .Mbwy4a_customInline {
          flex: 1;
        }
        .Mbwy4a_footer {
          flex-shrink: 0;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
          padding: 0 10px 0 18px;
          display: flex;
        }
        .Mbwy4a_feedback {
          min-height: 16px;
          color: var(--dsw-alias-state-error-primary, #ef4444);
          text-align: right;
          flex: 1;
          font-size: 11px;
          line-height: 16px;
        }
        ._button_cfgyt_4 {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border: none;
          border-radius: 18px;
          cursor: pointer;
          font-size: 14px;
          line-height: 22px;
          color: var(--dsw-alias-label-primary, #f8fafc);
          background: transparent;
          padding: 0 14px;
          font-family: inherit;
          font-weight: 500;
          transition: background-color .12s, border-color .12s, opacity .12s;
        }
        ._md_cfgyt_24 {
          height: 36px;
        }
        ._outline_cfgyt_56 {
          border: .5px solid var(--dsw-alias-border-l3, rgba(255,255,255,0.18));
          background: transparent;
          color: var(--dsw-alias-label-primary, #f8fafc);
        }
        ._outline_cfgyt_56:hover:not(:disabled) {
          background: var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.06));
        }
        ._primary_cfgyt_38 {
          background: var(--dsw-alias-button-primary-fill, #ffffff);
          color: var(--dsw-alias-label-primary-foreground, #000000);
        }
        ._primary_cfgyt_38:hover:not(:disabled) {
          opacity: 0.9;
        }
        ._button_cfgyt_4:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        @media (max-width: 720px) {
          .Mbwy4a_card { border-radius: 16px; }
          .Mbwy4a_header { padding: 10px 12px 0 18px; }
          .Mbwy4a_options { padding: 4px 8px; }
          .Mbwy4a_title { font-size: 15px; line-height: 21px; }
          .Mbwy4a_option, .Mbwy4a_customRow { padding: 8px 6px; }
          .Mbwy4a_footer { align-items: flex-end; padding: 0 10px; }
          .Mbwy4a_footerActions { flex-shrink: 0; }
        }
      `}</style>

      <div className={`Mbwy4a_card ${minimized ? 'Mbwy4a_cardMinimized' : ''}`}>
        <header className="Mbwy4a_header">
          <div className="Mbwy4a_headingBlock">
            {eyebrowText && (
              <div className="Mbwy4a_eyebrow">{eyebrowText}</div>
            )}
            <h2 className="Mbwy4a_title">{prompt.question}</h2>
          </div>
          <div className="Mbwy4a_headerActions">
            <button
              type="button"
              className="Mbwy4a_iconButton"
              aria-label={minimized ? tx(locale, '展开问题卡片', 'Expand the question card') : tx(locale, '收起问题卡片', 'Collapse the question card')}
              title={minimized ? tx(locale, '展开问题卡片', 'Expand the question card') : tx(locale, '收起问题卡片', 'Collapse the question card')}
              disabled={sending}
              onClick={() => setMinimized(curr => !curr)}
            >
              {minimized ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <button
              type="button"
              className="Mbwy4a_iconButton"
              aria-label={tx(locale, '放弃整组问题', 'Dismiss all questions')}
              title={tx(locale, '放弃整组问题', 'Dismiss all questions')}
              disabled={sending}
              onClick={onDismiss}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </header>

        {!minimized && (
          <>
            <div className="Mbwy4a_body" data-question-scroll="true">
              {prompt.detail && (
                <div className="Mbwy4a_detail">
                  {prompt.detail}
                </div>
              )}

              <div
                className="Mbwy4a_options"
                role={multiSelect ? 'group' : 'radiogroup'}
              >
                {options.map((opt, idx) => {
                  const selected = selectedKeys.includes(opt.key)
                  const display = parseRecommendedLabel(opt.label)
                  return (
                    <button
                      key={opt.key || idx}
                      type="button"
                      className={`Mbwy4a_option ${selected && !multiSelect ? 'Mbwy4a_optionSelected' : ''}`}
                      role={multiSelect ? 'checkbox' : 'radio'}
                      aria-checked={selected}
                      aria-label={display.label}
                      disabled={sending}
                      onClick={() => handleSelectOption(opt.label, opt.key)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSubmit()
                        }
                      }}
                    >
                      {multiSelect ? (
                        <span
                          className={`Mbwy4a_checkbox ${selected ? 'Mbwy4a_checkboxChecked' : ''}`}
                          aria-hidden="true"
                        >
                          {selected && (
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                              <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                      ) : (
                        <span className="Mbwy4a_number">{idx + 1}</span>
                      )}
                      <span className="Mbwy4a_optionCopy">
                        <span className="Mbwy4a_optionLine">
                          <span className="Mbwy4a_optionLabel">{display.label}</span>
                          {display.recommended && (
                            <span className="Mbwy4a_badge">{tx(locale, '推荐', 'Recommended')}</span>
                          )}
                          {opt.description && (
                            <span className="Mbwy4a_description">{opt.description}</span>
                          )}
                        </span>
                      </span>
                    </button>
                  )
                })}

                {/* Inline custom answer row — official layout */}
                <div className={`Mbwy4a_customRow ${customText.trim() !== '' ? 'Mbwy4a_customRowActive' : ''}`}>
                  {multiSelect ? (
                    <span
                      className={`Mbwy4a_checkbox ${customText.trim() !== '' ? 'Mbwy4a_checkboxChecked' : ''}`}
                      aria-hidden="true"
                    >
                      {customText.trim() !== '' && (
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  ) : (
                    <span className="Mbwy4a_number">{(options.length) + 1}</span>
                  )}
                  <div className="Mbwy4a_field Mbwy4a_customInline">
                    <div aria-hidden="true" className="Mbwy4a_fieldMirror">
                      {`${customText}\n`}
                    </div>
                    <textarea
                      className="Mbwy4a_fieldInput"
                      value={customText}
                      disabled={sending}
                      rows={1}
                      placeholder={hasOptions ? tx(locale, '其他… 输入你的自定义答案', 'Other… Type your custom answer') : tx(locale, '输入你的答案', 'Type your answer')}
                      onChange={e => {
                        setCustomText(e.target.value)
                        if (e.target.value && !multiSelect) {
                          setSelectedKeys([])
                        }
                        setError(null)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault()
                          handleSubmit()
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <footer className="Mbwy4a_footer">
              <div className="Mbwy4a_pager">
                <button type="button" className="Mbwy4a_iconButton" disabled>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <span className="Mbwy4a_progress">1 / 1</span>
                <button type="button" className="Mbwy4a_iconButton" disabled>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              <div className="Mbwy4a_feedback" role="status">
                {error}
              </div>

              <div className="Mbwy4a_footerActions">
                <button
                  type="button"
                  className="_button_cfgyt_4 _md_cfgyt_24 _outline_cfgyt_56 dsw-button dsw-button--outline"
                  disabled={sending}
                  onClick={onDismiss}
                >
                  {tx(locale, '跳过本题', 'Skip this question')}
                </button>
                <button
                  type="button"
                  className="_button_cfgyt_4 _md_cfgyt_24 _primary_cfgyt_38 dsw-button dsw-button--primary"
                  disabled={sending || (!selectedKeys.length && !customText.trim())}
                  onClick={handleSubmit}
                >
                  {sending ? tx(locale, '提交中…', 'Submitting…') : tx(locale, '提交', 'Submit')}
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}

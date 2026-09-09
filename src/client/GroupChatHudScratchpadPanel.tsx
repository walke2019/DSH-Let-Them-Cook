import {hudGhostButtonStyle, hudPanelStackStyle, hudPrimaryButtonStyle, hudScrollableTextStyle, hudTextAreaStyle, hudTokens} from './group-chat-hud-styles.js'
import {detectGroupChatLocale, tx, type GroupChatLocale} from './i18n.js'

interface GroupChatHudScratchpadPanelProps {
  scratchpadDraft: string
  isEditingScratchpad: boolean
  onScratchpadDraftChange: (value: string) => void
  onEditScratchpad: () => void
  onSaveScratchpad: () => void
  locale?: GroupChatLocale
}

export function GroupChatHudScratchpadPanel({
  scratchpadDraft,
  isEditingScratchpad,
  onScratchpadDraftChange,
  onEditScratchpad,
  onSaveScratchpad,
  locale = detectGroupChatLocale(),
}: GroupChatHudScratchpadPanelProps) {
  return (
    <div data-dsh-gc-scratchpad-panel style={{ ...hudPanelStackStyle, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ color: hudTokens.labelSecondary, fontSize: '11px' }}>
          {tx(locale,'团队共识备忘录 (Markdown)','Team consensus notes (Markdown)')}
        </span>
        {!isEditingScratchpad ? (
          <button type="button" onClick={onEditScratchpad} style={hudGhostButtonStyle}>
            ✏️ {tx(locale,'编辑','Edit')}
          </button>
        ) : (
          <button type="button" onClick={onSaveScratchpad} style={hudPrimaryButtonStyle}>
            {tx(locale,'保存','Save')}
          </button>
        )}
      </div>

      {isEditingScratchpad ? (
        <textarea
          value={scratchpadDraft}
          onChange={e => onScratchpadDraftChange(e.target.value)}
          style={{ ...hudTextAreaStyle, flex: 1, minHeight: '260px' }}
        />
      ) : (
        <div style={hudScrollableTextStyle({ flex: 1, minHeight: '260px' })}>
          {scratchpadDraft || tx(locale,'（暂无黑板内容，指挥官与文案写手可随时写入技术决策）','(No blackboard notes yet. Commander and writer can capture technical decisions here.)')}
        </div>
      )}
    </div>
  )
}


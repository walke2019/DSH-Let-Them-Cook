import React, {useEffect} from 'react'
import {GroupChatPanel} from './GroupChatPanel.js'

/**
 * Safe conversation.view adapter with prepare(), mounted in dock mode to avoid official chat regressions.
 */
export function GroupChatConversationTab() {
  useEffect(() => {
    document.body.setAttribute('data-dsh-group-chat-tab-active', 'true')
    return () => document.body.removeAttribute('data-dsh-group-chat-tab-active')
  }, [])
  return <div className="gc-conversation-tab" data-dsh-group-chat-conversation-tab>
    <style>{`
      .gc-conversation-tab{height:100%;min-height:0;width:100%;display:flex;flex-direction:column;background:transparent;overflow:hidden;}
      .gc-conversation-tab [data-dsh-group-chat-panel]{height:100%;min-height:0;}
    `}</style>
    <GroupChatPanel mode="dock" />
  </div>
}

export const GroupChatConversationView = Object.assign(GroupChatConversationTab, {
  id: 'dsh-group-chat',
  label: 'Agent 群聊',
  prepare: () => ({})
})

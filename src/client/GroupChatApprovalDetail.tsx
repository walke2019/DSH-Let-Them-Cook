import React, {useEffect, useState} from 'react'
import {getActiveSessionId, resolveCurrentGroupChatRoomId} from './current-room.js'
import type {ApprovalTransaction} from './group-chat-hud-types.js'
import {detectGroupChatLocale, tx} from './i18n.js'

export interface GroupChatApprovalDetailProps {
  callId?: string
}

export function GroupChatApprovalDetail(props: GroupChatApprovalDetailProps) {
  const [transactions, setTransactions] = useState<ApprovalTransaction[]>([])
  const locale = detectGroupChatLocale()

  useEffect(() => {
    let cancelled = false
    const sessionId = getActiveSessionId() || ''
    const roomId = resolveCurrentGroupChatRoomId(sessionId)
    if (!sessionId || !roomId) return
    void fetch(`/dsh-group-chat/api/room?id=${encodeURIComponent(roomId)}&ensure=1&sessionId=${encodeURIComponent(sessionId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelled || !data?.room) return
        setTransactions((data.room.approvalTransactions || []).filter((item: ApprovalTransaction) => item.status === 'pending'))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [props.callId])

  return (
    <div data-dsh-group-chat-approval-detail style={{display:'grid',gap:8,padding:'8px 10px',border:'1px solid rgba(234,179,8,0.28)',borderRadius:10,background:'rgba(234,179,8,0.08)',color:'var(--dsw-alias-label-primary,#f8fafc)'}}>
      <div style={{fontSize:12,fontWeight:700}}>{tx(locale,'开整天团事务详情','Let Them Cook transaction detail')}</div>
      {props.callId && <div style={{fontSize:11,opacity:.7}}>callId: <code>{props.callId}</code></div>}
      {transactions.length ? transactions.slice(0,3).map(txn => (
        <div key={txn.transactionId} style={{display:'grid',gap:4,fontSize:11,lineHeight:1.45}}>
          <strong>{txn.title}</strong>
          <span>{txn.summary}</span>
          {!!txn.willChange?.length && <span>{tx(locale,'将改动：','Will change:')} {txn.willChange.join('；')}</span>}
          {!!txn.rollbackPlan?.length && <span>{tx(locale,'回滚：','Rollback:')} {txn.rollbackPlan.join('；')}</span>}
        </div>
      )) : <div style={{fontSize:11,opacity:.75}}>{tx(locale,'当前会话没有待处理的开整事务。','No pending Let Them Cook transaction in this session.')}</div>}
    </div>
  )
}

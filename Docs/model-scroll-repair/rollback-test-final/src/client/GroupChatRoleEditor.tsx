import React, {useState,useRef} from 'react'
import type {AgentProfile} from './group-chat-view-types.js'
export function GroupChatRoleEditor({editingAgent,roomId,onClose,onSaved}:{editingAgent:AgentProfile;roomId:string;onClose:()=>void;onSaved:()=>void}) {
  const [agentForm, setAgentForm] = useState({name:editingAgent.name,avatar:editingAgent.avatar,title:editingAgent.title||'',roleDescription:editingAgent.roleDescription,systemPrompt:editingAgent.systemPrompt||'',provider:editingAgent.llmConfig?.provider||'',model:editingAgent.llmConfig?.model||'',canWriteScratchpad:editingAgent.permissions?.canWriteScratchpad??false,canApproveWorkflow:editingAgent.permissions?.canApproveWorkflow??false})
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 处理本地头像上传
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result
      if (typeof result === 'string') {
        setAgentForm(prev => ({ ...prev, avatar: result }))
      }
    }
    reader.readAsDataURL(file)
  }

  // 保存角色编辑
  const handleSaveAgent = async () => {
    if (!editingAgent) return
    try {
      const res = await fetch('/dsh-group-chat/api/agent/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomId,
          agentId: editingAgent.id,
          name: agentForm.name,
          avatar: agentForm.avatar,
          title: agentForm.title,
          roleDescription: agentForm.roleDescription,
          systemPrompt: agentForm.systemPrompt,
          llmConfig: {
            provider: agentForm.provider,
            model: agentForm.model,
          },
          permissions: {
            canWriteScratchpad: agentForm.canWriteScratchpad,
            canApproveWorkflow: agentForm.canApproveWorkflow,
          },
        }),
      })
      if (res.ok) {
        onClose()
        onSaved()
      }
    } catch (err) {
      console.error('Save agent failed:', err)
    }
  }

  return <><input type="file" ref={fileInputRef} onChange={handleAvatarFileUpload} accept="image/*" style={{display:'none'}} />
      {/* 角色编辑与头像图片上传弹窗 */}
      {true && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            width: '520px',
            backgroundColor: 'var(--dsw-alias-bg-layer-1, #151518)',
            border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.12))',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'var(--dsw-shadow-lv3, 0 12px 32px rgba(0,0,0,0.5))',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>编辑特遣角色属性 ({editingAgent.id})</span>
              <button
                onClick={() => onClose()}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* 头像修改与图片上传 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                title="点击上传本地头像图片"
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: editingAgent.color || '#4d6bfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  fontSize: '24px',
                  border: '2px dashed rgba(255,255,255,0.3)',
                }}
              >
                {agentForm.avatar.startsWith('data:') ? (
                  <img src={agentForm.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  agentForm.avatar
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    backgroundColor: 'var(--dsw-alias-bg-layer-2, #1b1b1f)',
                    border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.12))',
                    color: 'var(--dsw-alias-label-primary, #fff)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  📁 上传本地头像图片
                </button>
                <div style={{ fontSize: '10px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', marginTop: '4px' }}>
                  支持 PNG、JPG、WebP 格式，将自动保存为角色自定义头像
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--dsw-alias-label-secondary, #cbd5e1)' }}>角色显示姓名</label>
                <input
                  type="text"
                  value={agentForm.name}
                  onChange={e => setAgentForm({ ...agentForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: 'var(--dsw-alias-bg-base, #0d0d11)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '12px',
                    marginTop: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--dsw-alias-label-secondary, #cbd5e1)' }}>角色头衔/职称</label>
                <input
                  type="text"
                  value={agentForm.title}
                  onChange={e => setAgentForm({ ...agentForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: 'var(--dsw-alias-bg-base, #0d0d11)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '12px',
                    marginTop: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--dsw-alias-label-secondary, #cbd5e1)' }}>专长职责描述</label>
              <textarea
                value={agentForm.roleDescription}
                onChange={e => setAgentForm({ ...agentForm, roleDescription: e.target.value })}
                style={{
                  width: '100%',
                  height: '50px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: 'var(--dsw-alias-bg-base, #0d0d11)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '11px',
                  marginTop: '4px',
                  resize: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--dsw-alias-label-secondary, #cbd5e1)' }}>角色系统设定提示词 (System Prompt)</label>
              <textarea
                value={agentForm.systemPrompt}
                onChange={e => setAgentForm({ ...agentForm, systemPrompt: e.target.value })}
                style={{
                  width: '100%',
                  height: '80px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: 'var(--dsw-alias-bg-base, #0d0d11)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '11px',
                  marginTop: '4px',
                  resize: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 权限设定 */}
            <div style={{ display: 'flex', gap: '20px', padding: '6px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={agentForm.canWriteScratchpad}
                  onChange={e => setAgentForm({ ...agentForm, canWriteScratchpad: e.target.checked })}
                />
                <span>允许编辑共享黑板 (Write Scratchpad)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={agentForm.canApproveWorkflow}
                  onChange={e => setAgentForm({ ...agentForm, canApproveWorkflow: e.target.checked })}
                />
                <span>具备工作流审核审批特权 (Approve Workflow)</span>
              </label>
            </div>

            {/* 底部按钮 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => onClose()}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveAgent}
                style={{
                  backgroundColor: 'var(--dsw-alias-state-business-primary, #4d6bfe)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
</>
}

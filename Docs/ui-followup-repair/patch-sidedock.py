from pathlib import Path
p=Path('src/client/GroupChatSideDock.tsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace(" * 定位：区别于全屏主推演区，侧栏仅提供轻量、高密度的【拓扑监控 + 共享黑板 + 成员账本 + 快速指令】，绝不产生功能重叠！", " * 定位：区别于全屏主对话输入区，侧栏仅提供轻量、高密度的【拓扑监控 + 共享黑板 + 成员账本】，不再重复聊天派发入口。")
s=s.replace("  const [quickCmd, setQuickCmd] = useState('')\n  const [isSending, setIsSending] = useState(false)\n", "")
start=s.find('  // 快速广播指令')
end=s.find('  // 保存共享黑板', start)
if start!=-1 and end!=-1:
    s=s[:start]+s[end:]
start=s.find('        {/* 副屏底部：快捷广播指令 */}')
if start!=-1:
    end=s.find('        </div>\n      </div>\n    </>\n  )', start)
    if end!=-1:
        # skip the bottom quick div only, keep closing outer sidebar div
        s=s[:start]+'      </div>\n    </>\n  )'+s[end+len('        </div>\n      </div>\n    </>\n  )'):]
s=s.replace("                    <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)' }}>\n                      <div>{stat?.callCount || 0} 轮</div>\n                      <div>{stat?.totalTokens || 0} T</div>\n                      <button type=\"button\" onClick={()=>setEditingAgent(member)} aria-label={`编辑${member.name}`}>编辑</button>\n                    </div>", """                    <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--dsw-alias-label-tertiary, #94a3b8)', display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap' }}>
                      <span>{stat?.callCount || 0} 轮</span>
                      <span>{stat?.totalTokens || 0} T</span>
                      <button type=\"button\" onClick={()=>setEditingAgent(member)} aria-label={`编辑${member.name}`}>编辑</button>
                    </div>""")
p.write_text(s,encoding='utf-8')

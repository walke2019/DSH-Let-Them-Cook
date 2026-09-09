from pathlib import Path
# room-manager add methods
p=Path('src/engine/room-manager.ts')
s=p.read_text(encoding='utf-8')
s=s.replace("    const themeMap = THEME_CATALOG[theme]\n    if (!themeMap) return room", "    const themeMap = THEME_CATALOG[theme as keyof typeof THEME_CATALOG]\n    if (!themeMap) return room")
marker="  /**\n   * 自定义更新指定角色档案"
method=r'''  public applyGeneratedTheme(roomId: string, members: AgentProfile[], themeKey: PersonaThemeKey = `custom_${Date.now()}` as PersonaThemeKey): GroupChatRoom | undefined {
    const room = this.rooms.get(roomId)
    if (!room) return undefined
    const byId = new Map(members.map(member => [member.id, member]))
    room.members = room.members.map(member => {
      const next = byId.get(member.id)
      return next ? structuredClone({...member, ...next, llmConfig: member.llmConfig, resiliencePolicy: member.resiliencePolicy, permissions: member.permissions}) : member
    })
    room.activeTheme = themeKey
    room.scratchpad = `${room.scratchpad}\n- 主题角色已切换为 AI 生成草案：${new Date().toLocaleString()}，可在「角色与账本」逐个编辑微调。`
    this.saveRoom(room)
    return room
  }

'''
s=s.replace(marker, method+marker)
p.write_text(s,encoding='utf-8')
# index imports + endpoints
p=Path('src/index.ts')
s=p.read_text(encoding='utf-8')
if "theme-factory" not in s:
    s=s.replace("import { registerGroupChatTools } from './tools/index.js'", "import { registerGroupChatTools } from './tools/index.js'\nimport { createThemeDraft } from './engine/theme-factory.js'")
endpoint=r'''
        if (method === 'POST' && pathname === '/theme/draft') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const room = roomManager.getRoom(roomId)
          if (!room) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Room not found' })); return }
          const brief = String(body.brief || '').trim()
          const members = createThemeDraft(brief, room.members)
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: true, brief, members }))
          return
        }

        if (method === 'POST' && pathname === '/theme/apply-draft') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const room = roomManager.getRoom(roomId)
          if (!room) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Room not found' })); return }
          const members = Array.isArray(body.members) ? body.members : createThemeDraft(String(body.brief || ''), room.members)
          const updated = roomManager.applyGeneratedTheme(roomId, members, `custom_${Date.now()}` as PersonaThemeKey)
          if (updated) workspaceStore.saveRoom(updated)
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: !!updated, room: updated }))
          return
        }

'''
s=s.replace("        // 5. 切换名号主题接口", endpoint+"        // 5. 切换名号主题接口")
p.write_text(s,encoding='utf-8')

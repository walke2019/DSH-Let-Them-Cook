async (page) => {
  const wait = ms => page.waitForTimeout(ms)
  const errors = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push(err.message || String(err)))

  const clickText = async (...texts) => {
    for (const text of texts) {
      try {
        const loc = page.getByText(text, {exact: false}).first()
        if (await loc.isVisible({timeout: 700})) {
          await loc.click({timeout: 1500})
          await wait(500)
          return text
        }
      } catch {}
      const clicked = await page.evaluate((needle) => {
        const visible = el => {
          const r = el.getBoundingClientRect(); const st = getComputedStyle(el)
          return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden'
        }
        const hit = [...document.querySelectorAll('button,a,span,div')]
          .filter(el => visible(el) && (el.textContent || '').trim().includes(needle))
          .sort((a,b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0]
        if (!hit) return false
        hit.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
        return true
      }, text).catch(() => false)
      if (clicked) { await wait(550); return text }
    }
    return ''
  }

  const openGroupChatTask = async () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      if (await clickSidebarConversation('DSH多Agent群聊插件方案', '规范开发与参考项目调研')) return true
      await clickText('ha')
      await wait(500)
    }
    await clickText('展开其余')
    if (await clickSidebarConversation('DSH多Agent群聊插件方案', '规范开发与参考项目调研')) return true
    await clickText('dsh-group-chat')
    if (await clickSidebarConversation('DSH多Agent群聊插件方案', '规范开发与参考项目调研')) return true
    await clickText('展开其余')
    return await clickSidebarConversation('DSH多Agent群聊插件方案', '规范开发与参考项目调研') !== ''
  }
  const clickSidebarConversation = async (...texts) => {
    for (const text of texts) {
      const clicked = await page.evaluate((needle) => {
        const visible = el => {
          const r = el.getBoundingClientRect(); const st = getComputedStyle(el)
          return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden'
        }
        const candidates = [...document.querySelectorAll('button,a,span,div')]
          .filter(el => visible(el) && (el.textContent || '').trim().includes(needle))
          .map(el => ({el, r: el.getBoundingClientRect(), text: (el.textContent || '').trim()}))
          .filter(x => x.r.left < 330 && x.r.top > 60 && x.r.height < 90 && x.text.length <= 80)
          .sort((a,b) => ((a.el.getAttribute('role') === 'treeitem' ? 0 : 1) - (b.el.getAttribute('role') === 'treeitem' ? 0 : 1)) || Math.abs(a.r.left - 40) - Math.abs(b.r.left - 40) || a.r.top - b.r.top)
        const hit = candidates[0]?.el
        if (!hit) return false
        hit.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
        return true
      }, text).catch(() => false)
      if (clicked) { await wait(900); return text }
    }
    return ''
  }

  const snapshot = () => page.evaluate(() => {
    const visibleRect = el => {
      if (!el) return false
      const r = el.getBoundingClientRect(); const st = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden'
    }
    const text = document.body.innerText || ''
    const hud = document.querySelector('.dsh-gc-sidebar-host')
    const gcTab = document.querySelector('.gc-conversation-tab')
    const composer = [...document.querySelectorAll('textarea,[contenteditable="true"]')].some(visibleRect)
    return {
      hasHud: !!hud,
      hudVisible: visibleRect(hud),
      hasGcConversationTab: !!gcTab,
      gcTabVisible: visibleRect(gcTab),
      hasComposer: composer,
      hasAgentLabel: text.includes('Agent 群聊'),
      hasOfficialDialogLabel: text.includes('对话'),
      bodyFlags: {
        tabActive: document.body.getAttribute('data-dsh-group-chat-tab-active'),
        hudOpen: document.body.getAttribute('data-dsh-group-chat-hud-docked-open'),
      },
    }
  })

  await page.goto('http://127.0.0.1:3080/', {waitUntil: 'domcontentloaded', timeout: 20000})
  await wait(1400)
  await openGroupChatTask()
  for (let i = 0; i < 12; i++) { if ((await snapshot()).hasAgentLabel) break; await wait(500) }
  await clickText('Agent 群聊')
  await wait(800)
  const beforeReload = await snapshot()

  await page.reload({waitUntil: 'domcontentloaded', timeout: 20000})
  await wait(1600)
  await clickText('新会话')
  await wait(900)
  const afterReloadNewChat = await snapshot()

  await openGroupChatTask()
  for (let i = 0; i < 12; i++) { if ((await snapshot()).hasAgentLabel) break; await wait(500) }
  await clickText('Agent 群聊')
  await wait(900)
  const afterReturnAgent = await snapshot()

  const badErrors = errors.filter(e => /prepare|unscoped context|Cannot read properties of undefined|resume failed/i.test(e))
  const failures = []
  if (!beforeReload.hasHud || !beforeReload.hasGcConversationTab) failures.push('刷新前 Agent 群聊/HUD 未进入可验证状态')
  if (!afterReloadNewChat.hasComposer) failures.push('刷新后新会话官方 composer 不存在')
  if (afterReloadNewChat.hasHud) failures.push('刷新后新会话残留 HUD')
  if (afterReloadNewChat.hasGcConversationTab) failures.push('刷新后新会话残留 Agent 群聊视图')
  if (afterReloadNewChat.bodyFlags.tabActive || afterReloadNewChat.bodyFlags.hudOpen) failures.push('刷新后新会话残留扩展 body 标记')
  if (!afterReturnAgent.hasHud || !afterReturnAgent.hasGcConversationTab) failures.push('刷新后返回 Agent 群聊未恢复 HUD/中间视图')
  if (afterReturnAgent.bodyFlags.tabActive !== 'true') failures.push('刷新后返回 Agent 群聊未恢复 tabActive=true')
  if (badErrors.length) failures.push('出现历史回归错误：' + badErrors.join(' | '))

  return {ok: failures.length === 0, failures, beforeReload, afterReloadNewChat, afterReturnAgent, errors}
}
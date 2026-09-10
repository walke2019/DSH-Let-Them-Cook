async (page) => {
  const wait = ms => page.waitForTimeout(ms)
  await wait(500)
  return await page.evaluate(() => {
    const pick = sel => document.querySelector(sel)
    const visible = el => {
      if (!el) return false
      const r = el.getBoundingClientRect(); const st = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && r.left < innerWidth && r.right > 0 && st.display !== 'none' && st.visibility !== 'hidden'
    }
    const rect = el => { const r = el.getBoundingClientRect(); return {left:r.left,right:r.right,width:r.width,height:r.height} }
    const conversation = pick('.gc-conversation')
    const messages = pick('.gc-chat-messages')
    const composer = pick('.gc-composer')
    const hud = pick('.dsh-gc-sidebar-host')
    if (![conversation, messages, composer, hud].every(visible)) return {ok:false, found:{conversation:!!conversation, messages:!!messages, composer:!!composer, hud:!!hud}, bodyText:(document.body.innerText||'').slice(0,500)}
    const csConv = getComputedStyle(conversation)
    const csMsg = getComputedStyle(messages)
    const csComposer = getComputedStyle(composer)
    const convRect = rect(conversation)
    const hudRect = rect(hud)
    const contentRight = convRect.right - parseFloat(csConv.paddingRight)
    return {
      ok: true,
      messagePaddingLeft: csMsg.paddingLeft,
      messagePaddingRight: csMsg.paddingRight,
      composerPaddingLeft: csComposer.paddingLeft,
      composerPaddingRight: csComposer.paddingRight,
      conversationPaddingRight: csConv.paddingRight,
      hudLeft: Math.round(hudRect.left),
      conversationContentRight: Math.round(contentRight),
      hudSeamPx: Math.round(hudRect.left - contentRight),
      tabActive: document.body.getAttribute('data-dsh-group-chat-tab-active'),
      hudDockedOpen: document.body.getAttribute('data-dsh-group-chat-hud-docked-open')
    }
  })
}

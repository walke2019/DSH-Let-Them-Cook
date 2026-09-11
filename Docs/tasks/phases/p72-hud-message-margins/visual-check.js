async (page) => {
  const wait = ms => page.waitForTimeout(ms)
  await page.goto('http://127.0.0.1:3080/?token=-ILcwoYVWYAQgh-iAz8BnckdampjUcQ1zzyMXnuwf0Q', { waitUntil: 'domcontentloaded', timeout: 20000 })
  await wait(1500)
  const clickText = async (needle) => {
    const clicked = await page.evaluate((needle) => {
      const visible = el => { const r = el.getBoundingClientRect(); const st = getComputedStyle(el); return r.width > 0 && r.height > 0 && r.left < innerWidth && r.right > 0 && st.display !== 'none' && st.visibility !== 'hidden' }
      const hit = [...document.querySelectorAll('button,[role="tab"],a,span,div')].find(el => visible(el) && (el.textContent || '').trim().includes(needle))
      if (!hit) return false
      hit.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
      return true
    }, needle)
    await wait(700)
    return clicked
  }
  await clickText('Agent 群聊')
  await wait(900)
  const hudVisible = await page.evaluate(() => {
    const el = document.querySelector('.dsh-gc-sidebar-host')
    if (!el) return false
    const r = el.getBoundingClientRect(); const st = getComputedStyle(el)
    return r.width > 100 && r.left < innerWidth - 20 && st.visibility !== 'hidden'
  })
  if (!hudVisible) await clickText('群聊副屏')
  await wait(900)
  return await page.evaluate(() => {
    const rect = el => { const r = el.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height} }
    const conversation = document.querySelector('.gc-conversation')
    const messages = document.querySelector('.gc-chat-messages')
    const composer = document.querySelector('.gc-composer')
    const hud = document.querySelector('.dsh-gc-sidebar-host')
    const csConv = getComputedStyle(conversation)
    const csMsg = getComputedStyle(messages)
    const csComposer = getComputedStyle(composer)
    const convRect = rect(conversation)
    const hudRect = rect(hud)
    const contentRight = convRect.right - parseFloat(csConv.paddingRight)
    return {
      messagePaddingLeft: csMsg.paddingLeft,
      messagePaddingRight: csMsg.paddingRight,
      composerPaddingLeft: csComposer.paddingLeft,
      composerPaddingRight: csComposer.paddingRight,
      conversationPaddingRight: csConv.paddingRight,
      hudLeft: Math.round(hudRect.left),
      conversationContentRight: Math.round(contentRight),
      hudSeamPx: Math.round(hudRect.left - contentRight),
      tabActive: document.body.getAttribute('data-dsh-group-chat-tab-active'),
      hudDockedOpen: document.body.getAttribute('data-dsh-group-chat-hud-docked-open'),
    }
  })
}


async (page) => {
  await page.goto('http://127.0.0.1:3080/', {waitUntil:'domcontentloaded', timeout:20000})
  await page.waitForTimeout(2000)
  await page.evaluate(() => { const el = [...document.querySelectorAll('[title],button,div,span')].find(node => ((node.getAttribute('title') || '').includes('展开群聊')) || ((node.textContent || '').trim() === '群聊副屏')); if (el) el.click() })
  await page.waitForTimeout(1000)
  const data = await page.evaluate(() => {
    const hud = document.querySelector('.dsh-gc-sidebar-host')
    return {hud: !!hud, text:(hud?.innerText||hud?.textContent||document.body.innerText||'').slice(0,2000), buttons:[...document.querySelectorAll('.dsh-gc-sidebar-host button')].map(b=>b.textContent?.trim())}
  })
  return data
}

async (page) => {
  await page.goto('http://127.0.0.1:3080/', {waitUntil:'domcontentloaded', timeout:20000})
  await page.waitForTimeout(1500)
  const before = await page.evaluate(() => [...document.querySelectorAll('button,div,span')].map((el,i)=>({i,text:(el.textContent||'').trim().slice(0,80), title:el.getAttribute('title')||'', cls:typeof el.className==='string'?el.className.slice(0,80):'', rect:(()=>{const r=el.getBoundingClientRect(); return {l:Math.round(r.left),t:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)}})()})).filter(x=>x.text.includes('控制室')||x.text.includes('群聊')||x.title.includes('群聊')||x.cls.includes('dsh-gc')).slice(0,50))
  for (const txt of ['控制室','群聊副屏']) {
    const loc = page.getByText(txt, {exact:false}).first();
    if (await loc.isVisible().catch(()=>false)) { await loc.click().catch(()=>{}); await page.waitForTimeout(800); break }
  }
  const after = await page.evaluate(() => ({hud:!!document.querySelector('.dsh-gc-sidebar-host'), text:(document.body.innerText||'').slice(-2000), matches:[...document.querySelectorAll('button,div,span')].map((el,i)=>({i,text:(el.textContent||'').trim().slice(0,80), title:el.getAttribute('title')||'', cls:typeof el.className==='string'?el.className.slice(0,80):'', rect:(()=>{const r=el.getBoundingClientRect(); return {l:Math.round(r.left),t:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)}})()})).filter(x=>x.text.includes('团队')||x.text.includes('工作流')||x.text.includes('控制室')||x.text.includes('群聊')||x.title.includes('群聊')||x.cls.includes('dsh-gc')).slice(0,80)}))
  return {before, after}
}

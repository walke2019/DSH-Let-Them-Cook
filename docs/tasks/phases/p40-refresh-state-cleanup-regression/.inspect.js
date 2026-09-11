async (page) => await page.evaluate(() => ({ text: (document.body.innerText||'').slice(0,3000) }))

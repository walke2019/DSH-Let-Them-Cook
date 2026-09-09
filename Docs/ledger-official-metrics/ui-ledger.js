async()=>{
  await new Promise(r=>setTimeout(r,600));
  const closed=[...document.querySelectorAll('div,button')].find(e=>/特遣副屏/.test(e.textContent||''));
  if(closed) closed.click();
  await new Promise(r=>setTimeout(r,300));
  const roster=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('角色与账本'));
  roster?.click();
  await new Promise(r=>setTimeout(r,200));
  const host=document.querySelector('.dsh-gc-sidebar-host');
  const text=host?.textContent||'';
  const details=host?.querySelector('details');
  const summary=host?.querySelector('summary');
  return {hasOverall:text.includes('总体运行统计'), official:text.includes('官方摘要风格'), line:text.match(/\d+ 轮 · \d+ 步\s+LLM .*?输出 .*? tok/)?.[0]||'', hasDetails:!!details, summary:summary?.textContent||'', containsMetrics:['首 token 平均','缓存命中','输入','输出','工具调用'].every(x=>text.includes(x))};
}

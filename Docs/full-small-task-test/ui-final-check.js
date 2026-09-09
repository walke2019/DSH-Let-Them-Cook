async()=>{
  await new Promise(r=>setTimeout(r,700));
  const closed=[...document.querySelectorAll('div,button')].find(e=>/特遣副屏/.test(e.textContent||''));
  if(closed) closed.click();
  await new Promise(r=>setTimeout(r,250));
  const roster=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('角色与账本'));
  roster?.click();
  await new Promise(r=>setTimeout(r,250));
  const host=document.querySelector('.dsh-gc-sidebar-host');
  const text=host?.textContent||'';
  const select=[...host.querySelectorAll('select')].find(s=>s.getAttribute('aria-label')==='角色主题');
  const details=host.querySelector('details');
  details.open=true;
  await new Promise(r=>setTimeout(r,100));
  return {themeValue:select?.value, hasMeme:text.includes('沙雕整活'), hasGenshin:text.includes('原神提瓦特'), hasCreator:text.includes('AI 造主题角色 + 工作流'), hasLedger:text.includes('总体运行统计')&&text.includes('首 token 平均'), hasFold:text.includes('按 Agent / 模型展开'), hasFunnyRoles:text.includes('离谱总导演')&&text.includes('废话压缩师'), visibleLine:(text.match(/\d+ 轮 · \d+ 步\s+LLM .*?输出 .*? tok/)||[''])[0]};
}

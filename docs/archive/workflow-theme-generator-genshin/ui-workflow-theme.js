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
  const options=[...select.options].map(o=>o.textContent);
  const ta=host.querySelector('textarea');
  ta.value='原神风格的插件开发任务，做主题和工作流';
  ta.dispatchEvent(new Event('input',{bubbles:true}));
  const btn=[...host.querySelectorAll('button')].find(b=>(b.textContent||'').includes('生成草案'));
  btn.click();
  await new Promise(r=>setTimeout(r,700));
  const text2=host.textContent||'';
  return {options, hasGenshin:options.includes('原神提瓦特'), defaultMeme:select.value==='meme_comedy', hasCreator:text.includes('AI 造主题角色 + 工作流'), hasWorkflowPreview:text2.includes('工作流：')&&text2.includes('5 步'), canApply:text2.includes('套用这个草案')};
}

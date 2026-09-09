async()=>{
  await new Promise(r=>setTimeout(r,500));
  const closed=[...document.querySelectorAll('div,button')].find(e=>/特遣副屏/.test(e.textContent||''));
  if(closed) closed.click();
  await new Promise(r=>setTimeout(r,300));
  const btn=document.querySelector('[aria-label="查看调度模式 QA 说明"]');
  const top=document.querySelector('.dsh-gc-sidebar-host div[style*="grid-template-columns"]');
  const before={hasButton:!!btn, grid:top?.style.gridTemplateColumns||'', buttonTop:btn?Math.round(btn.getBoundingClientRect().top):0};
  btn?.click();
  await new Promise(r=>setTimeout(r,200));
  const dlg=document.querySelector('[aria-label="调度模式 QA 说明"]');
  const text=dlg?.textContent||'';
  const labels=top?[...top.children].slice(0,5).map(e=>({text:(e.textContent||'').replace(/\s+/g,''),top:Math.round(e.getBoundingClientRect().top),height:Math.round(e.getBoundingClientRect().height)})):[];
  return {before, dialog:!!dlg, contains:['仅 @ 角色','工作流','主持人调度','自由讨论','.pm-workflow/dsh-group-chat/','不是全局配置'].every(x=>text.includes(x)), labels};
}

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
  return {hasAiCreator:text.includes('AI 造主题角色'), hasMemeButton:text.includes('套用沙雕整活'), hasExample:text.includes('猫猫宇宙')||text.includes('东北烧烤摊'), hasFunnyRole:text.includes('离谱总导演')||text.includes('瓜田侦探'), hasEdit:[...host.querySelectorAll('button')].some(b=>(b.textContent||'').includes('编辑'))};
}

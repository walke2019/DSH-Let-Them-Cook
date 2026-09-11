async()=>{
  await new Promise(r=>setTimeout(r,700));
  const closed=[...document.querySelectorAll('div,button')].find(e=>/特遣副屏/.test(e.textContent||''));
  if(closed) closed.click();
  await new Promise(r=>setTimeout(r,300));
  const roster=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('角色与账本'));
  roster?.click();
  await new Promise(r=>setTimeout(r,250));
  const host=document.querySelector('.dsh-gc-sidebar-host');
  const name=[...host.querySelectorAll('*')].find(e=>(e.textContent||'').includes('诸葛亮'));
  const card=name?.closest('div[style*="justify-content: space-between"]') || name?.parentElement?.parentElement?.parentElement;
  const svg=card?.querySelector('[data-avatar-svg="feather-fan"]');
  const svgBox=svg?.getBoundingClientRect();
  return {hasName:!!name, hasFeatherSvg:!!svg, svgText:svg?.textContent||'', svgBox:svgBox?{width:Math.round(svgBox.width),height:Math.round(svgBox.height),left:Math.round(svgBox.left),top:Math.round(svgBox.top)}:null, cardText:(card?.textContent||'').slice(0,80)};
}

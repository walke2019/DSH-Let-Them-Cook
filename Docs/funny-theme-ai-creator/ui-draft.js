async()=>{
  const area=document.querySelector('.dsh-gc-sidebar-host');
  const ta=area.querySelector('textarea');
  ta.value='东北烧烤摊式研发部，嘴贫但活好';
  ta.dispatchEvent(new Event('input',{bubbles:true}));
  const btn=[...area.querySelectorAll('button')].find(b=>(b.textContent||'').includes('生成草案'));
  btn?.click();
  await new Promise(r=>setTimeout(r,700));
  const text=area.textContent||'';
  return {clicked:!!btn, hasPreview:text.includes('草案预览'), hasGenerated:text.includes('东北烧烤摊总控官')||text.includes('东北烧烤摊情报官'), canApply:text.includes('套用这个草案')};
}

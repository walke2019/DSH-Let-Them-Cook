async function(){
  await new Promise(r=>setTimeout(r,800));
  const selects=[...document.querySelectorAll('select')].map(s=>({label:s.getAttribute('aria-label'),value:s.value,options:[...s.options].map(o=>({value:o.value,text:o.textContent}))}));
  const theme=selects.find(s=>s.label==='角色主题');
  const mode=selects.find(s=>s.label==='调度模式');
  return {themeValue:theme?.value,themeFirst:theme?.options?.[0],modeValue:mode?.value,modeFirst:mode?.options?.[0],ok:theme?.value==='default'&&theme?.options?.[0]?.text?.includes('默认')&&mode?.value==='default'&&mode?.options?.[0]?.text?.includes('默认')};
}

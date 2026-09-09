async()=>{
 const area=document.querySelector('.dsh-gc-sidebar-host'); return {text:(area.textContent||'').match(/草案预览[\s\S]{0,300}/)?.[0]||''};
}

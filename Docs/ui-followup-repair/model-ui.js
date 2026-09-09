async () => {
 const wait=()=>new Promise(r=>setTimeout(r,250));
 document.querySelector('[title^="展开特遣协同副屏"]')?.click(); await wait();
 [...document.querySelectorAll('button')].find(e=>e.textContent==='角色与账本')?.click(); await wait();
 document.querySelector('[aria-label="编辑核心后端架构师"]')?.click(); await wait();
 const before=!!document.querySelector('.gc-model-popover');
 document.querySelector('.gc-model-trigger')?.click(); await wait();
 const input=document.querySelector('.gc-model-search'); input.value='codex'; input.dispatchEvent(new Event('input',{bubbles:true})); await wait();
 const options=[...document.querySelectorAll('.gc-model-option')].map(e=>e.textContent.trim()).slice(0,5);
 return {popoverOpened:!before&&!!document.querySelector('.gc-model-popover'),searchInput:!!input,options,hasCodex:options.some(t=>/codex/i.test(t)),chevronSvg:!!document.querySelector('.gc-mention-chevron')};
}

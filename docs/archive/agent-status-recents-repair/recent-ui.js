async () => {
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 document.querySelector('[title^="展开特遣协同副屏"]')?.click(); await wait(250);
 [...document.querySelectorAll('button')].find(e=>e.textContent==='角色与账本')?.click(); await wait(250);
 document.querySelector('[aria-label="编辑核心后端架构师"]')?.click(); await wait(350);
 document.querySelector('.gc-model-trigger')?.click(); await wait(250);
 const rows=[...document.querySelectorAll('.gc-model-recent-row')];
 return {recentRows:rows.length,deleteButtons:[...document.querySelectorAll('.gc-model-delete')].length,firstDeleteLabel:document.querySelector('.gc-model-delete')?.getAttribute('aria-label')||'',popover:!!document.querySelector('.gc-model-popover')};
}

async () => {
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 [...document.querySelectorAll('[role=tab]')].find(e=>e.textContent==='特遣协同')?.click(); await wait(300);
 document.querySelector('[title^="展开特遣协同副屏"]')?.click(); await wait(250);
 [...document.querySelectorAll('button')].find(e=>e.textContent==='角色与账本')?.click(); await wait(250);
 document.querySelector('[aria-label="编辑阿尔法总指挥官"]')?.click(); await wait(400);
 const rows=[...document.querySelectorAll('.gc-recent-chip-row')];
 const metrics=rows.map(row=>{const rr=row.getBoundingClientRect();const del=row.querySelector('.gc-recent-delete').getBoundingClientRect();return {rowWidth:Math.round(rr.width),deleteInside:del.left>=rr.left&&del.right<=rr.right,deleteRightGap:Math.round(rr.right-del.right),deleteWidth:Math.round(del.width)}});
 return {rows:rows.length,metrics,allInside:metrics.every(m=>m.deleteInside),nestedInteractive:!!document.querySelector('.gc-recent-chip .gc-model-delete')};
}

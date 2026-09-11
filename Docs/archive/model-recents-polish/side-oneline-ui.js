async () => {
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 [...document.querySelectorAll('[role=tab]')].find(e=>e.textContent==='特遣协同')?.click(); await wait(300);
 document.querySelector('[title^="展开特遣协同副屏"]')?.click(); await wait(250);
 const sidebar=document.querySelector('[aria-label="群聊管理侧栏"]');
 const block=[...sidebar.children][1];
 const labels=[...block.children].slice(0,4).map(e=>({text:e.textContent.trim(),top:Math.round(e.getBoundingClientRect().top),height:Math.round(e.getBoundingClientRect().height)}));
 return {grid:getComputedStyle(block).gridTemplateColumns,blockHeight:Math.round(block.getBoundingClientRect().height),labels,sameLine:new Set(labels.map(x=>x.top)).size===1,svgCount:block.querySelectorAll('svg').length};
}

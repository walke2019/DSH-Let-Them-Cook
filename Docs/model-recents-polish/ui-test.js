async () => {
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 [...document.querySelectorAll('[role=tab]')].find(e=>e.textContent==='特遣协同')?.click(); await wait(300);
 document.querySelector('[title^="展开特遣协同副屏"]')?.click(); await wait(250);
 const selectBlock=[...document.querySelectorAll('[aria-label="群聊管理侧栏"] > div')][1];
 const blockStyle=getComputedStyle(selectBlock);
 [...document.querySelectorAll('button')].find(e=>e.textContent==='角色与账本')?.click(); await wait(250);
 document.querySelector('[aria-label="编辑阿尔法总指挥官"]')?.click(); await wait(400);
 const chevronSvg=!!document.querySelector('svg.gc-model-chevron');
 const chevronText=[...document.querySelectorAll('.gc-model-chevron')].map(e=>e.textContent).join('');
 const recents=[...document.querySelectorAll('.gc-recent-chip')].map(e=>e.textContent.trim());
 const recentDelete=[...document.querySelectorAll('.gc-recent-panel .gc-model-delete')];
 const suggestions=[...document.querySelectorAll('.gc-suggestion-chip')].map(e=>e.textContent.trim());
 const sideSvgCount=selectBlock.querySelectorAll('svg').length;
 return {sideSelectGrid:blockStyle.gridTemplateColumns,sideSvgCount,chevronSvg,chevronText,recentChipCount:recents.length,recentDeleteCount:recentDelete.length,recentMaxOk:recents.length<=6,recents,suggestionChipCount:suggestions.length,suggestions};
}

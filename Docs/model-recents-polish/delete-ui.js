async () => {
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const before=[...document.querySelectorAll('.gc-recent-chip')].map(e=>e.textContent.trim());
 document.querySelector('.gc-recent-panel .gc-model-delete')?.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
 await wait(600);
 const after=[...document.querySelectorAll('.gc-recent-chip')].map(e=>e.textContent.trim());
 return {beforeCount:before.length,afterCount:after.length,before,after,deleted:after.length===Math.max(0,before.length-1)};
}

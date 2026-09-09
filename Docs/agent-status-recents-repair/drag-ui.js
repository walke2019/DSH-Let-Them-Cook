async () => {
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 [...document.querySelectorAll('[role=tab]')].find(e=>e.textContent==='特遣协同')?.click(); await wait(500);
 const float=document.querySelector('.gc-agent-float'); if(!float)return {error:'no float'};
 const before={left:getComputedStyle(float).left,top:getComputedStyle(float).top,stored:localStorage.getItem('dsh-group-chat.status-pos')};
 const rect=float.getBoundingClientRect();
 float.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7,clientX:rect.left+20,clientY:rect.top+12}));
 float.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:7,clientX:rect.left+96,clientY:rect.top+58}));
 float.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:7,clientX:rect.left+96,clientY:rect.top+58}));
 await wait(120);
 const after={left:getComputedStyle(float).left,top:getComputedStyle(float).top,stored:localStorage.getItem('dsh-group-chat.status-pos')};
 return {before,after,moved:before.left!==after.left||before.top!==after.top,dragLabel:float.textContent.includes('拖动')};
}

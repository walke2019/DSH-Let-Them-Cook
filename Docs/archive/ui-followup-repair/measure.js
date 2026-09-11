async () => {
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 [...document.querySelectorAll('[role=tab]')].find(e=>e.textContent==='特遣协同')?.click();
 await wait(600);
 const scroll=document.querySelector('.gc-chat-scroll');
 if(!scroll)return {error:'no scroll',tabs:[...document.querySelectorAll('[role=tab]')].map(e=>e.textContent)};
 scroll.scrollTop=scroll.scrollHeight/2; await wait(50);
 const bottom=document.querySelector('.gc-chat-bottom')?.getBoundingClientRect();
 const messages=[...document.querySelectorAll('.gc-message')];
 const overlapped=bottom?messages.filter(m=>{const r=m.getBoundingClientRect();return r.bottom>bottom.top&&r.top<bottom.bottom}).length:-1;
 scroll.scrollTop=scroll.scrollHeight; await wait(200);
 const last=[...document.querySelectorAll('.gc-message')].at(-1)?.getBoundingClientRect();
 const composer=document.querySelector('.gc-chat-bottom')?.getBoundingClientRect();
 return {messages:document.querySelectorAll('.gc-message').length,overlappedDuringPull:overlapped,bottomPadding:getComputedStyle(document.querySelector('.gc-chat-messages')).paddingBottom,remaining:scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight,lastAboveComposer:!!last&&!!composer&&last.bottom<=composer.top+1,font:getComputedStyle(document.querySelector('.gc-message-body')).fontSize,agentFloat:!!document.querySelector('.gc-agent-float'),rightDispatchText:[...document.body.querySelectorAll('*')].some(e=>e.textContent==='派发')};
}

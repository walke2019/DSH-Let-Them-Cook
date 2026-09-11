async () => {
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 [...document.querySelectorAll('[role=tab]')].find(e=>e.textContent==='特遣协同')?.click(); await wait(500);
 const box=document.querySelector('.gc-chat-messages'); if(!box)return {error:'no chat box'};
 box.innerHTML='<div class="gc-chat-thread" role="log">'+Array.from({length:32},(_,i)=>`<article class="gc-message gc-message-agent"><div class="gc-message-meta"><span class="gc-message-avatar">◇</span><span class="gc-message-role">滚动测试</span></div><div class="gc-message-body"><div><h3>第 ${i+1} 条</h3><p>这是浏览器 DOM 临时消息，用来确认上拉时输入框不覆盖正文。</p><ul><li>列表 A</li><li>列表 B</li></ul></div></div></article>`).join('')+'</div>';
 await wait(100);
 const scroll=document.querySelector('.gc-chat-scroll');scroll.scrollTop=scroll.scrollHeight/2; await wait(50);
 const bottom=document.querySelector('.gc-chat-bottom').getBoundingClientRect();
 const messages=[...document.querySelectorAll('.gc-message')];
 const overlapped=messages.filter(m=>{const r=m.getBoundingClientRect();return r.bottom>bottom.top&&r.top<bottom.bottom}).length;
 scroll.scrollTop=scroll.scrollHeight; await wait(200);
 const last=[...document.querySelectorAll('.gc-message')].at(-1).getBoundingClientRect();
 const composer=document.querySelector('.gc-chat-bottom').getBoundingClientRect();
 const out={messages:document.querySelectorAll('.gc-message').length,overlappedDuringPull:overlapped,bottomPadding:getComputedStyle(document.querySelector('.gc-chat-messages')).paddingBottom,remaining:scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight,lastAboveComposer:last.bottom<=composer.top+1,font:getComputedStyle(document.querySelector('.gc-message-body')).fontSize,agentFloat:!!document.querySelector('.gc-agent-float'),rightDispatchText:[...document.body.querySelectorAll('*')].some(e=>e.textContent==='派发')};
 return out;
}

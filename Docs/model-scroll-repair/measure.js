() => {
 const scroll=document.querySelector('.gc-chat-scroll');scroll.scrollTop=scroll.scrollHeight;
 const last=[...document.querySelectorAll('.gc-message')].at(-1),bottom=document.querySelector('.gc-chat-bottom');
 const out={messages:document.querySelectorAll('.gc-message').length,remaining:scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight,railBottom:scroll.getBoundingClientRect().bottom,panelBottom:document.querySelector('.gc-conversation').getBoundingClientRect().bottom,lastMessageBottom:last.getBoundingClientRect().bottom,composerTop:bottom.getBoundingClientRect().top,font:getComputedStyle(last.querySelector('p')).fontSize};
 scroll.scrollTop=0;return out;
}

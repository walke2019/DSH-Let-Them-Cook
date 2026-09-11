async()=>{
  const area=document.querySelector('.dsh-gc-sidebar-host');
  const btn=[...area.querySelectorAll('button')].find(b=>(b.textContent||'').includes('套用沙雕整活'));
  btn?.click();
  await new Promise(r=>setTimeout(r,600));
  const data=await fetch('/dsh-group-chat/api/room?id=dev-team-alpha').then(r=>r.json());
  return {clicked:!!btn, apiTheme:data.room.activeTheme, apiNames:data.room.members.slice(0,3).map(m=>m.name), hostHasFunny:(area.textContent||'').includes('离谱总导演')||(area.textContent||'').includes('瓜田侦探')};
}

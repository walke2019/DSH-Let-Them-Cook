async()=>{
  const data=await fetch('/dsh-group-chat/api/room?id=dev-team-alpha').then(r=>r.json());
  const area=document.querySelector('.dsh-gc-sidebar-host');
  const textarea=area?.querySelector('textarea');
  return {apiTheme:data.room.activeTheme, apiNames:data.room.members.slice(0,3).map(m=>m.name), textareaValue:textarea?.value||'', hostText:(area?.textContent||'').slice(0,500)};
}
